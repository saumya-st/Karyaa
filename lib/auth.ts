import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { authConfig } from "./auth.config";
import { cache } from "react";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope:
            "openid email profile https://www.googleapis.com/auth/calendar.events",
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.hashedPassword) return null;

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.hashedPassword
        );

        if (!isValid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.avatar,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account, profile }) {
      if (account?.provider === "google" && profile?.email) {
        // Check if user already exists
        let existingUser = await prisma.user.findUnique({
          where: { email: profile.email },
        });

        if (!existingUser) {
          // Create new user from Google profile
          existingUser = await prisma.user.create({
            data: {
              name: profile.name || profile.email.split("@")[0],
              email: profile.email,
              hashedPassword: null,
              avatar: (profile as { picture?: string }).picture || null,
            },
          });

          // Create a default team
          await prisma.team.create({
            data: {
              name: `${existingUser.name}'s Team`,
              members: {
                create: { userId: existingUser.id, role: "owner" },
              },
            },
          });
        }

        // Upsert the Account (stores Google tokens for Calendar API)
        await prisma.account.upsert({
          where: {
            provider_providerAccountId: {
              provider: account.provider,
              providerAccountId: account.providerAccountId,
            },
          },
          update: {
            access_token: account.access_token,
            refresh_token: account.refresh_token ?? undefined,
            expires_at: account.expires_at,
            token_type: account.token_type,
            scope: account.scope,
            id_token: account.id_token,
          },
          create: {
            userId: existingUser.id,
            type: account.type,
            provider: account.provider,
            providerAccountId: account.providerAccountId,
            access_token: account.access_token,
            refresh_token: account.refresh_token,
            expires_at: account.expires_at,
            token_type: account.token_type,
            scope: account.scope,
            id_token: account.id_token,
          },
        });

        // Set the user id so the JWT callback picks it up
        user.id = existingUser.id;
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});

/**
 * Request-scoped cached session — deduplicates auth() calls within a single
 * server render so the JWT is decoded only once no matter how many server
 * components / actions call it.
 */
export const getSession = cache(() => auth());

/** Convenience: returns the current user ID, deduplicated per request. */
export const getCurrentUserId = cache(async () => {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Not authenticated");
  return session.user.id;
});

/** Convenience: returns id + name, deduplicated per request. */
export const getCurrentUser = cache(async () => {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Not authenticated");
  return { id: session.user.id, name: session.user.name || "Unknown" };
});
