import { prisma } from "@/lib/prisma";

/**
 * Server-side authorization helpers.
 *
 * Every Server Action that receives a projectId / taskId / teamId from the
 * client must verify that the calling user actually belongs to the team that
 * owns the resource. Authentication (getCurrentUserId) only proves *who* is
 * calling; these helpers prove *what they may touch*.
 *
 * All helpers throw an AuthorizationError when the check fails. A missing
 * resource is reported the same way as a forbidden one so that ids cannot be
 * probed for existence.
 */

export type TeamRole = "owner" | "admin" | "member" | "guest";

/** Roles allowed to manage a team: invite / remove members, delete projects. */
export const MANAGER_ROLES: readonly TeamRole[] = ["owner", "admin"];

export class AuthorizationError extends Error {
  readonly status = 403 as const;

  constructor(message = "You do not have permission to perform this action") {
    super(message);
    this.name = "AuthorizationError";
  }
}

export function isAuthorizationError(error: unknown): error is AuthorizationError {
  return error instanceof AuthorizationError;
}

export interface TeamMembership {
  teamId: string;
  role: TeamRole;
}

export interface ProjectMembership extends TeamMembership {
  projectId: string;
}

export interface TaskMembership extends ProjectMembership {
  taskId: string;
}

function asRole(role: string): TeamRole {
  return role as TeamRole;
}

/** Returns the caller's membership in a team, or null when not a member. */
export async function getTeamMembership(
  userId: string,
  teamId: string
): Promise<TeamMembership | null> {
  const membership = await prisma.teamMember.findUnique({
    where: { userId_teamId: { userId, teamId } },
    select: { role: true },
  });
  return membership ? { teamId, role: asRole(membership.role) } : null;
}

/** Throws unless `userId` is a member (any role) of `teamId`. */
export async function assertTeamMember(
  userId: string,
  teamId: string
): Promise<TeamMembership> {
  const membership = await getTeamMembership(userId, teamId);
  if (!membership) {
    throw new AuthorizationError("You are not a member of this team");
  }
  return membership;
}

/** Throws unless `userId` holds one of `roles` in `teamId`. */
export async function assertTeamRole(
  userId: string,
  teamId: string,
  roles: readonly TeamRole[]
): Promise<TeamMembership> {
  const membership = await assertTeamMember(userId, teamId);
  if (!roles.includes(membership.role)) {
    throw new AuthorizationError(
      `This action requires one of the following team roles: ${roles.join(", ")}`
    );
  }
  return membership;
}

/** Throws unless `userId` belongs to the team that owns `projectId`. */
export async function assertProjectMember(
  userId: string,
  projectId: string
): Promise<ProjectMembership> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { teamId: true },
  });
  if (!project) {
    throw new AuthorizationError("Project not found or access denied");
  }
  const membership = await assertTeamMember(userId, project.teamId);
  return { ...membership, projectId };
}

/** Throws unless `userId` holds one of `roles` in the team owning `projectId`. */
export async function assertProjectRole(
  userId: string,
  projectId: string,
  roles: readonly TeamRole[]
): Promise<ProjectMembership> {
  const membership = await assertProjectMember(userId, projectId);
  if (!roles.includes(membership.role)) {
    throw new AuthorizationError(
      `This action requires one of the following team roles: ${roles.join(", ")}`
    );
  }
  return membership;
}

/** Throws unless `userId` belongs to the team that owns the task's project. */
export async function assertTaskMember(
  userId: string,
  taskId: string
): Promise<TaskMembership> {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { projectId: true, project: { select: { teamId: true } } },
  });
  if (!task) {
    throw new AuthorizationError("Task not found or access denied");
  }
  const membership = await assertTeamMember(userId, task.project.teamId);
  return { ...membership, projectId: task.projectId, taskId };
}

/** Throws unless `userId` belongs to the team that owns the section's project. */
export async function assertSectionMember(
  userId: string,
  sectionId: string
): Promise<ProjectMembership> {
  const section = await prisma.section.findUnique({
    where: { id: sectionId },
    select: { projectId: true, project: { select: { teamId: true } } },
  });
  if (!section) {
    throw new AuthorizationError("Section not found or access denied");
  }
  const membership = await assertTeamMember(userId, section.project.teamId);
  return { ...membership, projectId: section.projectId };
}
