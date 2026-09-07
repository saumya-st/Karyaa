"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { cache } from "react";

export async function createNotification(userId: string, type: string, message: string, link?: string) {
  await prisma.notification.create({
    data: { type, message, link, userId },
  });
}

export async function getNotifications() {
  const userId = await getCurrentUserId();
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export const getUnreadCount = cache(async () => {
  const userId = await getCurrentUserId();
  return prisma.notification.count({
    where: { userId, read: false },
  });
});

export async function markAsRead(notificationId: string) {
  const userId = await getCurrentUserId();
  await prisma.notification.update({
    where: { id: notificationId },
    data: { read: true },
  });
  revalidatePath("/dashboard/inbox");
  revalidatePath("/dashboard");
}

export async function markAllAsRead() {
  const userId = await getCurrentUserId();
  await prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });
  revalidatePath("/dashboard/inbox");
  revalidatePath("/dashboard");
}

export async function deleteNotification(notificationId: string) {
  await prisma.notification.delete({ where: { id: notificationId } });
  revalidatePath("/dashboard/inbox");
}

// Helper: notify user when assigned to a task
export async function notifyAssignment(assigneeId: string, taskTitle: string, projectId: string) {
  await createNotification(
    assigneeId,
    "assigned",
    `You were assigned to "${taskTitle}"`,
    `/dashboard/projects/${projectId}`
  );
}

// Helper: notify task creator when someone comments
export async function notifyComment(taskCreatorId: string, commenterName: string, taskTitle: string, projectId: string) {
  await createNotification(
    taskCreatorId,
    "commented",
    `${commenterName} commented on "${taskTitle}"`,
    `/dashboard/projects/${projectId}`
  );
}

// Helper: notify when task is completed
export async function notifyCompletion(taskCreatorId: string, completerName: string, taskTitle: string, projectId: string) {
  await createNotification(
    taskCreatorId,
    "completed",
    `${completerName} completed "${taskTitle}"`,
    `/dashboard/projects/${projectId}`
  );
}
