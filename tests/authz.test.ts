import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    teamMember: { findUnique: vi.fn() },
    project: { findUnique: vi.fn() },
    task: { findUnique: vi.fn() },
    section: { findUnique: vi.fn() },
  },
}));

import { prisma } from "@/lib/prisma";
import {
  AuthorizationError,
  MANAGER_ROLES,
  assertProjectMember,
  assertProjectRole,
  assertSectionMember,
  assertTaskMember,
  assertTeamMember,
  assertTeamRole,
  getTeamMembership,
  isAuthorizationError,
} from "@/lib/authz";

const findMember = vi.mocked(prisma.teamMember.findUnique);
const findProject = vi.mocked(prisma.project.findUnique);
const findTask = vi.mocked(prisma.task.findUnique);
const findSection = vi.mocked(prisma.section.findUnique);

// The mocks are typed against the real Prisma delegates; the helpers only use
// the selected fields, so narrow result objects are cast where needed.
function memberWithRole(role: string) {
  findMember.mockResolvedValueOnce({ role } as never);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("AuthorizationError", () => {
  it("is an Error with a 403 status and a default message", () => {
    const err = new AuthorizationError();
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe("AuthorizationError");
    expect(err.status).toBe(403);
    expect(err.message).toMatch(/permission/i);
    expect(isAuthorizationError(err)).toBe(true);
    expect(isAuthorizationError(new Error("x"))).toBe(false);
  });

  it("exposes owner and admin as manager roles", () => {
    expect(MANAGER_ROLES).toEqual(["owner", "admin"]);
  });
});

describe("getTeamMembership / assertTeamMember", () => {
  it("returns the membership when the user is in the team", async () => {
    memberWithRole("member");
    await expect(getTeamMembership("u1", "t1")).resolves.toEqual({ teamId: "t1", role: "member" });
    expect(findMember).toHaveBeenCalledWith({
      where: { userId_teamId: { userId: "u1", teamId: "t1" } },
      select: { role: true },
    });
  });

  it("returns null when the user is not in the team", async () => {
    findMember.mockResolvedValueOnce(null);
    await expect(getTeamMembership("u1", "t1")).resolves.toBeNull();
  });

  it("assertTeamMember throws AuthorizationError for non-members", async () => {
    findMember.mockResolvedValueOnce(null);
    await expect(assertTeamMember("u1", "t1")).rejects.toBeInstanceOf(AuthorizationError);
  });
});

describe("assertTeamRole", () => {
  it("passes when the role is allowed", async () => {
    memberWithRole("admin");
    await expect(assertTeamRole("u1", "t1", MANAGER_ROLES)).resolves.toEqual({ teamId: "t1", role: "admin" });
  });

  it("rejects a member asking for a manager-only action", async () => {
    memberWithRole("member");
    await expect(assertTeamRole("u1", "t1", MANAGER_ROLES)).rejects.toThrow(/owner, admin/);
  });

  it("rejects non-members before checking roles", async () => {
    findMember.mockResolvedValueOnce(null);
    await expect(assertTeamRole("u1", "t1", ["owner"])).rejects.toBeInstanceOf(AuthorizationError);
  });
});

describe("assertProjectMember / assertProjectRole", () => {
  it("resolves the project's team and checks membership there", async () => {
    findProject.mockResolvedValueOnce({ teamId: "t9" } as never);
    memberWithRole("member");
    await expect(assertProjectMember("u1", "p1")).resolves.toEqual({ teamId: "t9", role: "member", projectId: "p1" });
    expect(findMember).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId_teamId: { userId: "u1", teamId: "t9" } } })
    );
  });

  it("treats a missing project the same as a forbidden one", async () => {
    findProject.mockResolvedValueOnce(null);
    await expect(assertProjectMember("u1", "missing")).rejects.toBeInstanceOf(AuthorizationError);
    expect(findMember).not.toHaveBeenCalled();
  });

  it("rejects a user from another team", async () => {
    findProject.mockResolvedValueOnce({ teamId: "t9" } as never);
    findMember.mockResolvedValueOnce(null);
    await expect(assertProjectMember("intruder", "p1")).rejects.toBeInstanceOf(AuthorizationError);
  });

  it("assertProjectRole enforces the role on the owning team", async () => {
    findProject.mockResolvedValueOnce({ teamId: "t9" } as never);
    memberWithRole("member");
    await expect(assertProjectRole("u1", "p1", MANAGER_ROLES)).rejects.toBeInstanceOf(AuthorizationError);

    findProject.mockResolvedValueOnce({ teamId: "t9" } as never);
    memberWithRole("owner");
    await expect(assertProjectRole("u1", "p1", MANAGER_ROLES)).resolves.toMatchObject({ role: "owner" });
  });
});

describe("assertTaskMember", () => {
  it("walks task -> project -> team and returns the ids", async () => {
    findTask.mockResolvedValueOnce({ projectId: "p1", project: { teamId: "t1" } } as never);
    memberWithRole("guest");
    await expect(assertTaskMember("u1", "task1")).resolves.toEqual({
      teamId: "t1",
      role: "guest",
      projectId: "p1",
      taskId: "task1",
    });
  });

  it("rejects when the task does not exist or the user is not a member", async () => {
    findTask.mockResolvedValueOnce(null);
    await expect(assertTaskMember("u1", "nope")).rejects.toBeInstanceOf(AuthorizationError);

    findTask.mockResolvedValueOnce({ projectId: "p1", project: { teamId: "t1" } } as never);
    findMember.mockResolvedValueOnce(null);
    await expect(assertTaskMember("u1", "task1")).rejects.toBeInstanceOf(AuthorizationError);
  });
});

describe("assertSectionMember", () => {
  it("returns the section's project id for same-project checks", async () => {
    findSection.mockResolvedValueOnce({ projectId: "p1", project: { teamId: "t1" } } as never);
    memberWithRole("member");
    await expect(assertSectionMember("u1", "s1")).resolves.toEqual({ teamId: "t1", role: "member", projectId: "p1" });
  });

  it("rejects a missing section", async () => {
    findSection.mockResolvedValueOnce(null);
    await expect(assertSectionMember("u1", "s1")).rejects.toBeInstanceOf(AuthorizationError);
  });
});
