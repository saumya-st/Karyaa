"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Users,
  LogOut,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Inbox,
  BarChart3,
  Lightbulb,
  StickyNote,
  X,
  Plus,
  Loader2,
} from "lucide-react";
import { useState } from "react";
import { SearchDialog } from "./search-dialog";
import { CreateProjectDialog } from "./create-project-dialog";
import { createTeam } from "@/lib/actions/teams";

interface SidebarProps {
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
  onClose?: () => void;
}

export default function Sidebar({ user, projects, teams, unreadCount = 0, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [projectsOpen, setProjectsOpen] = useState(true);
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [creatingTeam, setCreatingTeam] = useState(false);

  async function handleCreateTeam() {
    if (!newTeamName.trim()) return;
    setCreatingTeam(true);
    const result = await createTeam(newTeamName.trim());
    setCreatingTeam(false);
    if (result?.success) {
      setNewTeamName("");
      setShowCreateTeam(false);
      router.refresh();
    }
  }

  return (
    <aside className="w-64 bg-[#141414] border-r border-[#262626] flex flex-col h-full shrink-0">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-[#262626]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="Logo" width={36} height={36} className="rounded-lg object-contain" priority />
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="md:hidden p-1.5 rounded-lg text-[#737373] hover:text-[#f5f5f5] hover:bg-[#2a2a2a] transition"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="px-3 py-2">
        <SearchDialog />
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5">
        {/* Primary items */}
        {[
          { href: "/dashboard", label: "Home", icon: LayoutDashboard },
          { href: "/dashboard/my-tasks", label: "My tasks", icon: CheckCircle },
          { href: "/dashboard/inbox", label: "Inbox", icon: Inbox, badge: unreadCount },
        ].map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
                isActive
                  ? "bg-[#2a2a2a] text-[#f5f5f5]"
                  : "text-[#a3a3a3] hover:bg-[#1f1f1f] hover:text-[#f5f5f5]"
              }`}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {item.label}
              {"badge" in item && item.badge !== undefined && item.badge > 0 && (
                <span className="ml-auto text-xs bg-red-500 text-white px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}

        {/* Insights section */}
        <div className="pt-3">
          <p className="px-3 py-1 text-[10px] font-semibold text-[#525252] uppercase tracking-widest">Insights</p>
          {[
            { href: "/dashboard/reporting", label: "Reporting", icon: BarChart3 },
            { href: "/dashboard/ideas", label: "Ideas", icon: Lightbulb },
            { href: "/dashboard/notes", label: "My Notes", icon: StickyNote },
          ].map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
                  isActive
                    ? "bg-[#2a2a2a] text-[#f5f5f5]"
                    : "text-[#a3a3a3] hover:bg-[#1f1f1f] hover:text-[#f5f5f5]"
                }`}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Projects section */}
        <div className="pt-3">
          <div className="flex items-center justify-between px-3 py-1">
            <button
              onClick={() => setProjectsOpen(!projectsOpen)}
              className="flex items-center gap-1 text-[10px] font-semibold text-[#525252] uppercase tracking-widest hover:text-[#a3a3a3] transition"
            >
              <span>Projects</span>
              {projectsOpen ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </button>
            <CreateProjectDialog
              teams={teams.map((t) => ({ id: t.id, name: t.name }))}
              trigger={
                <button
                  className="p-0.5 rounded text-[#525252] hover:text-[#a3a3a3] transition"
                  title="New project"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              }
            />
          </div>

          {projectsOpen && (
            <div className="mt-1 space-y-0.5">
              {projects.map((project) => {
                const isActive = pathname === `/dashboard/projects/${project.id}`;
                return (
                  <Link
                    key={project.id}
                    href={`/dashboard/projects/${project.id}`}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
                      isActive
                        ? "bg-[#2a2a2a] text-[#f5f5f5] font-medium"
                        : "text-[#a3a3a3] hover:bg-[#1f1f1f] hover:text-[#f5f5f5]"
                    }`}
                  >
                    <div
                      className="w-3 h-3 rounded-sm shrink-0"
                      style={{ backgroundColor: project.color }}
                    />
                    <span className="truncate">{project.name}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Teams section */}
        <div className="pt-3">
          <div className="flex items-center justify-between px-3 py-1">
            <p className="text-[10px] font-semibold text-[#525252] uppercase tracking-widest">Teams</p>
            <button
              onClick={() => setShowCreateTeam(!showCreateTeam)}
              className="p-0.5 rounded text-[#525252] hover:text-[#a3a3a3] transition"
              title="New team"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {showCreateTeam && (
            <div className="px-3 mt-1 mb-1">
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  placeholder="Team name"
                  className="flex-1 min-w-0 px-2 py-1 text-xs bg-[#1a1a1a] border border-[#3a3a3a] text-[#f5f5f5] placeholder-[#525252] rounded-md focus:ring-1 focus:ring-[#6B7A45] outline-none"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreateTeam();
                    if (e.key === "Escape") { setShowCreateTeam(false); setNewTeamName(""); }
                  }}
                  autoFocus
                />
                <button
                  onClick={handleCreateTeam}
                  disabled={!newTeamName.trim() || creatingTeam}
                  className="p-1 rounded-md text-[#6B7A45] hover:bg-[#1f2414] transition disabled:opacity-50"
                >
                  {creatingTeam ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => { setShowCreateTeam(false); setNewTeamName(""); }}
                  className="p-1 rounded-md text-[#525252] hover:text-[#a3a3a3] transition"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {teams.map((team) => (
              <Link
                key={team.id}
                href="/dashboard/team"
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
                  pathname === "/dashboard/team"
                    ? "bg-[#2a2a2a] text-[#f5f5f5] font-medium"
                    : "text-[#a3a3a3] hover:bg-[#1f1f1f] hover:text-[#f5f5f5]"
                }`}
              >
                <Users className="w-4 h-4 shrink-0" />
                <span className="truncate">{team.name}</span>
                <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-40" />
              </Link>
            ))}
        </div>
      </nav>

      {/* User */}
      <div className="border-t border-[#262626] p-3">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-[#6B7A45] flex items-center justify-center text-white text-sm font-semibold shrink-0">
            {user.name?.[0]?.toUpperCase() || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[#f5f5f5] truncate">{user.name}</p>
            <p className="text-xs text-[#737373] truncate">{user.email}</p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="p-1.5 rounded-lg text-[#737373] hover:text-red-400 hover:bg-red-950/40 transition"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
