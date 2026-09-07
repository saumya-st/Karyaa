"use client";

import { useMemo } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Clock,
  AlertCircle,
  Flame,
  ArrowUp,
  Minus,
  ArrowDown,
} from "lucide-react";

interface Task {
  id: string;
  title: string;
  completed: boolean;
  status: string;
  priority: string;
  dueDate: string | null;
  assignee: { id: string; name: string; avatar: string | null } | null;
  assignees?: Array<{ user: { id: string; name: string; avatar: string | null } }>;
}

interface Section {
  id: string;
  name: string;
  tasks: Task[];
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
}

interface Project {
  id: string;
  name: string;
  sections: Section[];
  team: {
    members: Array<{ id: string; role: string; user: TeamMember }>;
  };
}

interface Props {
  project: Project;
}

interface MemberStats {
  userId: string;
  name: string;
  avatar: string | null;
  assigned: number;
  completed: number;
  inProgress: number;
  notStarted: number;
  overdue: number;
}

export function ProjectProgress({ project }: Props) {
  const { allTasks, memberStats, priorityDist, sectionDist, overallStats } = useMemo(() => {
    const tasks = project.sections.flatMap((s) => s.tasks);
    const now = new Date();

    // Overall stats
    const total = tasks.length;
    const completed = tasks.filter((t) => t.completed).length;
    const inProgress = tasks.filter(
      (t) => !t.completed && (t.status === "in_progress" || t.status === "In Progress")
    ).length;
    const overdue = tasks.filter(
      (t) => !t.completed && t.dueDate && new Date(t.dueDate) < now
    ).length;
    const notStarted = total - completed - inProgress;

    // Per-member
    const statsMap = new Map<string, MemberStats>();
    // Initialize for all team members
    project.team.members.forEach((m) => {
      statsMap.set(m.user.id, {
        userId: m.user.id,
        name: m.user.name,
        avatar: m.user.avatar,
        assigned: 0,
        completed: 0,
        inProgress: 0,
        notStarted: 0,
        overdue: 0,
      });
    });

    tasks.forEach((task) => {
      const assigneeIds = new Set<string>();
      if (task.assignee) assigneeIds.add(task.assignee.id);
      task.assignees?.forEach((a) => assigneeIds.add(a.user.id));

      assigneeIds.forEach((uid) => {
        const existing = statsMap.get(uid);
        if (!existing) return;
        existing.assigned++;
        if (task.completed) {
          existing.completed++;
        } else {
          if (task.status === "in_progress" || task.status === "In Progress") {
            existing.inProgress++;
          } else {
            existing.notStarted++;
          }
          if (task.dueDate && new Date(task.dueDate) < now) {
            existing.overdue++;
          }
        }
      });
    });

    // Priority distribution
    const pDist = { urgent: 0, high: 0, medium: 0, low: 0, none: 0 };
    tasks.forEach((t) => {
      const p = t.priority?.toLowerCase() as keyof typeof pDist;
      if (p in pDist) pDist[p]++;
      else pDist.none++;
    });

    // Per-section distribution
    const sDist = project.sections.map((s) => ({
      name: s.name,
      total: s.tasks.length,
      completed: s.tasks.filter((t) => t.completed).length,
    }));

    return {
      allTasks: tasks,
      memberStats: Array.from(statsMap.values()).sort((a, b) => b.assigned - a.assigned),
      priorityDist: pDist,
      sectionDist: sDist,
      overallStats: { total, completed, inProgress, overdue, notStarted },
    };
  }, [project.sections, project.team.members]);

  const completionPct =
    overallStats.total > 0
      ? Math.round((overallStats.completed / overallStats.total) * 100)
      : 0;

  return (
    <div className="p-4 md:p-6 space-y-6 overflow-auto max-w-6xl mx-auto">
      {/* Overall Progress */}
      <div className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#B8C87A]" />
            <h2 className="text-sm font-semibold text-[#f5f5f5] uppercase tracking-wider">
              Overall Progress
            </h2>
          </div>
          <span className="text-2xl font-bold text-[#B8C87A]">{completionPct}%</span>
        </div>
        {/* Big progress bar */}
        <div className="w-full h-4 bg-[#262626] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${completionPct}%`,
              background: `linear-gradient(90deg, #6B7A45, #B8C87A)`,
            }}
          />
        </div>
        <div className="flex items-center justify-between mt-3 text-xs text-[#737373]">
          <span>
            {overallStats.completed} of {overallStats.total} tasks completed
          </span>
          <span>
            {overallStats.total - overallStats.completed} remaining
          </span>
        </div>

        {/* Status breakdown row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
          <MiniStat
            icon={<CheckCircle2 className="w-4 h-4" />}
            label="Completed"
            value={overallStats.completed}
            color="text-emerald-400"
          />
          <MiniStat
            icon={<Clock className="w-4 h-4" />}
            label="In Progress"
            value={overallStats.inProgress}
            color="text-blue-400"
          />
          <MiniStat
            icon={<AlertCircle className="w-4 h-4" />}
            label="Not Started"
            value={overallStats.notStarted}
            color="text-[#a3a3a3]"
          />
          <MiniStat
            icon={<AlertTriangle className="w-4 h-4" />}
            label="Overdue"
            value={overallStats.overdue}
            color="text-red-400"
          />
        </div>
      </div>

      {/* Priority & Section Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Priority */}
        <div className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-5">
          <h2 className="text-sm font-semibold text-[#f5f5f5] uppercase tracking-wider mb-4">
            Priority Distribution
          </h2>
          <div className="space-y-3">
            <PriorityBar
              label="Urgent"
              count={priorityDist.urgent}
              total={overallStats.total}
              color="bg-red-500"
              icon={<Flame className="w-3.5 h-3.5 text-red-400" />}
            />
            <PriorityBar
              label="High"
              count={priorityDist.high}
              total={overallStats.total}
              color="bg-orange-500"
              icon={<ArrowUp className="w-3.5 h-3.5 text-orange-400" />}
            />
            <PriorityBar
              label="Medium"
              count={priorityDist.medium}
              total={overallStats.total}
              color="bg-amber-500"
              icon={<Minus className="w-3.5 h-3.5 text-amber-400" />}
            />
            <PriorityBar
              label="Low"
              count={priorityDist.low}
              total={overallStats.total}
              color="bg-blue-500"
              icon={<ArrowDown className="w-3.5 h-3.5 text-blue-400" />}
            />
          </div>
        </div>

        {/* Section Distribution */}
        <div className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-5">
          <h2 className="text-sm font-semibold text-[#f5f5f5] uppercase tracking-wider mb-4">
            Section Breakdown
          </h2>
          <div className="space-y-3">
            {sectionDist.map((s) => {
              const pct = s.total > 0 ? Math.round((s.completed / s.total) * 100) : 0;
              return (
                <div key={s.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-[#d4d4d4]">{s.name}</span>
                    <span className="text-xs text-[#737373]">
                      {s.completed}/{s.total} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-[#262626] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#6B7A45] rounded-full transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {sectionDist.length === 0 && (
              <p className="text-xs text-[#525252] italic">No sections</p>
            )}
          </div>
        </div>
      </div>

      {/* Per-Member Progress */}
      <div className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-5">
        <h2 className="text-sm font-semibold text-[#f5f5f5] uppercase tracking-wider mb-4">
          Member Progress
        </h2>
        {memberStats.length === 0 ? (
          <p className="text-xs text-[#525252] italic">No members</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#262626] text-[#737373] text-xs uppercase tracking-wider">
                  <th className="text-left py-2 pr-4 font-medium">Member</th>
                  <th className="text-center py-2 px-2 font-medium">Assigned</th>
                  <th className="text-center py-2 px-2 font-medium">Done</th>
                  <th className="text-center py-2 px-2 font-medium">In Progress</th>
                  <th className="text-center py-2 px-2 font-medium">Not Started</th>
                  <th className="text-center py-2 px-2 font-medium">Overdue</th>
                  <th className="text-left py-2 pl-4 font-medium w-40">Completion</th>
                </tr>
              </thead>
              <tbody>
                {memberStats.map((m) => {
                  const pct = m.assigned > 0 ? Math.round((m.completed / m.assigned) * 100) : 0;
                  return (
                    <tr
                      key={m.userId}
                      className="border-b border-[#1f1f1f] hover:bg-[#141414] transition"
                    >
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-[#6B7C42] flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                            {m.name[0].toUpperCase()}
                          </div>
                          <span className="text-[#f5f5f5] font-medium truncate max-w-[150px]">
                            {m.name}
                          </span>
                        </div>
                      </td>
                      <td className="text-center py-3 px-2 text-[#d4d4d4]">{m.assigned}</td>
                      <td className="text-center py-3 px-2 text-emerald-400 font-medium">
                        {m.completed}
                      </td>
                      <td className="text-center py-3 px-2 text-blue-400">{m.inProgress}</td>
                      <td className="text-center py-3 px-2 text-[#a3a3a3]">{m.notStarted}</td>
                      <td className="text-center py-3 px-2">
                        {m.overdue > 0 ? (
                          <span className="text-red-400 font-medium">{m.overdue}</span>
                        ) : (
                          <span className="text-[#525252]">0</span>
                        )}
                      </td>
                      <td className="py-3 pl-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-[#262626] rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-300"
                              style={{
                                width: `${pct}%`,
                                background:
                                  pct >= 75
                                    ? "#22c55e"
                                    : pct >= 50
                                    ? "#B8C87A"
                                    : pct >= 25
                                    ? "#eab308"
                                    : "#ef4444",
                              }}
                            />
                          </div>
                          <span className="text-xs text-[#a3a3a3] w-8 text-right font-mono">
                            {pct}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Unassigned Tasks Alert */}
      {(() => {
        const unassigned = allTasks.filter(
          (t) => !t.completed && !t.assignee && (!t.assignees || t.assignees.length === 0)
        );
        if (unassigned.length === 0) return null;
        return (
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-400">
                {unassigned.length} unassigned task{unassigned.length > 1 ? "s" : ""}
              </p>
              <p className="text-xs text-[#a3a3a3] mt-1">
                These tasks don&apos;t have anyone assigned and won&apos;t appear in member progress.
              </p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {unassigned.slice(0, 5).map((t) => (
                  <span
                    key={t.id}
                    className="text-[10px] px-2 py-0.5 bg-amber-500/10 text-amber-300 rounded-full border border-amber-500/20"
                  >
                    {t.title}
                  </span>
                ))}
                {unassigned.length > 5 && (
                  <span className="text-[10px] px-2 py-0.5 text-[#737373]">
                    +{unassigned.length - 5} more
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

// --- Sub-components ---

function MiniStat({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-[#141414] rounded-lg border border-[#262626]">
      <span className={color}>{icon}</span>
      <div>
        <p className={`text-lg font-bold ${color}`}>{value}</p>
        <p className="text-[10px] text-[#737373] uppercase tracking-wider">{label}</p>
      </div>
    </div>
  );
}

function PriorityBar({
  label,
  count,
  total,
  color,
  icon,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
  icon: React.ReactNode;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm text-[#d4d4d4]">{label}</span>
        </div>
        <span className="text-xs text-[#737373]">
          {count} ({pct}%)
        </span>
      </div>
      <div className="w-full h-2 bg-[#262626] rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-300`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
