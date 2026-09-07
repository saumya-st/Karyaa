import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  providers: [], // Providers added in auth.ts (credentials needs Prisma which can't run on Edge)
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
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
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const pathname = nextUrl.pathname;

      // Public routes
      if (pathname === "/" || pathname === "/login" || pathname === "/register" || pathname === "/privacy" || pathname === "/terms" || pathname.startsWith("/invite/")) {
        return true;
      }

      // Protected routes
      if (!isLoggedIn) {
        return false; // Redirects to signIn page
      }

      return true;
    },
  },
};
