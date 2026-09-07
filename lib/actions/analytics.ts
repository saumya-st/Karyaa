"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";

export async function getAnalytics() {
  const userId = await getCurrentUserId();

  // Get user's teams
  const teams = await prisma.teamMember.findMany({
    where: { userId },
    select: { teamId: true },
  });
  const teamIds = teams.map((t: { teamId: string }) => t.teamId);

  // Get all projects in those teams
  const projects = await prisma.project.findMany({
    where: { teamId: { in: teamIds } },
    include: {
      _count: { select: { tasks: true } },
      tasks: {
        select: {
          completed: true,
          priority: true,
          dueDate: true,
          createdAt: true,
          assigneeId: true,
        },
      },
    },
  });

  // Calculate analytics
  const totalProjects = projects.length;
  const totalTasks = projects.reduce((sum: number, p) => sum + p.tasks.length, 0);
  const completedTasks = projects.reduce(
    (sum: number, p) => sum + p.tasks.filter((t: { completed: boolean }) => t.completed).length,
    0
  );
  const overdueTasks = projects.reduce(
    (sum: number, p) =>
      sum +
      p.tasks.filter(
        (t: { dueDate: Date | null; completed: boolean }) =>
          t.dueDate && new Date(t.dueDate) < new Date() && !t.completed
      ).length,
    0
  );

  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Priority distribution
  const priorityDistribution = { low: 0, medium: 0, high: 0, urgent: 0 };
  projects.forEach((p) => {
    p.tasks.forEach((t: { priority: string }) => {
      if (t.priority in priorityDistribution) {
        priorityDistribution[t.priority as keyof typeof priorityDistribution]++;
      }
    });
  });

  // Tasks created per day (last 7 days)
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const recentTasks = projects.flatMap((p) =>
    p.tasks.filter((t: { createdAt: Date }) => new Date(t.createdAt) >= sevenDaysAgo)
  );

  const tasksByDay: Record<string, number> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    tasksByDay[key] = 0;
  }
  recentTasks.forEach((t: { createdAt: Date }) => {
    const key = new Date(t.createdAt).toISOString().split("T")[0];
    if (key in tasksByDay) tasksByDay[key]++;
  });

  // Project completion rates
  const projectStats = projects.map((p) => {
    const total = p.tasks.length;
    const done = p.tasks.filter((t: { completed: boolean }) => t.completed).length;
    return {
      id: p.id,
      name: p.name,
      color: p.color,
      totalTasks: total,
      completedTasks: done,
      completionRate: total > 0 ? Math.round((done / total) * 100) : 0,
    };
  });

  // Team member workload
  const memberWorkload: Record<string, number> = {};
  projects.forEach((p) => {
    p.tasks.forEach((t: { assigneeId: string | null; completed: boolean }) => {
      if (t.assigneeId && !t.completed) {
        memberWorkload[t.assigneeId] = (memberWorkload[t.assigneeId] || 0) + 1;
      }
    });
  });

  return {
    totalProjects,
    totalTasks,
    completedTasks,
    overdueTasks,
    completionRate,
    priorityDistribution,
    tasksByDay,
    projectStats,
    memberWorkload,
  };
}
