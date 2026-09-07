import { google } from "googleapis";
import { prisma } from "@/lib/prisma";

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
);

/**
 * Get an authenticated OAuth2 client for a user using their stored Account tokens.
 * Returns null if the user has no Google account linked.
 */
async function getAuthClient(userId: string) {
  const account = await prisma.account.findFirst({
    where: { userId, provider: "google" },
  });

  if (!account?.access_token || !account?.refresh_token) return null;

  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  client.setCredentials({
    access_token: account.access_token,
    refresh_token: account.refresh_token,
    expiry_date: account.expires_at ? account.expires_at * 1000 : undefined,
  });

  // Listen for token refresh events and persist new tokens
  client.on("tokens", async (tokens) => {
    const updateData: Record<string, unknown> = {};
    if (tokens.access_token) updateData.access_token = tokens.access_token;
    if (tokens.refresh_token) updateData.refresh_token = tokens.refresh_token;
    if (tokens.expiry_date) updateData.expires_at = Math.floor(tokens.expiry_date / 1000);

    if (Object.keys(updateData).length > 0) {
      await prisma.account.update({
        where: { id: account.id },
        data: updateData,
      });
    }
  });

  return client;
}

/**
 * Create a Google Calendar event when a task is assigned.
 * Returns the Google Calendar event ID or null.
 */
export async function createCalendarEvent(
  userId: string,
  task: {
    id: string;
    title: string;
    description?: string | null;
    startDate?: Date | null;
    dueDate?: Date | null;
    projectId: string;
  }
): Promise<string | null> {
  try {
    console.log(`[Google Calendar] Creating event for user ${userId}, task "${task.title}"`);
    const client = await getAuthClient(userId);
    if (!client) {
      console.log(`[Google Calendar] No Google account linked for user ${userId}, skipping`);
      return null;
    }

    const calendar = google.calendar({ version: "v3", auth: client });
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Use startDate as event start, dueDate as event end — stretches across the range
    const today = new Date();
    const start = task.startDate ? new Date(task.startDate) : (task.dueDate ? new Date(task.dueDate) : today);
    const due = task.dueDate ? new Date(task.dueDate) : start;
    const startDateStr = start.toISOString().split("T")[0];

    // Google Calendar all-day events: end date is exclusive, so add 1 day
    const endExclusive = new Date(due);
    endExclusive.setDate(endExclusive.getDate() + 1);
    const endDateStr = endExclusive.toISOString().split("T")[0];

    const event = await calendar.events.insert({
      calendarId: "primary",
      requestBody: {
        summary: `📋 ${task.title}`,
        description: [
          task.description || "",
          "",
          `View in Karya: ${appUrl}/dashboard/projects/${task.projectId}`,
        ].join("\n"),
        start: {
          date: startDateStr,
        },
        end: {
          date: endDateStr,
        },
        reminders: {
          useDefault: false,
          overrides: [{ method: "popup", minutes: 60 }],
        },
      },
    });

    console.log(`[Google Calendar] Event created: ${event.data.id}`);
    return event.data.id || null;
  } catch (error) {
    console.error(`[Google Calendar] Failed to create event for user ${userId}:`, error);
    return null;
  }
}

/**
 * Update a Google Calendar event when a task is modified.
 */
export async function updateCalendarEvent(
  userId: string,
  calendarEventId: string,
  task: {
    title: string;
    description?: string | null;
    startDate?: Date | null;
    dueDate?: Date | null;
    projectId: string;
  }
): Promise<void> {
  try {
    const client = await getAuthClient(userId);
    if (!client) return;

    const calendar = google.calendar({ version: "v3", auth: client });
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const today = new Date();
    const start = task.startDate ? new Date(task.startDate) : (task.dueDate ? new Date(task.dueDate) : today);
    const due = task.dueDate ? new Date(task.dueDate) : start;
    const startDateStr = start.toISOString().split("T")[0];
    const endExclusive = new Date(due);
    endExclusive.setDate(endExclusive.getDate() + 1);
    const endDateStr = endExclusive.toISOString().split("T")[0];

    await calendar.events.update({
      calendarId: "primary",
      eventId: calendarEventId,
      requestBody: {
        summary: `📋 ${task.title}`,
        description: [
          task.description || "",
          "",
          `View in Karya: ${appUrl}/dashboard/projects/${task.projectId}`,
        ].join("\n"),
        start: { date: startDateStr },
        end: { date: endDateStr },
      },
    });
  } catch (error) {
    console.error(`[Google Calendar] Failed to update event:`, error);
  }
}

/**
 * Delete a Google Calendar event.
 */
export async function deleteCalendarEvent(
  userId: string,
  calendarEventId: string
): Promise<void> {
  try {
    const client = await getAuthClient(userId);
    if (!client) return;

    const calendar = google.calendar({ version: "v3", auth: client });
    await calendar.events.delete({
      calendarId: "primary",
      eventId: calendarEventId,
    });
  } catch (error) {
    console.error(`[Google Calendar] Failed to delete event:`, error);
  }
}

/**
 * Sync a task to Google Calendar for all assigned users who have Google connected.
 * Stores the calendar event ID per task (one event per task, using primary assignee).
 */
export async function syncTaskToAssignees(
  task: {
    id: string;
    title: string;
    description?: string | null;
    startDate?: Date | null;
    dueDate?: Date | null;
    projectId: string;
    calendarEventId?: string | null;
  },
  assigneeIds: string[]
): Promise<void> {
  // Create calendar events for each assignee who has Google linked
  for (const userId of assigneeIds) {
    try {
      const eventId = await createCalendarEvent(userId, task);
      // Store the event ID on the task (use the first successful one)
      if (eventId && !task.calendarEventId) {
        await prisma.task.update({
          where: { id: task.id },
          data: { calendarEventId: eventId },
        });
        task.calendarEventId = eventId;
      }
    } catch (error) {
      console.error(`[Google Calendar] Sync failed for user ${userId}:`, error);
    }
  }
}

/**
 * Remove calendar events for a task.
 */
export async function removeTaskFromCalendars(
  taskId: string,
  calendarEventId: string | null,
  assigneeIds: string[]
): Promise<void> {
  if (!calendarEventId) return;

  for (const userId of assigneeIds) {
    await deleteCalendarEvent(userId, calendarEventId);
  }

  await prisma.task.update({
    where: { id: taskId },
    data: { calendarEventId: null },
  });
}
