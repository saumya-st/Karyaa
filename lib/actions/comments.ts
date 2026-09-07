"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { after } from "next/server";

export async function addComment(taskId: string, content: string) {
  const user = await getCurrentUser();

  const comment = await prisma.comment.create({
    data: {
      content,
      taskId,
      authorId: user.id,
    },
    include: {
      author: { select: { id: true, name: true, email: true, avatar: true } },
    },
  });

  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (task) {
    // Fire-and-forget logs + notifications so the response isn't blocked
    after(async () => {
      const jobs: Promise<unknown>[] = [
        prisma.activityLog.create({
          data: { action: "commented", details: JSON.stringify({ content: content.substring(0, 100) }), taskId, userId: user.id },
        }),
      ];
      if (task.creatorId !== user.id) {
        jobs.push(
          prisma.notification.create({
            data: { type: "commented", message: `${user.name} commented on "${task.title}"`, link: `/dashboard/projects/${task.projectId}`, userId: task.creatorId },
          })
        );
      }
      if (task.assigneeId && task.assigneeId !== user.id && task.assigneeId !== task.creatorId) {
        jobs.push(
          prisma.notification.create({
            data: { type: "commented", message: `${user.name} commented on "${task.title}"`, link: `/dashboard/projects/${task.projectId}`, userId: task.assigneeId },
          })
        );
      }
      await Promise.all(jobs);
    });

    revalidatePath(`/dashboard/projects/${task.projectId}`, "page");
  }

  return comment;
}

export async function deleteComment(commentId: string) {
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    include: { task: true },
  });
  if (!comment) return;

  await prisma.comment.delete({ where: { id: commentId } });
  revalidatePath(`/dashboard/projects/${comment.task.projectId}`, "page");
}

export async function addAttachment(taskId: string, data: {
  filename: string;
  url: string;
  size: number;
  mimeType: string;
}) {
  const user = await getCurrentUser();

  const attachment = await prisma.attachment.create({
    data: {
      ...data,
      taskId,
      uploadedById: user.id,
    },
  });

  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (task) {
    after(() =>
      prisma.activityLog.create({
        data: { action: "attachment_added", details: JSON.stringify({ filename: data.filename }), taskId, userId: user.id },
      })
    );
    revalidatePath(`/dashboard/projects/${task.projectId}`, "page");
  }

  return attachment;
}

export async function deleteAttachment(attachmentId: string) {
  const attachment = await prisma.attachment.findUnique({
    where: { id: attachmentId },
    include: { task: true },
  });
  if (!attachment) return;

  await prisma.attachment.delete({ where: { id: attachmentId } });
  revalidatePath(`/dashboard/projects/${attachment.task.projectId}`, "page");
}
