"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getNotes() {
  const userId = await getCurrentUserId();

  return prisma.note.findMany({
    where: { userId },
    orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
  });
}

export async function createNote(formData: FormData) {
  const userId = await getCurrentUserId();
  const title = (formData.get("title") as string)?.trim();
  const content = (formData.get("content") as string) || "";
  const color = (formData.get("color") as string) || "default";

  if (!title) throw new Error("Title is required");

  await prisma.note.create({
    data: { title, content, color, userId },
  });

  revalidatePath("/dashboard/notes");
}

export async function updateNote(
  id: string,
  data: { title?: string; content?: string; color?: string; pinned?: boolean }
) {
  const userId = await getCurrentUserId();

  const note = await prisma.note.findUnique({ where: { id } });
  if (!note || note.userId !== userId) throw new Error("Not found");

  await prisma.note.update({
    where: { id },
    data,
  });

  revalidatePath("/dashboard/notes");
}

export async function deleteNote(id: string) {
  const userId = await getCurrentUserId();

  const note = await prisma.note.findUnique({ where: { id } });
  if (!note || note.userId !== userId) throw new Error("Not found");

  await prisma.note.delete({ where: { id } });

  revalidatePath("/dashboard/notes");
}

export async function togglePinNote(id: string) {
  const userId = await getCurrentUserId();

  const note = await prisma.note.findUnique({ where: { id } });
  if (!note || note.userId !== userId) throw new Error("Not found");

  await prisma.note.update({
    where: { id },
    data: { pinned: !note.pinned },
  });

  revalidatePath("/dashboard/notes");
}
