import { z } from "zod";

/**
 * Input schemas for Server Actions.
 *
 * Server Actions are public HTTP endpoints: anything a browser can send, a
 * script can send too. Every action that accepts user input parses it through
 * one of these schemas and returns `{ error }` with the first issue message
 * instead of trusting the raw FormData / JSON shape.
 */

export const PRIORITIES = ["low", "medium", "high", "urgent"] as const;
export const TASK_STATUSES = ["todo", "in_progress", "done"] as const;
export const TRACKING_STATUSES = ["on_track", "at_risk", "off_track"] as const;

export type Priority = (typeof PRIORITIES)[number];
export type TaskStatus = (typeof TASK_STATUSES)[number];
export type TrackingStatus = (typeof TRACKING_STATUSES)[number];

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

/** A date string the Date constructor can parse (e.g. "2026-03-01" from <input type="date">). */
const dateString = z
  .string()
  .trim()
  .refine((value) => !Number.isNaN(Date.parse(value)), { message: "Invalid date" });

/** Optional date field as it arrives from a form: missing, empty string or a parseable date. */
const optionalFormDate = z.union([z.literal(""), dateString]).optional();

const id = z.string().trim().min(1, "Missing id");

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(60, "Name must be at most 60 characters"),
  email: z.email("Please enter a valid email address").trim().max(254),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be at most 128 characters"),
});

export const loginSchema = z.object({
  email: z.email("Please enter a valid email address").trim(),
  password: z.string().min(1, "Password is required"),
});

// ---------------------------------------------------------------------------
// Tasks
// ---------------------------------------------------------------------------

export const createTaskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(200, "Title must be at most 200 characters"),
  description: z
    .string()
    .trim()
    .max(5000, "Description must be at most 5000 characters")
    .optional(),
  projectId: id,
  sectionId: id,
  priority: z.enum(PRIORITIES).default("medium"),
  trackingStatus: z.enum(TRACKING_STATUSES).default("on_track"),
  dueDate: optionalFormDate,
  startDate: optionalFormDate,
  assigneeIds: z.array(z.string().trim().min(1)).max(50).default([]),
});

export const updateTaskSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required").max(200, "Title must be at most 200 characters"),
    description: z.string().trim().max(5000, "Description must be at most 5000 characters"),
    priority: z.enum(PRIORITIES),
    status: z.enum(TASK_STATUSES),
    dueDate: dateString.nullable(),
    startDate: dateString.nullable(),
    trackingStatus: z.enum(TRACKING_STATUSES),
    assigneeId: z.string().trim().min(1).nullable(),
    sectionId: id,
    order: z.number().int().min(0),
    completed: z.boolean(),
  })
  .partial()
  // Reject unknown keys so the object can be spread into a Prisma update safely.
  .strict();

// ---------------------------------------------------------------------------
// Projects and teams
// ---------------------------------------------------------------------------

export const createProjectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Project name is required")
    .max(100, "Project name must be at most 100 characters"),
  description: z
    .string()
    .trim()
    .max(2000, "Description must be at most 2000 characters")
    .optional(),
  color: z.string().regex(HEX_COLOR, "Color must be a hex value like #6366f1").default("#6366f1"),
  teamId: id,
});

export const updateProjectSchema = createProjectSchema.omit({ teamId: true }).partial();

export const createTeamSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Team name is required")
    .max(60, "Team name must be at most 60 characters"),
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export type ValidationResult<T> =
  | { success: true; data: T; error?: undefined }
  | { success: false; data?: undefined; error: string };

/** Parses `input` and returns either the typed data or the first issue message. */
export function validate<S extends z.ZodType>(schema: S, input: unknown): ValidationResult<z.output<S>> {
  const result = schema.safeParse(input);
  if (result.success) return { success: true, data: result.data };
  return { success: false, error: result.error.issues[0]?.message ?? "Invalid input" };
}

/**
 * Reads the given keys from a FormData into a plain object, mapping missing
 * fields (null) to undefined so optional schema fields behave as expected.
 * Empty strings are normalised to undefined for the keys listed in `emptyAsUndefined`.
 */
export function formDataToObject(
  formData: FormData,
  keys: readonly string[],
  emptyAsUndefined: readonly string[] = []
): Record<string, string | undefined> {
  const out: Record<string, string | undefined> = {};
  for (const key of keys) {
    const value = formData.get(key);
    if (typeof value !== "string") {
      out[key] = undefined;
    } else if (value === "" && emptyAsUndefined.includes(key)) {
      out[key] = undefined;
    } else {
      out[key] = value;
    }
  }
  return out;
}
