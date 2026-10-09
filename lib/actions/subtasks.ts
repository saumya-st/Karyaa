"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { assertProjectMember, assertTaskMember } from "@/lib/authz";

export async function createSubtask(taskId: string, title: string) {
  const userId = await getCurrentUserId();

  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) return { error: "Task not found" };
  await assertProjectMember(userId, task.projectId);

  const lastSubtask = await prisma.subtask.findFirst({
    where: { taskId },
    orderBy: { order: "desc" },
  });

  const subtask = await prisma.subtask.create({
    data: {
      title,
      taskId,
      order: (lastSubtask?.order ?? -1) + 1,
    },
  });

  after(() =>
    prisma.activityLog.create({
      data: { action: "subtask_added", details: JSON.stringify({ subtaskTitle: title }), taskId, userId },
    })
  );

  revalidatePath(`/dashboard/projects/${task.projectId}`, "page");
  return { success: true, subtask };
}

export async function toggleSubtask(subtaskId: string) {
  const userId = await getCurrentUserId();

  const subtask = await prisma.subtask.findUnique({
    where: { id: subtaskId },
    include: { task: true },
  });
  if (!subtask) return { error: "Subtask not found" };
  await assertProjectMember(userId, subtask.task.projectId);

  await prisma.subtask.update({
    where: { id: subtaskId },
    data: { completed: !subtask.completed },
  });

  after(() =>
    prisma.activityLog.create({
      data: {
        action: subtask.completed ? "subtask_uncompleted" : "subtask_completed",
        details: JSON.stringify({ subtaskTitle: subtask.title }),
        taskId: subtask.taskId,
        userId,
      },
    })
  );

  revalidatePath(`/dashboard/projects/${subtask.task.projectId}`, "page");
  return { success: true };
}

export async function deleteSubtask(subtaskId: string) {
  const userId = await getCurrentUserId();
  const subtask = await prisma.subtask.findUnique({
    where: { id: subtaskId },
    include: { task: true },
  });
  if (!subtask) return { error: "Subtask not found" };
  await assertProjectMember(userId, subtask.task.projectId);

  await prisma.subtask.delete({ where: { id: subtaskId } });
  revalidatePath(`/dashboard/projects/${subtask.task.projectId}`, "page");
  return { success: true };
}

export async function updateSubtask(subtaskId: string, data: { title?: string; assigneeId?: string | null }) {
  const userId = await getCurrentUserId();
  const subtask = await prisma.subtask.findUnique({
    where: { id: subtaskId },
    include: { task: true },
  });
  if (!subtask) return { error: "Subtask not found" };
  await assertProjectMember(userId, subtask.task.projectId);

  await prisma.subtask.update({
    where: { id: subtaskId },
    data,
  });

  revalidatePath(`/dashboard/projects/${subtask.task.projectId}`, "page");
  return { success: true };
}

export async function getSubtasks(taskId: string) {
  const userId = await getCurrentUserId();
  await assertTaskMember(userId, taskId);
  return prisma.subtask.findMany({
    where: { taskId },
    orderBy: { order: "asc" },
    include: {
      assignee: { select: { id: true, name: true, avatar: true } },
    },
  });
}
