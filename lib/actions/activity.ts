"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { assertTaskMember } from "@/lib/authz";

export async function logActivity(taskId: string, action: string, details?: string) {
  const userId = await getCurrentUserId();
  await assertTaskMember(userId, taskId);
  await prisma.activityLog.create({
    data: { action, details, taskId, userId },
  });
}

export async function getTaskActivities(taskId: string) {
  const userId = await getCurrentUserId();
  await assertTaskMember(userId, taskId);
  return prisma.activityLog.findMany({
    where: { taskId },
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, name: true, avatar: true } },
    },
    take: 50,
  });
}

export async function getRecentActivities() {
  const userId = await getCurrentUserId();

  // Get teams for this user
  const teams = await prisma.teamMember.findMany({
    where: { userId },
    select: { teamId: true },
  });
  const teamIds = teams.map((t: { teamId: string }) => t.teamId);

  // Get projects in those teams
  const projects = await prisma.project.findMany({
    where: { teamId: { in: teamIds } },
    select: { id: true },
  });
  const projectIds = projects.map((p: { id: string }) => p.id);

  return prisma.activityLog.findMany({
    where: { task: { projectId: { in: projectIds } } },
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, name: true, avatar: true } },
      task: { select: { id: true, title: true, projectId: true, project: { select: { name: true } } } },
    },
    take: 30,
  });
}
