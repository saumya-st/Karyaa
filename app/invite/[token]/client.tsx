"use client";

import { useState, useTransition } from "react";
import { acceptInvite } from "@/lib/actions/invites";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2 } from "lucide-react";

interface Props {
  token: string;
  projectName: string;
  projectColor: string;
  projectDescription: string | null;
  inviterName: string;
  inviterAvatar: string | null;
  teamName: string;
  isLoggedIn: boolean;
}

export function InviteAcceptClient({
  token,
  projectName,
  projectColor,
  projectDescription,
  inviterName,
  inviterAvatar,
  teamName,
  isLoggedIn,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleAccept() {
    startTransition(async () => {
      try {
        const result = await acceptInvite(token);
        if (result.error) {
          if (result.redirect) {
            router.push(`${result.redirect}?callbackUrl=/invite/${token}`);
            return;
          }
          setError(result.error);
        } else if (result.success && result.projectId) {
          if (result.alreadyMember) {
            setAccepted(true);
            setError(null);
            setTimeout(() => {
              router.push(`/dashboard/projects/${result.projectId}`);
            }, 1000);
          } else {
            setAccepted(true);
            setTimeout(() => {
              router.push(`/dashboard/projects/${result.projectId}`);
            }, 1500);
          }
        } else {
          setError("Unexpected response. Please try again.");
        }
      } catch (err) {
        console.error("Accept invite error:", err);
        setError("Failed to accept invite. Please try again.");
      }
    });
  }

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        {/* Header gradient */}
        <div className="h-2 bg-gradient-to-r bg-[#6B7C42]" />

        <div className="p-8">
          {/* Logo */}
          <div className="flex items-center gap-2.5 mb-8">
            <div className="w-9 h-9 bg-[#6B7C42] rounded-xl flex items-center justify-center text-white font-bold text-lg">
              K
            </div>
            <span className="text-xl font-bold text-gray-900">Karya</span>
          </div>

          {accepted ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
              <h1 className="text-xl font-bold text-gray-900 mb-2">You&apos;re in!</h1>
              <p className="text-gray-500">Redirecting to the project...</p>
            </div>
          ) : (
            <>
              {/* Inviter info */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-[#6B7C42] flex items-center justify-center text-white font-medium flex-shrink-0">
                  {inviterAvatar ? (
                    <img src={inviterAvatar} className="w-10 h-10 rounded-full" alt="" />
                  ) : (
                    inviterName[0].toUpperCase()
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-500">
                    <strong className="text-gray-900">{inviterName}</strong> invited you to join
                  </p>
                </div>
              </div>

              {/* Project card */}
              <div className="bg-gray-50 rounded-xl p-5 mb-6 border border-gray-100">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-xl flex-shrink-0"
                    style={{ backgroundColor: projectColor }}
                  >
                    {projectName[0].toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">{projectName}</h2>
                    {projectDescription && (
                      <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{projectDescription}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">Team: {teamName}</p>
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-3 mb-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                  {error}
                </div>
              )}

              {isLoggedIn ? (
                <button
                  onClick={handleAccept}
                  disabled={isPending}
                  className="w-full py-3 bg-gradient-to-r bg-[#6B7C42] text-white rounded-xl font-semibold hover:bg-gray-800 disabled:opacity-50 transition flex items-center justify-center gap-2"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Joining...
                    </>
                  ) : (
                    "Accept & Join Project"
                  )}
                </button>
              ) : (
                <div className="space-y-3">
                  <a
                    href={`/login?callbackUrl=/invite/${token}`}
                    className="block w-full py-3 bg-black text-white rounded-xl font-semibold text-center hover:bg-gray-800 transition"
                  >
                    Log in to Accept
                  </a>
                  <a
                    href={`/register?callbackUrl=/invite/${token}`}
                    className="block w-full py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold text-center hover:bg-gray-50 transition"
                  >
                    Create Account
                  </a>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
