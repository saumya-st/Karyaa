"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { cache } from "react";

export async function createTeam(name: string) {
  const userId = await getCurrentUserId();

  if (!name || !name.trim()) {
    return { error: "Team name is required" };
  }

  const team = await prisma.team.create({
    data: {
      name: name.trim(),
      members: {
        create: {
          userId,
          role: "owner",
        },
      },
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/team");
  return { success: true, teamId: team.id };
}

export const getTeams = cache(async () => {
  const userId = await getCurrentUserId();
  return fetchTeams(userId);
});

async function fetchTeams(userId: string) {
  return prisma.team.findMany({
    where: {
      members: { some: { userId } },
    },
    include: {
      members: {
        include: {
          user: { select: { id: true, name: true, email: true, avatar: true } },
        },
      },
      _count: { select: { projects: true } },
    },
  });
}

export async function inviteToTeam(teamId: string, email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return { error: "User not found" };

  const existing = await prisma.teamMember.findUnique({
    where: { userId_teamId: { userId: user.id, teamId } },
  });
  if (existing) return { error: "User already in team" };

  await prisma.teamMember.create({
    data: { userId: user.id, teamId, role: "member" },
  });

  // Bust both users' list caches
  const currentUserId = await getCurrentUserId();
  revalidatePath("/dashboard");
  return { success: true };
}

export async function removeFromTeam(teamId: string, userId: string) {
  await prisma.teamMember.delete({
    where: { userId_teamId: { userId, teamId } },
  });
  revalidatePath("/dashboard");
}

export async function deleteTeam(teamId: string) {
  const userId = await getCurrentUserId();

  // Only team owner can delete
  const membership = await prisma.teamMember.findUnique({
    where: { userId_teamId: { userId, teamId } },
  });
  if (!membership || membership.role !== "owner") {
    return { error: "Only the team owner can delete the team" };
  }

  // Cascade will delete projects, tasks, etc.
  await prisma.team.delete({ where: { id: teamId } });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/team");
  return { success: true };
}
