import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// Debug endpoint: GET /api/debug/calendar-status
// Shows whether the current user has Google tokens stored
export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const account = await prisma.account.findFirst({
    where: { userId: session.user.id, provider: "google" },
    select: {
      id: true,
      provider: true,
      access_token: true,
      refresh_token: true,
      expires_at: true,
      scope: true,
    },
  });

  if (!account) {
    return NextResponse.json({
      status: "no_google_account",
      message: "No Google account linked. Sign in with Google to enable calendar sync.",
      userId: session.user.id,
    });
  }

  return NextResponse.json({
    status: "connected",
    userId: session.user.id,
    hasAccessToken: !!account.access_token,
    hasRefreshToken: !!account.refresh_token,
    tokenLength: account.access_token?.length || 0,
    expiresAt: account.expires_at ? new Date(account.expires_at * 1000).toISOString() : null,
    scope: account.scope,
  });
}
