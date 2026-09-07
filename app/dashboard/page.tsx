import { getSession } from "@/lib/auth";
import { getProjects } from "@/lib/actions/projects";
import { getTeams } from "@/lib/actions/teams";
import { getMyTasks } from "@/lib/actions/tasks";
import Link from "next/link";
import { Plus, CheckSquare, Calendar, Clock } from "lucide-react";
import { CreateProjectDialog } from "@/components/create-project-dialog";
import { MyTasksCard } from "@/components/my-tasks-card";

export default async function DashboardPage() {
  const session = await getSession();
  const [projects, teams, myTasks] = await Promise.all([
    getProjects(),
    getTeams(),
    getMyTasks(),
  ]);

  // Collect all unique members across teams
  const allMembers: { id: string; name: string; avatar: string | null }[] = [];
  const seenIds = new Set<string>();
  for (const team of teams) {
    for (const m of team.members) {
      if (!seenIds.has(m.user.id) && m.user.id !== session?.user?.id) {
        seenIds.add(m.user.id);
        allMembers.push(m.user);
      }
    }
  }

  const firstName = session?.user?.name?.split(" ")[0] ?? "there";
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-full bg-[#1a1a1a] text-[#f5f5f5]">
      {/* ── Top bar ── */}
      <div className="px-6 md:px-10 pt-8 pb-2 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-xs text-[#737373] mb-1">{dateStr}</p>
          <h1 className="text-3xl font-bold text-[#f5f5f5]">
            Good {getTimeOfDay()}, {firstName}
          </h1>
        </div>
        <div className="flex items-center gap-3 text-sm text-[#a3a3a3]">
          <div className="flex items-center gap-1.5 bg-[#212121] border border-[#2e2e2e] rounded-lg px-3 py-1.5">
            <CheckSquare className="w-3.5 h-3.5 text-[#6B7A45]" />
            <span className="font-medium text-[#f5f5f5]">{myTasks.completedThisWeek.length}</span>
            <span>tasks completed</span>
          </div>
          <div className="flex items-center gap-1.5 bg-[#212121] border border-[#2e2e2e] rounded-lg px-3 py-1.5">
            <div className="flex -space-x-1">
              {allMembers.slice(0, 3).map((m) => (
                <div
                  key={m.id}
                  className="w-5 h-5 rounded-full bg-[#6B7A45] flex items-center justify-center text-[9px] font-bold text-white border border-[#1a1a1a]"
                >
                  {m.name?.[0]?.toUpperCase()}
                </div>
              ))}
            </div>
            <span className="font-medium text-[#f5f5f5]">{allMembers.length}</span>
            <span>{allMembers.length === 1 ? "collaborator" : "collaborators"}</span>
          </div>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="px-6 md:px-10 py-6 space-y-6">

        {/* My Tasks card */}
        <MyTasksCard
          upcoming={myTasks.upcoming}
          overdue={myTasks.overdue}
          completed={myTasks.completed}
          userName={session?.user?.name ?? ""}
          userInitial={(session?.user?.name?.[0] ?? "U").toUpperCase()}
        />

        {/* Bottom row: Projects + People */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Projects */}
          <div className="bg-[#212121] border border-[#2e2e2e] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-[#f5f5f5]">Projects</h2>
                <span className="text-xs bg-[#2a2a2a] border border-[#333] text-[#a3a3a3] px-2 py-0.5 rounded-full">
                  Recents
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {/* Create project tile */}
              <div className="col-span-1">
                {teams.length > 0 ? (
                  <CreateProjectDialog
                    teams={teams}
                    trigger={
                      <button className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-dashed border-[#333] hover:border-[#6B7A45] hover:bg-[#1f2414] transition group text-left">
                        <div className="w-9 h-9 rounded-lg border-2 border-dashed border-[#444] group-hover:border-[#6B7A45] flex items-center justify-center shrink-0">
                          <Plus className="w-4 h-4 text-[#737373] group-hover:text-[#6B7A45]" />
                        </div>
                        <span className="text-sm text-[#737373] group-hover:text-[#f5f5f5] transition">Create project</span>
                      </button>
                    }
                  />
                ) : (
                  <div className="flex items-center gap-3 p-4 rounded-xl border-2 border-dashed border-[#333] text-[#525252]">
                    <Plus className="w-4 h-4" />
                    <span className="text-sm">No team yet</span>
                  </div>
                )}
              </div>

              {/* Project tiles */}
              {projects.slice(0, 5).map((project: { id: string; name: string; color: string; _count: { tasks: number } }) => (
                <Link
                  key={project.id}
                  href={`/dashboard/projects/${project.id}`}
                  className="flex items-center gap-3 p-4 rounded-xl bg-[#1a1a1a] border border-[#2e2e2e] hover:border-[#6B7A45]/50 hover:bg-[#1f2414] transition group"
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0"
                    style={{ backgroundColor: project.color }}
                  >
                    {project.name[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#f5f5f5] truncate group-hover:text-[#8a9a5b] transition">
                      {project.name}
                    </p>
                    <p className="text-[11px] text-[#737373]">
                      {project._count.tasks} tasks due soon
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* People */}
          <div className="bg-[#212121] border border-[#2e2e2e] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-[#f5f5f5]">People</h2>
                <span className="text-xs bg-[#2a2a2a] border border-[#333] text-[#a3a3a3] px-2 py-0.5 rounded-full">
                  Frequent collaborators
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {/* Invite tile */}
              <Link
                href="/dashboard/team"
                className="flex items-center gap-3 p-4 rounded-xl border-2 border-dashed border-[#333] hover:border-[#6B7A45] hover:bg-[#1f2414] transition group"
              >
                <div className="w-9 h-9 rounded-full border-2 border-dashed border-[#444] group-hover:border-[#6B7A45] flex items-center justify-center shrink-0">
                  <Plus className="w-4 h-4 text-[#737373] group-hover:text-[#6B7A45]" />
                </div>
                <span className="text-sm text-[#737373] group-hover:text-[#f5f5f5] transition">Invite</span>
              </Link>

              {/* Member tiles */}
              {allMembers.slice(0, 5).map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-3 p-4 rounded-xl bg-[#1a1a1a] border border-[#2e2e2e]"
                >
                  <div className="w-9 h-9 rounded-full bg-[#6B7A45]/20 border border-[#6B7A45]/30 flex items-center justify-center text-[#8a9a5b] font-semibold text-sm shrink-0">
                    {member.name?.[0]?.toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-[#f5f5f5] truncate">{member.name}</span>
                </div>
              ))}

              {allMembers.length === 0 && (
                <div className="col-span-2 py-6 text-center text-sm text-[#525252]">
                  No collaborators yet. Invite your team!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}
