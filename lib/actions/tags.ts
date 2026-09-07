"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function createTag(name: string, color?: string) {
  await getCurrentUserId();

  const existing = await prisma.tag.findUnique({ where: { name } });
  if (existing) return { error: "Tag already exists", tag: existing };

  const tag = await prisma.tag.create({
    data: { name, color: color || "#6b7280" },
  });

  return { success: true, tag };
}

export async function getTags() {
  return prisma.tag.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { tasks: true } } },
  });
}

export async function addTagToTask(taskId: string, tagId: string) {
  await getCurrentUserId();

  const existing = await prisma.taskTag.findUnique({
    where: { taskId_tagId: { taskId, tagId } },
  });
  if (existing) return { error: "Tag already on task" };

  await prisma.taskTag.create({
    data: { taskId, tagId },
  });

  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (task) {
    revalidatePath(`/dashboard/projects/${task.projectId}`, "page");
  }
  return { success: true };
}

export async function removeTagFromTask(taskId: string, tagId: string) {
  await prisma.taskTag.deleteMany({
    where: { taskId, tagId },
  });

  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (task) {
    revalidatePath(`/dashboard/projects/${task.projectId}`, "page");
  }
  return { success: true };
}

export async function getTaskTags(taskId: string) {
  const taskTags = await prisma.taskTag.findMany({
    where: { taskId },
    include: { tag: true },
  });
  return taskTags.map((tt: { tag: { id: string; name: string; color: string } }) => tt.tag);
}

export async function deleteTag(tagId: string) {
  await prisma.tag.delete({ where: { id: tagId } });
  return { success: true };
}
