"use client";

import { useState, useTransition } from "react";
import {
  X,
  Search,
  Copy,
  Check,
  Mail,
  Link2,
  UserPlus,
  AlertCircle,
  Loader2,
} from "lucide-react";
import {
  lookupUserByEmail,
  addUserToProjectTeam,
  createProjectInviteLink,
  sendProjectInviteEmail,
} from "@/lib/actions/invites";

interface Props {
  projectId: string;
  projectName: string;
  onClose: () => void;
}

interface LookedUpUser {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
}

export function InviteDialog({ projectId, projectName, onClose }: Props) {
  const [email, setEmail] = useState("");
  const [lookupResult, setLookupResult] = useState<LookedUpUser | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [isSearching, startSearchTransition] = useTransition();
  const [isAdding, startAddTransition] = useTransition();
  const [isCopyingLink, startCopyTransition] = useTransition();
  const [isSendingEmail, startEmailTransition] = useTransition();
  const [copiedLink, setCopiedLink] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  function handleLookup() {
    if (!email.trim() || !email.includes("@")) return;
    setLookupResult(null);
    setNotFound(false);
    setMessage(null);

    startSearchTransition(async () => {
      const user = await lookupUserByEmail(email.trim());
      if (user) {
        setLookupResult(user);
        setNotFound(false);
      } else {
        setLookupResult(null);
        setNotFound(true);
      }
    });
  }

  function handleAddUser() {
    if (!lookupResult) return;
    startAddTransition(async () => {
      const result = await addUserToProjectTeam(projectId, lookupResult.id);
      if (result.error) {
        setMessage({ type: "error", text: result.error });
      } else {
        setMessage({ type: "success", text: `${lookupResult.name} has been added to the project!` });
        setLookupResult(null);
        setEmail("");
      }
    });
  }

  function handleCopyLink() {
    startCopyTransition(async () => {
      if (generatedLink) {
        await navigator.clipboard.writeText(generatedLink);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
        return;
      }
      const result = await createProjectInviteLink(projectId);
      if (result.error) {
        setMessage({ type: "error", text: result.error });
      } else if (result.link) {
        setGeneratedLink(result.link);
        await navigator.clipboard.writeText(result.link);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      }
    });
  }

  function handleSendEmail() {
    if (!email.trim() || !email.includes("@")) return;
    startEmailTransition(async () => {
      const result = await sendProjectInviteEmail(projectId, email.trim());
      if (result.error) {
        setMessage({ type: "error", text: result.error });
      } else {
        setMessage({ type: "success", text: `Invite email sent to ${email}!` });
        if (result.link) setGeneratedLink(result.link);
      }
    });
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1e1e1e] border border-[#2e2e2e] rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="p-6 pb-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[#f5f5f5]">
                Invite to {projectName}
              </h2>
              <p className="text-sm text-[#737373] mt-0.5">
                Add members by email or share an invite link
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#525252] hover:text-[#f5f5f5] hover:bg-[#2a2a2a] transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Email search */}
          <div>
            <label className="block text-sm font-medium text-[#a3a3a3] mb-1.5">
              Email address
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#525252]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setLookupResult(null);
                    setNotFound(false);
                    setMessage(null);
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleLookup()}
                  placeholder="name@example.com"
                  className="w-full pl-9 pr-3 py-2.5 bg-[#2a2a2a] border border-[#3a3a3a] text-[#f5f5f5] placeholder:text-[#525252] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#6B7A45] focus:border-transparent"
                />
              </div>
              <button
                onClick={handleLookup}
                disabled={!email.includes("@") || isSearching}
                className="px-4 py-2.5 bg-[#6B7A45] text-white rounded-lg text-sm font-medium hover:bg-[#5a6838] disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {isSearching ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Look up"
                )}
              </button>
            </div>
          </div>

          {/* Lookup result — found user */}
          {lookupResult && (
            <div className="flex items-center gap-3 p-3 bg-green-950/30 border border-green-900/40 rounded-xl">
              <div className="w-10 h-10 rounded-full bg-[#6B7C42] flex items-center justify-center text-white font-medium text-sm flex-shrink-0">
                {lookupResult.avatar ? (
                  <img src={lookupResult.avatar} className="w-10 h-10 rounded-full" alt="" />
                ) : (
                  lookupResult.name[0].toUpperCase()
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#f5f5f5] truncate">{lookupResult.name}</p>
                <p className="text-xs text-[#737373] truncate">{lookupResult.email}</p>
              </div>
              <button
                onClick={handleAddUser}
                disabled={isAdding}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition"
              >
                {isAdding ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <UserPlus className="w-3.5 h-3.5" />
                )}
                Add to Project
              </button>
            </div>
          )}

          {/* Lookup result — user not found */}
          {notFound && (
            <div className="p-3 bg-amber-950/30 border border-amber-900/40 rounded-xl">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-400">
                    No account found for &quot;{email}&quot;
                  </p>
                  <p className="text-xs text-amber-500 mt-0.5">
                    You can still share an invite link or send them an email invite below.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Status message */}
          {message && (
            <div
              className={`p-3 rounded-xl text-sm font-medium ${
                message.type === "success"
                  ? "bg-green-950/30 border border-green-900/40 text-green-400"
                  : "bg-red-950/30 border border-red-900/40 text-red-400"
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#2e2e2e]" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-[#1e1e1e] px-3 text-[#525252] uppercase tracking-wider font-medium">
                Or share link
              </span>
            </div>
          </div>

          {/* Link & Email actions */}
          <div className="space-y-3">
            {/* Copy invite link */}
            <button
              onClick={handleCopyLink}
              disabled={isCopyingLink}
              className="w-full flex items-center gap-3 p-3.5 border border-[#2e2e2e] rounded-xl hover:bg-[#1f1f1f] transition group"
            >
              <div className="w-10 h-10 rounded-lg bg-[#1f2414] flex items-center justify-center flex-shrink-0">
                {copiedLink ? (
                  <Check className="w-5 h-5 text-green-600" />
                ) : isCopyingLink ? (
                  <Loader2 className="w-5 h-5 text-[#6B7C42] animate-spin" />
                ) : (
                  <Link2 className="w-5 h-5 text-[#6B7C42]" />
                )}
              </div>
              <div className="text-left flex-1">
                <p className="text-sm font-medium text-[#f5f5f5]">{copiedLink ? "Link copied!" : "Copy invite link"}
                </p>
                <p className="text-xs text-[#737373]">Share via WhatsApp, Slack, or anywhere
                </p>
              </div>
              <Copy className="w-4 h-4 text-[#525252] group-hover:text-[#a3a3a3] transition" />
            </button>

            {/* Send email invite */}
            <button
              onClick={handleSendEmail}
              disabled={!email.includes("@") || isSendingEmail}
              className="w-full flex items-center gap-3 p-3.5 border border-[#2e2e2e] rounded-xl hover:bg-[#1f1f1f] transition group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="w-10 h-10 rounded-lg bg-[#1f2414] flex items-center justify-center flex-shrink-0">
                {isSendingEmail ? (
                  <Loader2 className="w-5 h-5 text-[#6B7C42] animate-spin" />
                ) : (
                  <Mail className="w-5 h-5 text-[#6B7C42]" />
                )}
              </div>
              <div className="text-left flex-1">
                <p className="text-sm font-medium text-[#f5f5f5]">Send email invite
                </p>
                <p className="text-xs text-[#737373]">{email.includes("@")
                    ? `Send a styled invite email to ${email}`
                    : "Enter an email address above first"}
                </p>
              </div>
              <Mail className="w-4 h-4 text-[#525252] group-hover:text-[#a3a3a3] transition" />
            </button>
          </div>

          {/* Generated link display */}
          {generatedLink && (
            <div className="p-3 bg-[#1a1a1a] border border-[#262626] rounded-xl">
              <p className="text-xs text-[#737373] mb-1 font-medium">Invite link (expires in 7 days)</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs text-[#9aad6f] bg-[#2a2a2a] px-2.5 py-1.5 rounded-lg border border-[#3a3a3a] truncate">
                  {generatedLink}
                </code>
                <button
                  onClick={async () => {
                    await navigator.clipboard.writeText(generatedLink);
                    setCopiedLink(true);
                    setTimeout(() => setCopiedLink(false), 2000);
                  }}
                  className="p-1.5 text-[#525252] hover:text-[#a3a3a3] transition"
                >
                  {copiedLink ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
