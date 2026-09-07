import { getInviteByToken, acceptInvite } from "@/lib/actions/invites";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { InviteAcceptClient } from "./client";

interface Props {
  params: Promise<{ token: string }>;
}

export default async function InvitePage({ params }: Props) {
  const { token } = await params;
  const [invite, session] = await Promise.all([
    getInviteByToken(token),
    getSession(),
  ]);

  if (!invite) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Invalid Invite</h1>
          <p className="text-gray-500 mb-6">This invite link is invalid or has been revoked.</p>
          <a href="/login" className="inline-flex items-center px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition">
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  if (invite.expired) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Invite Expired</h1>
          <p className="text-gray-500 mb-6">This invite link has expired. Please ask the sender for a new one.</p>
          <a href="/login" className="inline-flex items-center px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition">
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  // If user is logged in, show accept button. If not, redirect to login first.
  const isLoggedIn = !!session?.user?.id;

  return (
    <InviteAcceptClient
      token={token}
      projectName={invite.project.name}
      projectColor={invite.project.color}
      projectDescription={invite.project.description}
      inviterName={invite.invitedBy.name}
      inviterAvatar={invite.invitedBy.avatar}
      teamName={invite.team.name}
      isLoggedIn={isLoggedIn}
    />
  );
}
