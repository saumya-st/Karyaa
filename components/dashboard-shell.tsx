"use client";

import { Suspense, useState } from "react";
import Image from "next/image";
import { Menu } from "lucide-react";
import Sidebar from "./sidebar";

// Minimal content-area skeleton used as Suspense fallback during page transitions
function ContentSkeleton() {
  return (
    <div className="p-4 md:p-6 animate-pulse space-y-4">
      <div className="h-6 w-48 bg-[#2a2a2a] rounded-lg" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-[#212121] border border-[#2e2e2e] rounded-xl p-4 space-y-3">
            <div className="h-4 w-24 bg-[#2a2a2a] rounded" />
            <div className="h-3 w-full bg-[#262626] rounded" />
            <div className="h-3 w-3/4 bg-[#262626] rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

interface Props {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  projects: Array<{
    id: string;
    name: string;
    color: string;
  }>;
  teams: Array<{
    id: string;
    name: string;
    _count: { projects: number };
  }>;
  unreadCount?: number;
  children: React.ReactNode;
}

export function DashboardShell({
  user,
  projects,
  teams,
  unreadCount,
  children,
}: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[#1a1a1a] overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar wrapper */}
      <div
        className={`
          fixed md:relative inset-y-0 left-0 z-50 md:z-auto h-full
          transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        <Sidebar
          user={user}
          projects={projects}
          teams={teams}
          unreadCount={unreadCount}
          onClose={() => setSidebarOpen(false)}
        />
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-auto bg-[#1a1a1a] min-w-0 flex flex-col">
        {/* Mobile top bar */}
        <div className="sticky top-0 z-30 flex items-center gap-3 px-4 py-3 bg-[#141414] border-b border-[#262626] md:hidden shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg text-[#a3a3a3] hover:text-[#f5f5f5] hover:bg-[#2a2a2a] transition"
          >
            <Menu className="w-5 h-5" />
          </button>
          <Image
            src="/logo.png"
            alt="Logo"
            width={28}
            height={28}
            className="rounded-lg object-contain"
            priority
          />
        </div>
        <div className="flex-1 overflow-auto">
          <Suspense fallback={<ContentSkeleton />}>
            {children}
          </Suspense>
        </div>
      </main>
    </div>
  );
}
