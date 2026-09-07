"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// Get all user's team IDs
async function getUserTeamIds(userId: string) {
  const memberships = await prisma.teamMember.findMany({
    where: { userId },
    select: { teamId: true },
  });
  return memberships.map((m) => m.teamId);
}

export async function getIdeas() {
  const user = await getCurrentUser();
  const teamIds = await getUserTeamIds(user.id);

  return prisma.idea.findMany({
    where: { teamId: { in: teamIds } },
    include: {
      creator: { select: { id: true, name: true, email: true, avatar: true } },
      team: { select: { id: true, name: true } },
      comments: {
        include: {
          author: { select: { id: true, name: true, email: true, avatar: true } },
        },
        orderBy: { createdAt: "asc" as const },
      },
      _count: { select: { comments: true, voters: true } },
      voters: { where: { userId: user.id }, select: { id: true } },
    },
    orderBy: [{ createdAt: "desc" }],
  });
}

export async function getIdea(id: string) {
  const user = await getCurrentUser();

  return prisma.idea.findUnique({
    where: { id },
    include: {
      creator: { select: { id: true, name: true, email: true, avatar: true } },
      team: { select: { id: true, name: true } },
      comments: {
        include: {
          author: { select: { id: true, name: true, email: true, avatar: true } },
        },
        orderBy: { createdAt: "asc" },
      },
      _count: { select: { comments: true, voters: true } },
      voters: { where: { userId: user.id }, select: { id: true } },
    },
  });
}

export async function createIdea(formData: FormData) {
  const user = await getCurrentUser();
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const category = (formData.get("category") as string) || "general";
  const teamId = formData.get("teamId") as string;

  if (!title?.trim()) return { error: "Title is required" };
  if (!teamId) return { error: "Team is required" };

  // Verify user is in the team
  const member = await prisma.teamMember.findUnique({
    where: { userId_teamId: { userId: user.id, teamId } },
  });
  if (!member) return { error: "You are not a member of this team" };

  await prisma.idea.create({
    data: {
      title: title.trim(),
      description: description?.trim() || null,
      category,
      teamId,
      creatorId: user.id,
    },
  });

  revalidatePath("/dashboard/ideas");
  return { success: true };
}

export async function updateIdea(id: string, data: { title?: string; description?: string; category?: string; status?: string }) {
  const user = await getCurrentUser();

  const idea = await prisma.idea.findUnique({ where: { id } });
  if (!idea) return { error: "Idea not found" };
  if (idea.creatorId !== user.id) return { error: "Only the creator can edit this idea" };

  await prisma.idea.update({
    where: { id },
    data: {
      ...(data.title !== undefined && { title: data.title.trim() }),
      ...(data.description !== undefined && { description: data.description.trim() || null }),
      ...(data.category !== undefined && { category: data.category }),
      ...(data.status !== undefined && { status: data.status }),
    },
  });

  revalidatePath("/dashboard/ideas");
  return { success: true };
}

export async function deleteIdea(id: string) {
  const user = await getCurrentUser();

  const idea = await prisma.idea.findUnique({ where: { id } });
  if (!idea) return { error: "Idea not found" };
  if (idea.creatorId !== user.id) return { error: "Only the creator can delete this idea" };

  await prisma.idea.delete({ where: { id } });

  revalidatePath("/dashboard/ideas");
  return { success: true };
}

export async function toggleIdeaVote(ideaId: string) {
  const user = await getCurrentUser();

  const existingVote = await prisma.ideaVote.findUnique({
    where: { ideaId_userId: { ideaId, userId: user.id } },
  });

  if (existingVote) {
    await prisma.$transaction([
      prisma.ideaVote.delete({ where: { id: existingVote.id } }),
      prisma.idea.update({ where: { id: ideaId }, data: { upvotes: { decrement: 1 } } }),
    ]);
  } else {
    await prisma.$transaction([
      prisma.ideaVote.create({ data: { ideaId, userId: user.id } }),
      prisma.idea.update({ where: { id: ideaId }, data: { upvotes: { increment: 1 } } }),
    ]);
  }

  revalidatePath("/dashboard/ideas");
  return { success: true };
}

export async function addIdeaComment(ideaId: string, content: string) {
  const user = await getCurrentUser();

  if (!content?.trim()) return { error: "Comment cannot be empty" };

  const idea = await prisma.idea.findUnique({ where: { id: ideaId }, select: { creatorId: true, title: true } });
  if (!idea) return { error: "Idea not found" };

  await prisma.ideaComment.create({
    data: {
      content: content.trim(),
      ideaId,
      authorId: user.id,
    },
  });

  // Notify idea creator if someone else comments
  if (idea.creatorId !== user.id) {
    await prisma.notification.create({
      data: {
        type: "commented",
        message: `${user.name} commented on your idea "${idea.title}"`,
        link: "/dashboard/ideas",
        userId: idea.creatorId,
      },
    });
  }

  revalidatePath("/dashboard/ideas");
  return { success: true };
}

export async function deleteIdeaComment(commentId: string) {
  const user = await getCurrentUser();

  const comment = await prisma.ideaComment.findUnique({ where: { id: commentId } });
  if (!comment) return { error: "Comment not found" };
  if (comment.authorId !== user.id) return { error: "You can only delete your own comments" };

  await prisma.ideaComment.delete({ where: { id: commentId } });

  revalidatePath("/dashboard/ideas");
  return { success: true };
}
