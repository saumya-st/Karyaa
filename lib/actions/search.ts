"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";

export async function searchTasks(query: string) {
  const userId = await getCurrentUserId();

  // Get teams for this user
  const teams = await prisma.teamMember.findMany({
    where: { userId },
    select: { teamId: true },
  });
  const teamIds = teams.map((t: { teamId: string }) => t.teamId);

  const tasks = await prisma.task.findMany({
    where: {
      project: { teamId: { in: teamIds } },
      OR: [
        { title: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
      ],
    },
    include: {
      project: { select: { id: true, name: true, color: true } },
      section: { select: { name: true } },
      assignee: { select: { id: true, name: true, avatar: true } },
      assignees: {
        include: {
          user: { select: { id: true, name: true, avatar: true } },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
    take: 20,
  });

  return tasks;
}

export async function searchProjects(query: string) {
  const userId = await getCurrentUserId();

  const teams = await prisma.teamMember.findMany({
    where: { userId },
    select: { teamId: true },
  });
  const teamIds = teams.map((t: { teamId: string }) => t.teamId);

  const projects = await prisma.project.findMany({
    where: {
      teamId: { in: teamIds },
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
      ],
    },
    include: {
      _count: { select: { tasks: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 10,
  });

  return projects;
}

export async function globalSearch(query: string) {
  if (!query.trim()) return { tasks: [], projects: [] };
  const [tasks, projects] = await Promise.all([
    searchTasks(query),
    searchProjects(query),
  ]);
  return { tasks, projects };
}
