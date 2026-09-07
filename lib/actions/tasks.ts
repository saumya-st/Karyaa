"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUserId, getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { syncTaskToAssignees, updateCalendarEvent, removeTaskFromCalendars } from "@/lib/google-calendar";

export async function createTask(formData: FormData) {
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const projectId = formData.get("projectId") as string;
  const sectionId = formData.get("sectionId") as string;
  const priority = (formData.get("priority") as string) || "medium";
  const dueDate = formData.get("dueDate") as string;
  const startDate = formData.get("startDate") as string;
  const trackingStatus = (formData.get("trackingStatus") as string) || "on_track";

  // Support multiple assignees
  const assigneeIds = formData.getAll("assigneeId") as string[];
  const validAssigneeIds = assigneeIds.filter((id) => id && id.trim() !== "");
  const primaryAssigneeId = validAssigneeIds[0] || null;

  if (!title || !projectId || !sectionId) {
    return { error: "Title, project, and section are required" };
  }

  // Parallel: user auth + last task order
  const [user, lastTask] = await Promise.all([
    getCurrentUser(),
    prisma.task.findFirst({ where: { sectionId }, orderBy: { order: "desc" } }),
  ]);

  const task = await prisma.task.create({
    data: {
      title,
      description: description || null,
      projectId,
      sectionId,
      creatorId: user.id,
      assigneeId: primaryAssigneeId,
      priority,
      dueDate: dueDate ? new Date(dueDate) : null,
      startDate: startDate ? new Date(startDate) : null,
      trackingStatus,
      order: (lastTask?.order ?? -1) + 1,
      assignees: validAssigneeIds.length > 0 ? {
        create: validAssigneeIds.map((userId) => ({ userId })),
      } : undefined,
    },
  });

  // Fire-and-forget: don't block the response for logs/notifications
  after(async () => {
    const notifyIds = validAssigneeIds.filter((id) => id !== user.id);
    await Promise.all([
      prisma.activityLog.create({
        data: { action: "created", details: JSON.stringify({ title }), taskId: task.id, userId: user.id },
      }),
      notifyIds.length > 0
        ? prisma.notification.createMany({
            data: notifyIds.map((assigneeId) => ({
              type: "assigned",
              message: `${user.name} assigned you to "${title}"`,
              link: `/dashboard/projects/${projectId}`,
              userId: assigneeId,
            })),
          })
        : Promise.resolve(),
    ]);

    // Google Calendar: sync task to all assignees
    if (validAssigneeIds.length > 0) {
      await syncTaskToAssignees(
        { id: task.id, title, description: description || null, startDate: startDate ? new Date(startDate) : null, dueDate: dueDate ? new Date(dueDate) : null, projectId },
        validAssigneeIds
      );
    }
  });

  revalidatePath(`/dashboard/projects/${projectId}`, "page");
  return { success: true, taskId: task.id };
}

export async function updateTask(taskId: string, data: {
  title?: string;
  description?: string;
  priority?: string;
  status?: string;
  dueDate?: string | null;
  startDate?: string | null;
  trackingStatus?: string;
  assigneeId?: string | null;
  sectionId?: string;
  order?: number;
  completed?: boolean;
}) {
  // Parallel: fetch user session + task at the same time
  const [user, task] = await Promise.all([
    getCurrentUser(),
    prisma.task.findUnique({ where: { id: taskId } }),
  ]);
  if (!task) return { error: "Task not found" };

  await prisma.task.update({
    where: { id: taskId },
    data: {
      ...data,
      dueDate: data.dueDate !== undefined
        ? (data.dueDate ? new Date(data.dueDate) : null)
        : undefined,
      startDate: data.startDate !== undefined
        ? (data.startDate ? new Date(data.startDate) : null)
        : undefined,
    },
  });

  // Fire-and-forget: activity logs + notifications don't block the response
  after(async () => {
    const logAndNotify: Promise<unknown>[] = [];

    if (data.completed !== undefined) {
      logAndNotify.push(
        prisma.activityLog.create({
          data: { action: data.completed ? "completed" : "uncompleted", taskId, userId: user.id },
        })
      );
      if (data.completed && task.creatorId !== user.id) {
        logAndNotify.push(
          prisma.notification.create({
            data: {
              type: "completed",
              message: `${user.name} completed "${task.title}"`,
              link: `/dashboard/projects/${task.projectId}`,
              userId: task.creatorId,
            },
          })
        );
      }
    }

    if (data.assigneeId !== undefined && data.assigneeId !== task.assigneeId) {
      logAndNotify.push(
        prisma.activityLog.create({
          data: { action: "assigned", details: JSON.stringify({ assigneeId: data.assigneeId }), taskId, userId: user.id },
        })
      );
      if (data.assigneeId && data.assigneeId !== user.id) {
        logAndNotify.push(
          prisma.notification.create({
            data: {
              type: "assigned",
              message: `${user.name} assigned you to "${task.title}"`,
              link: `/dashboard/projects/${task.projectId}`,
              userId: data.assigneeId,
            },
          })
        );
      }
    }

    if (data.priority && data.priority !== task.priority) {
      logAndNotify.push(
        prisma.activityLog.create({
          data: { action: "updated", details: JSON.stringify({ field: "priority", from: task.priority, to: data.priority }), taskId, userId: user.id },
        })
      );
    }

    if (logAndNotify.length > 0) await Promise.all(logAndNotify);
  });

  revalidatePath(`/dashboard/projects/${task.projectId}`, "page");
  revalidatePath("/dashboard/my-tasks", "page");

  // Google Calendar: update event if due date, start date, or title changed
  after(async () => {
    if (task.calendarEventId && (data.title || data.dueDate !== undefined || data.startDate !== undefined || data.description !== undefined)) {
      const assignees = await prisma.taskAssignee.findMany({ where: { taskId }, select: { userId: true } });
      for (const { userId: uid } of assignees) {
        await updateCalendarEvent(uid, task.calendarEventId!, {
          title: data.title || task.title,
          description: data.description !== undefined ? (data.description ?? null) : task.description,
          startDate: data.startDate !== undefined ? (data.startDate ? new Date(data.startDate) : null) : task.startDate,
          dueDate: data.dueDate !== undefined ? (data.dueDate ? new Date(data.dueDate) : null) : task.dueDate,
          projectId: task.projectId,
        });
      }
    }
  });
  return { success: true };
}

export async function deleteTask(taskId: string) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { assignees: { select: { userId: true } } },
  });
  if (!task) return { error: "Task not found" };

  // Remove calendar events before deleting
  if (task.calendarEventId) {
    const assigneeIds = task.assignees.map((a) => a.userId);
    after(() => removeTaskFromCalendars(taskId, task.calendarEventId, assigneeIds));
  }

  await prisma.task.delete({ where: { id: taskId } });
  revalidatePath(`/dashboard/projects/${task.projectId}`, "page");
  revalidatePath("/dashboard/my-tasks", "page");
  return { success: true };
}

export async function moveTask(taskId: string, newSectionId: string, newOrder: number) {
  // Parallel: get user, task, and new section all at once
  const [user, task, newSection] = await Promise.all([
    getCurrentUser(),
    prisma.task.findUnique({ where: { id: taskId }, include: { section: true } }),
    prisma.section.findUnique({ where: { id: newSectionId } }),
  ]);
  if (!task) return;

  await prisma.task.update({
    where: { id: taskId },
    data: { sectionId: newSectionId, order: newOrder },
  });

  if (task.sectionId !== newSectionId && newSection) {
    after(() =>
      prisma.activityLog.create({
        data: {
          action: "moved",
          details: JSON.stringify({ from: task.section.name, to: newSection.name }),
          taskId,
          userId: user.id,
        },
      })
    );
  }

  revalidatePath(`/dashboard/projects/${task.projectId}`, "page");
}

export async function getTask(taskId: string) {
  return prisma.task.findUnique({
    where: { id: taskId },
    include: {
      assignee: { select: { id: true, name: true, email: true, avatar: true } },
      assignees: {
        include: {
          user: { select: { id: true, name: true, email: true, avatar: true } },
        },
      },
      creator: { select: { id: true, name: true, email: true, avatar: true } },
      comments: {
        orderBy: { createdAt: "asc" },
        include: {
          author: { select: { id: true, name: true, email: true, avatar: true } },
        },
      },
      attachments: {
        orderBy: { createdAt: "desc" },
        include: {
          uploadedBy: { select: { id: true, name: true } },
        },
      },
      subtasks: {
        orderBy: { order: "asc" },
        include: {
          assignee: { select: { id: true, name: true, avatar: true } },
        },
      },
      tags: {
        include: { tag: true },
      },
      taskProjects: {
        include: {
          project: { select: { id: true, name: true, color: true } },
          section: { select: { id: true, name: true } },
        },
      },
      section: true,
      project: { select: { id: true, name: true } },
    },
  });
}

export async function getFilteredTasks(projectId: string, filters: {
  assigneeId?: string;
  priority?: string;
  completed?: boolean;
  search?: string;
}) {
  const where: Record<string, unknown> = { projectId };

  if (filters.assigneeId) where.assigneeId = filters.assigneeId;
  if (filters.priority) where.priority = filters.priority;
  if (filters.completed !== undefined) where.completed = filters.completed;
  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: "insensitive" } },
      { description: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  return prisma.task.findMany({
    where,
    include: {
      assignee: { select: { id: true, name: true, avatar: true, email: true } },
      assignees: {
        include: {
          user: { select: { id: true, name: true, avatar: true, email: true } },
        },
      },
      section: { select: { id: true, name: true } },
      _count: { select: { comments: true, attachments: true, subtasks: true, taskProjects: true } },
      tags: { include: { tag: true } },
    },
    orderBy: { order: "asc" },
  });
}

export async function addTaskAssignee(taskId: string, userId: string) {
  // Parallel: user auth + task lookup + existing assignee check
  const [user, task, existing] = await Promise.all([
    getCurrentUser(),
    prisma.task.findUnique({ where: { id: taskId } }),
    prisma.taskAssignee.findUnique({ where: { taskId_userId: { taskId, userId } } }),
  ]);
  if (!task) return { error: "Task not found" };
  if (existing) return { error: "User already assigned" };

  await prisma.taskAssignee.create({
    data: { taskId, userId },
  });

  // If no primary assignee, set this one
  if (!task.assigneeId) {
    await prisma.task.update({
      where: { id: taskId },
      data: { assigneeId: userId },
    });
  }

  after(async () => {
    const jobs: Promise<unknown>[] = [
      prisma.activityLog.create({
        data: { action: "assigned", details: JSON.stringify({ assigneeId: userId }), taskId, userId: user.id },
      }),
    ];
    if (userId !== user.id) {
      jobs.push(
        prisma.notification.create({
          data: {
            type: "assigned",
            message: `${user.name} assigned you to "${task.title}"`,
            link: `/dashboard/projects/${task.projectId}`,
            userId,
          },
        })
      );
    }
    await Promise.all(jobs);
  });

  revalidatePath(`/dashboard/projects/${task.projectId}`, "page");
  revalidatePath("/dashboard/my-tasks", "page");
  return { success: true };
}

export async function removeTaskAssignee(taskId: string, userId: string) {
  const [user, task] = await Promise.all([
    getCurrentUser(),
    prisma.task.findUnique({ where: { id: taskId } }),
  ]);
  if (!task) return { error: "Task not found" };

  await prisma.taskAssignee.deleteMany({
    where: { taskId, userId },
  });

  // If removing the primary assignee, update to next assignee or null
  if (task.assigneeId === userId) {
    const nextAssignee = await prisma.taskAssignee.findFirst({
      where: { taskId },
    });
    await prisma.task.update({
      where: { id: taskId },
      data: { assigneeId: nextAssignee?.userId || null },
    });
  }

  after(() =>
    prisma.activityLog.create({
      data: { action: "assigned", details: JSON.stringify({ removed: userId }), taskId, userId: user.id },
    })
  );

  revalidatePath(`/dashboard/projects/${task.projectId}`, "page");
  revalidatePath("/dashboard/my-tasks", "page");
  return { success: true };
}

export async function updateTaskAssignees(taskId: string, userIds: string[]) {
  const [user, task] = await Promise.all([
    getCurrentUser(),
    prisma.task.findUnique({ where: { id: taskId }, include: { assignees: true } }),
  ]);
  if (!task) return { error: "Task not found" };

  const currentIds = task.assignees.map((a) => a.userId);
  const toAdd = userIds.filter((id) => !currentIds.includes(id));
  const toRemove = currentIds.filter((id) => !userIds.includes(id));

  // Remove
  if (toRemove.length > 0) {
    await prisma.taskAssignee.deleteMany({
      where: { taskId, userId: { in: toRemove } },
    });
  }

  // Add
  if (toAdd.length > 0) {
    await prisma.taskAssignee.createMany({
      data: toAdd.map((userId) => ({ taskId, userId })),
    });
  }

  // Update primary assignee
  const primaryAssignee = userIds[0] || null;
  await prisma.task.update({
    where: { id: taskId },
    data: { assigneeId: primaryAssignee },
  });

  after(async () => {
    const notifyIds = toAdd.filter((id) => id !== user.id);
    await Promise.all([
      prisma.activityLog.create({
        data: { action: "assigned", details: JSON.stringify({ assignees: userIds }), taskId, userId: user.id },
      }),
      notifyIds.length > 0
        ? prisma.notification.createMany({
            data: notifyIds.map((uid) => ({
              type: "assigned",
              message: `${user.name} assigned you to "${task.title}"`,
              link: `/dashboard/projects/${task.projectId}`,
              userId: uid,
            })),
          })
        : Promise.resolve(),
    ]);
  });

  revalidatePath(`/dashboard/projects/${task.projectId}`, "page");
  revalidatePath("/dashboard/my-tasks", "page");

  // Google Calendar: sync for newly added assignees, remove for removed
  after(async () => {
    if (toAdd.length > 0) {
      await syncTaskToAssignees(
        { id: taskId, title: task.title, description: task.description, startDate: task.startDate, dueDate: task.dueDate, projectId: task.projectId, calendarEventId: task.calendarEventId },
        toAdd
      );
    }
    if (toRemove.length > 0 && task.calendarEventId) {
      const { deleteCalendarEvent } = await import("@/lib/google-calendar");
      for (const uid of toRemove) {
        await deleteCalendarEvent(uid, task.calendarEventId);
      }
    }
  });
  return { success: true };
}

export type MyTaskItem = {
  id: string;
  title: string;
  priority: string;
  dueDate: Date | null;
  completed: boolean;
  project: { id: string; name: string; color: string };
};

export type MyTasksResult = {
  upcoming: MyTaskItem[];
  overdue: MyTaskItem[];
  completed: MyTaskItem[];
  completedThisWeek: MyTaskItem[];
  total: number;
};

export async function getMyTasks(): Promise<MyTasksResult> {
  const userId = await getCurrentUserId();
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  const raw = await prisma.task.findMany({
    where: {
      OR: [
        { assigneeId: userId },
        { assignees: { some: { userId } } },
      ],
    },
    include: {
      project: { select: { id: true, name: true, color: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const tasks: MyTaskItem[] = raw.map((t) => ({
    id: t.id,
    title: t.title,
    priority: t.priority,
    dueDate: t.dueDate,
    completed: t.completed,
    project: { id: t.project.id, name: t.project.name, color: t.project.color },
  }));

  const upcoming = tasks.filter(
    (t) => !t.completed && (!t.dueDate || t.dueDate >= now)
  );
  const overdue = tasks.filter(
    (t) => !t.completed && t.dueDate !== null && t.dueDate < now
  );
  const completed = tasks.filter((t) => t.completed);
  const completedThisWeek = raw
    .filter((t) => t.completed && t.updatedAt >= startOfWeek && t.updatedAt <= endOfWeek)
    .map((t): MyTaskItem => ({
      id: t.id,
      title: t.title,
      priority: t.priority,
      dueDate: t.dueDate,
      completed: t.completed,
      project: { id: t.project.id, name: t.project.name, color: t.project.color },
    }));

  return { upcoming, overdue, completed, completedThisWeek, total: tasks.length };
}
