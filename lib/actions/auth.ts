"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signIn } from "@/lib/auth";
import { formDataToObject, loginSchema, registerSchema, validate } from "@/lib/validation";

export async function registerUser(formData: FormData) {
  const parsed = validate(registerSchema, formDataToObject(formData, ["name", "email", "password"]));
  if (!parsed.success) return { error: parsed.error };
  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "Email already in use" };
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: { name, email, hashedPassword },
  });

  // Create a default team for the user
  await prisma.team.create({
    data: {
      name: `${name}'s Team`,
      members: {
        create: {
          userId: user.id,
          role: "owner",
        },
      },
    },
  });

  // Sign in the user
  const callbackUrl = (formData.get("callbackUrl") as string) || "/dashboard";
  await signIn("credentials", {
    email,
    password,
    redirectTo: callbackUrl,
  });
}

export async function loginUser(formData: FormData) {
  const parsed = validate(loginSchema, formDataToObject(formData, ["email", "password"]));
  if (!parsed.success) return { error: parsed.error };
  const { email, password } = parsed.data;
  const callbackUrl = (formData.get("callbackUrl") as string) || "/dashboard";

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: callbackUrl,
    });
  } catch (error: unknown) {
    // NextAuth throws NEXT_REDIRECT on success, rethrow it
    if (error instanceof Error && error.message === "NEXT_REDIRECT") {
      throw error;
    }
    if (
      error &&
      typeof error === "object" &&
      "digest" in error &&
      typeof (error as Record<string, unknown>).digest === "string" &&
      ((error as Record<string, string>).digest.includes("NEXT_REDIRECT"))
    ) {
      throw error;
    }
    return { error: "Invalid credentials" };
  }
}
