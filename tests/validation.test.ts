import { describe, expect, it } from "vitest";
import {
  createProjectSchema,
  createTaskSchema,
  createTeamSchema,
  formDataToObject,
  loginSchema,
  registerSchema,
  updateProjectSchema,
  updateTaskSchema,
  validate,
} from "@/lib/validation";

describe("registerSchema", () => {
  const valid = { name: "Ada Lovelace", email: "ada@example.com", password: "correct-horse" };

  it("accepts a valid registration and trims the name", () => {
    const result = validate(registerSchema, { ...valid, name: "  Ada  " });
    expect(result.success).toBe(true);
    expect(result.data?.name).toBe("Ada");
  });

  it.each([
    [{ ...valid, name: "A" }, "Name must be at least 2 characters"],
    [{ ...valid, name: "x".repeat(61) }, "Name must be at most 60 characters"],
    [{ ...valid, email: "not-an-email" }, "Please enter a valid email address"],
    [{ ...valid, password: "short" }, "Password must be at least 8 characters"],
  ])("rejects %j", (input, message) => {
    const result = validate(registerSchema, input);
    expect(result.success).toBe(false);
    expect(result.error).toBe(message);
  });

  it("reports missing fields", () => {
    const result = validate(registerSchema, { name: undefined, email: undefined, password: undefined });
    expect(result.success).toBe(false);
    expect(typeof result.error).toBe("string");
  });
});

describe("loginSchema", () => {
  it("accepts an email and a password", () => {
    expect(validate(loginSchema, { email: "a@b.co", password: "x" }).success).toBe(true);
  });

  it("rejects an empty password", () => {
    const result = validate(loginSchema, { email: "a@b.co", password: "" });
    expect(result.success).toBe(false);
    expect(result.error).toBe("Password is required");
  });
});

describe("createTaskSchema", () => {
  const base = { title: "Write tests", projectId: "p1", sectionId: "s1" };

  it("applies defaults for priority, tracking status and assignees", () => {
    const result = validate(createTaskSchema, base);
    expect(result.success).toBe(true);
    expect(result.data).toMatchObject({
      priority: "medium",
      trackingStatus: "on_track",
      assigneeIds: [],
    });
  });

  it("accepts the full set of fields as a date input sends them", () => {
    const result = validate(createTaskSchema, {
      ...base,
      description: "Some details",
      priority: "urgent",
      trackingStatus: "at_risk",
      dueDate: "2026-03-01",
      startDate: "",
      assigneeIds: ["u1", "u2"],
    });
    expect(result.success).toBe(true);
    expect(result.data?.dueDate).toBe("2026-03-01");
    expect(result.data?.startDate).toBe("");
  });

  it.each([
    [{ ...base, title: "" }, "Title is required"],
    [{ ...base, title: "x".repeat(201) }, "Title must be at most 200 characters"],
    [{ ...base, description: "x".repeat(5001) }, "Description must be at most 5000 characters"],
    [{ ...base, dueDate: "not a date" }, "Invalid date"],
    [{ title: "t", projectId: "", sectionId: "s1" }, "Missing id"],
  ])("rejects %j", (input, message) => {
    const result = validate(createTaskSchema, input);
    expect(result.success).toBe(false);
    expect(result.error).toBe(message);
  });

  it("rejects an unknown priority", () => {
    const result = validate(createTaskSchema, { ...base, priority: "critical" });
    expect(result.success).toBe(false);
  });
});

describe("updateTaskSchema", () => {
  it("accepts partial updates and null dates", () => {
    expect(validate(updateTaskSchema, { completed: true }).success).toBe(true);
    expect(validate(updateTaskSchema, { dueDate: null }).success).toBe(true);
    expect(validate(updateTaskSchema, { assigneeId: null, priority: "low" }).success).toBe(true);
    expect(validate(updateTaskSchema, {}).success).toBe(true);
  });

  it("rejects unknown keys so they cannot reach the database", () => {
    const result = validate(updateTaskSchema, { creatorId: "someone-else" });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid status or a negative order", () => {
    expect(validate(updateTaskSchema, { status: "archived" }).success).toBe(false);
    expect(validate(updateTaskSchema, { order: -1 }).success).toBe(false);
  });
});

describe("createProjectSchema / updateProjectSchema", () => {
  it("accepts a project with the default color", () => {
    const result = validate(createProjectSchema, { name: "Roadmap", teamId: "t1" });
    expect(result.success).toBe(true);
    expect(result.data?.color).toBe("#6366f1");
  });

  it("rejects a non-hex color and a missing team", () => {
    expect(validate(createProjectSchema, { name: "Roadmap", teamId: "t1", color: "red" }).error).toBe(
      "Color must be a hex value like #6366f1"
    );
    expect(validate(createProjectSchema, { name: "Roadmap" }).success).toBe(false);
  });

  it("allows partial project updates without a team id", () => {
    const result = validate(updateProjectSchema, { description: "New description" });
    expect(result.success).toBe(true);
    expect(result.data).toEqual({ description: "New description" });
  });
});

describe("createTeamSchema", () => {
  it("trims the name", () => {
    expect(validate(createTeamSchema, { name: "  Core  " }).data?.name).toBe("Core");
  });

  it("rejects an empty or whitespace-only name", () => {
    expect(validate(createTeamSchema, { name: "   " }).error).toBe("Team name is required");
  });
});

describe("formDataToObject", () => {
  it("maps missing fields to undefined and keeps present ones", () => {
    const fd = new FormData();
    fd.set("title", "Hello");
    fd.set("priority", "");
    const obj = formDataToObject(fd, ["title", "description", "priority"], ["priority"]);
    expect(obj).toEqual({ title: "Hello", description: undefined, priority: undefined });
  });

  it("keeps empty strings for keys not listed in emptyAsUndefined", () => {
    const fd = new FormData();
    fd.set("dueDate", "");
    expect(formDataToObject(fd, ["dueDate"])).toEqual({ dueDate: "" });
  });
});
