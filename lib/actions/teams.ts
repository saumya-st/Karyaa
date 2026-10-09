"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { cache } from "react";
import { MANAGER_ROLES, assertTeamRole, isAuthorizationError } from "@/lib/authz";
import { createTeamSchema, validate } from "@/lib/validation";

export async function createTeam(name: string) {
  const userId = await getCurrentUserId();

  const parsed = validate(createTeamSchema, { name });
  if (!parsed.success) return { error: parsed.error };

  const team = await prisma.team.create({
    data: {
      name: parsed.data.name,
      members: {
        create: {
          userId,
          role: "owner",
        },
      },
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/team");
  return { success: true, teamId: team.id };
}

export const getTeams = cache(async () => {
  const userId = await getCurrentUserId();
  return fetchTeams(userId);
});

async function fetchTeams(userId: string) {
  return prisma.team.findMany({
    where: {
      members: { some: { userId } },
    },
    include: {
      members: {
        include: {
          user: { select: { id: true, name: true, email: true, avatar: true } },
        },
      },
      _count: { select: { projects: true } },
    },
  });
}

export async function inviteToTeam(teamId: string, email: string) {
  const currentUserId = await getCurrentUserId();
  try {
    await assertTeamRole(currentUserId, teamId, MANAGER_ROLES);
  } catch (err) {
    if (isAuthorizationError(err)) return { error: "Only team owners and admins can invite members" };
    throw err;
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return { error: "User not found" };

  const existing = await prisma.teamMember.findUnique({
    where: { userId_teamId: { userId: user.id, teamId } },
  });
  if (existing) return { error: "User already in team" };

  await prisma.teamMember.create({
    data: { userId: user.id, teamId, role: "member" },
  });

  revalidatePath("/dashboard");
  return { success: true };
}

export async function removeFromTeam(teamId: string, userId: string) {
  const currentUserId = await getCurrentUserId();

  // Members may leave a team themselves; removing someone else needs owner/admin.
  if (userId !== currentUserId) {
    try {
      await assertTeamRole(currentUserId, teamId, MANAGER_ROLES);
    } catch (err) {
      if (isAuthorizationError(err)) return { error: "Only team owners and admins can remove members" };
      throw err;
    }
  }

  await prisma.teamMember.delete({
    where: { userId_teamId: { userId, teamId } },
  });
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteTeam(teamId: string) {
  const userId = await getCurrentUserId();

  // Only team owner can delete
  try {
    await assertTeamRole(userId, teamId, ["owner"]);
  } catch (err) {
    if (isAuthorizationError(err)) return { error: "Only the team owner can delete the team" };
    throw err;
  }

  // Cascade will delete projects, tasks, etc.
  await prisma.team.delete({ where: { id: teamId } });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/team");
  return { success: true };
}
