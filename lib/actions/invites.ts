"use server";

import { prisma } from "@/lib/prisma";
import { auth, getCurrentUser } from "@/lib/auth";
import { sendInviteEmail } from "@/lib/email";
import { revalidatePath } from "next/cache";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://anant-ivory.vercel.app";

// Look up a user by email (for the invite dialog)
export async function lookupUserByEmail(email: string) {
  if (!email || !email.includes("@")) return null;

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
    select: { id: true, name: true, email: true, avatar: true },
  });

  return user;
}

// Add an existing user directly to a project team
export async function addUserToProjectTeam(projectId: string, userId: string) {
  const currentUser = await getCurrentUser();

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { teamId: true, name: true },
  });
  if (!project) return { error: "Project not found" };

  // Check if already a member
  const existing = await prisma.teamMember.findUnique({
    where: { userId_teamId: { userId, teamId: project.teamId } },
  });
  if (existing) return { error: "User is already a team member" };

  await prisma.teamMember.create({
    data: {
      userId,
      teamId: project.teamId,
      role: "member",
    },
  });

  // Notify the added user
  await prisma.notification.create({
    data: {
      type: "team_added",
      message: `${currentUser.name} added you to the project "${project.name}"`,
      link: `/dashboard/projects/${projectId}`,
      userId,
    },
  });

  // Revalidate so their sidebar refreshes
  revalidatePath(`/dashboard/projects/${projectId}`, "page");
  revalidatePath("/dashboard/team");
  revalidatePath("/dashboard");
  return { success: true };
}

// Create a shareable invite link for a project
export async function createProjectInviteLink(projectId: string) {
  const currentUser = await getCurrentUser();

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { teamId: true, name: true },
  });
  if (!project) return { error: "Project not found" };

  const invite = await prisma.projectInvite.create({
    data: {
      projectId,
      teamId: project.teamId,
      invitedById: currentUser.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  });

  return {
    success: true,
    link: `${APP_URL}/invite/${invite.token}`,
    token: invite.token,
  };
}

// Create invite + send email
export async function sendProjectInviteEmail(projectId: string, email: string) {
  const currentUser = await getCurrentUser();

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { teamId: true, name: true, color: true },
  });
  if (!project) return { error: "Project not found" };

  const invite = await prisma.projectInvite.create({
    data: {
      projectId,
      teamId: project.teamId,
      invitedEmail: email.toLowerCase().trim(),
      invitedById: currentUser.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  const result = await sendInviteEmail({
    to: email.toLowerCase().trim(),
    inviterName: currentUser.name,
    projectName: project.name,
    projectColor: project.color,
    inviteToken: invite.token,
  });

  if (result.error) {
    return { error: `Failed to send email: ${result.error}` };
  }

  return { success: true, link: `${APP_URL}/invite/${invite.token}` };
}

// Get invite info (for the /invite/[token] page)
export async function getInviteByToken(token: string) {
  const invite = await prisma.projectInvite.findUnique({
    where: { token },
    include: {
      project: { select: { id: true, name: true, color: true, description: true } },
      invitedBy: { select: { name: true, avatar: true } },
      team: { select: { id: true, name: true } },
    },
  });

  if (!invite) return null;

  // Check expiry
  if (invite.expiresAt < new Date() || invite.status === "expired") {
    return { ...invite, expired: true };
  }

  return { ...invite, expired: false };
}

// Accept an invite (join the team)
export async function acceptInvite(token: string): Promise<{ success?: boolean; error?: string; redirect?: string; projectId?: string; alreadyMember?: boolean }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: "Please log in first", redirect: "/login" };
    }

    const invite = await prisma.projectInvite.findUnique({
      where: { token },
      include: {
        project: { select: { id: true, name: true } },
        team: { select: { id: true } },
      },
    });

    if (!invite) return { error: "Invalid invite link" };
    if (invite.expiresAt < new Date()) {
      await prisma.projectInvite.update({ where: { id: invite.id }, data: { status: "expired" } });
      return { error: "This invite has expired" };
    }

    // Check if already a member
    const existingMember = await prisma.teamMember.findUnique({
      where: { userId_teamId: { userId: session.user.id, teamId: invite.team.id } },
    });

    if (existingMember) {
      return { success: true, alreadyMember: true, projectId: invite.projectId };
    }

    // Add to team
    await prisma.teamMember.create({
      data: {
        userId: session.user.id,
        teamId: invite.team.id,
        role: "member",
      },
    });

    // Mark invite as accepted
    await prisma.projectInvite.update({
      where: { id: invite.id },
      data: { status: "accepted" },
    });

    // Notify inviter
    await prisma.notification.create({
      data: {
        type: "invite_accepted",
        message: `${session.user.name} accepted your invite to "${invite.project.name}"`,
        link: `/dashboard/projects/${invite.projectId}`,
        userId: invite.invitedById,
      },
    });

    // Revalidate so the new member sees the project/team immediately
    revalidatePath(`/dashboard/projects/${invite.projectId}`, "page");
    revalidatePath("/dashboard/team");
    revalidatePath("/dashboard");

    return { success: true, projectId: invite.projectId };
  } catch (err) {
    console.error("acceptInvite error:", err);
    return { error: "Something went wrong while joining. Please try again." };
  }
}
