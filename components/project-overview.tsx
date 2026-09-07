"use client";

import { useEffect, useState, useTransition, useRef } from "react";
import { getProjectOverview } from "@/lib/actions/projects";
import { updateProject } from "@/lib/actions/projects";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  ListTodo,
  Pencil,
  Calendar,
  User as UserIcon,
  Palette,
  Activity,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

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
  description: string | null;
  color: string;
  creatorId: string;
  createdAt: string;
  creator?: { id: string; name: string; avatar: string | null };
  sections: Section[];
  team: {
    id: string;
    name: string;
    members: Array<{ id: string; role: string; user: TeamMember }>;
  };
}

interface ActivityItem {
  id: string;
  action: string;
  details: string | null;
  createdAt: string;
  user: { id: string; name: string; avatar: string | null };
  task: { id: string; title: string };
}

interface Props {
  project: Project;
  currentUserId: string;
}

export function ProjectOverview({ project, currentUserId }: Props) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingDescription, setEditingDescription] = useState(false);
  const [description, setDescription] = useState(project.description || "");
  const [isPending, startTransition] = useTransition();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Fetch overview data on mount
  useEffect(() => {
    getProjectOverview(project.id).then((data) => {
      setActivities(data.activities);
      setLoading(false);
    });
  }, [project.id]);

  // Focus textarea when editing
  useEffect(() => {
    if (editingDescription && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.selectionStart = textareaRef.current.value.length;
    }
  }, [editingDescription]);

  // Compute stats from sections
  const allTasks = project.sections.flatMap((s) => s.tasks);
  const totalTasks = allTasks.length;
  const completedTasks = allTasks.filter((t) => t.completed).length;
  const inProgressTasks = allTasks.filter(
    (t) => !t.completed && (t.status === "in_progress" || t.status === "In Progress")
  ).length;
  const overdueTasks = allTasks.filter(
    (t) => !t.completed && t.dueDate && new Date(t.dueDate) < new Date()
  ).length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const isCreator = project.creatorId === currentUserId;

  function handleSaveDescription() {
    setEditingDescription(false);
    if (description === (project.description || "")) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.set("name", project.name);
      fd.set("description", description);
      fd.set("color", project.color);
      await updateProject(project.id, fd);
    });
  }

  const roleColors: Record<string, string> = {
    owner: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    admin: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    member: "bg-[#2a3018] text-[#9aad6f] border-[#6B7A45]/30",
    guest: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
  };

  const actionLabels: Record<string, string> = {
    created: "created",
    updated: "updated",
    completed: "completed",
    commented: "commented on",
    assigned: "was assigned to",
    moved: "moved",
  };

  return (
    <div className="p-4 md:p-6 space-y-6 overflow-auto max-w-6xl mx-auto">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          label="Total Tasks"
          value={totalTasks}
          icon={<ListTodo className="w-5 h-5" />}
          color="text-[#d4d4d4]"
          bg="bg-[#1a1a1a]"
        />
        <StatCard
          label="Completed"
          value={completedTasks}
          icon={<CheckCircle2 className="w-5 h-5" />}
          color="text-emerald-400"
          bg="bg-emerald-500/5"
          sub={`${completionRate}%`}
        />
        <StatCard
          label="In Progress"
          value={inProgressTasks}
          icon={<Clock className="w-5 h-5" />}
          color="text-blue-400"
          bg="bg-blue-500/5"
        />
        <StatCard
          label="Overdue"
          value={overdueTasks}
          icon={<AlertTriangle className="w-5 h-5" />}
          color="text-red-400"
          bg="bg-red-500/5"
        />
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left column — 3/5 */}
        <div className="lg:col-span-3 space-y-6">
          {/* About / Description */}
          <div className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-[#f5f5f5] uppercase tracking-wider">About</h2>
              {isCreator && !editingDescription && (
                <button
                  onClick={() => setEditingDescription(true)}
                  className="text-[#737373] hover:text-[#d4d4d4] transition"
                  title="Edit description"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            {editingDescription ? (
              <div>
                <textarea
                  ref={textareaRef}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSaveDescription();
                    }
                    if (e.key === "Escape") {
                      setDescription(project.description || "");
                      setEditingDescription(false);
                    }
                  }}
                  rows={3}
                  className="w-full bg-[#141414] border border-[#3a3a3a] rounded-lg px-3 py-2 text-sm text-[#f5f5f5] placeholder:text-[#525252] resize-none focus:ring-1 focus:ring-[#6B7A45] outline-none"
                  placeholder="Add a project description..."
                />
                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={handleSaveDescription}
                    disabled={isPending}
                    className="px-3 py-1 text-xs font-medium text-white bg-[#6B7A45] rounded-lg hover:bg-[#5a6838] transition disabled:opacity-50"
                  >
                    {isPending ? "Saving..." : "Save"}
                  </button>
                  <button
                    onClick={() => {
                      setDescription(project.description || "");
                      setEditingDescription(false);
                    }}
                    className="px-3 py-1 text-xs font-medium text-[#a3a3a3] bg-[#2a2a2a] rounded-lg hover:bg-[#3a3a3a] transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-[#a3a3a3] leading-relaxed">
                {project.description || (
                  <span className="text-[#525252] italic">
                    {isCreator ? "Click the pencil to add a description" : "No description yet"}
                  </span>
                )}
              </p>
            )}
          </div>

          {/* Key Details */}
          <div className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-5">
            <h2 className="text-sm font-semibold text-[#f5f5f5] uppercase tracking-wider mb-4">Key Details</h2>
            <div className="space-y-3">
              <DetailRow
                icon={<Calendar className="w-4 h-4 text-[#737373]" />}
                label="Created"
                value={format(new Date(project.createdAt), "MMM d, yyyy")}
              />
              <DetailRow
                icon={<UserIcon className="w-4 h-4 text-[#737373]" />}
                label="Creator"
                value={
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-[#6B7C42] flex items-center justify-center text-white text-[10px] font-medium">
                      {project.creator?.name?.[0]?.toUpperCase() || "?"}
                    </div>
                    <span>{project.creator?.name || "Unknown"}</span>
                  </div>
                }
              />
              <DetailRow
                icon={<Palette className="w-4 h-4 text-[#737373]" />}
                label="Color"
                value={
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: project.color }} />
                    <span className="font-mono text-xs">{project.color}</span>
                  </div>
                }
              />
              <DetailRow
                icon={<ListTodo className="w-4 h-4 text-[#737373]" />}
                label="Sections"
                value={`${project.sections.length} sections`}
              />
            </div>
          </div>

        </div>

        {/* Right column — 2/5 */}
        <div className="lg:col-span-2 space-y-6">
          {/* Project Roles */}
          <div className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-5">
            <h2 className="text-sm font-semibold text-[#f5f5f5] uppercase tracking-wider mb-4">
              Project Roles
            </h2>
            <div className="space-y-2.5">
              {project.team.members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between px-3 py-2 bg-[#141414] rounded-lg border border-[#262626]"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-[#6B7C42] flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                      {member.user.name[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-[#f5f5f5] truncate">{member.user.name}</p>
                      <p className="text-[10px] text-[#737373] truncate">{member.user.email}</p>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                      roleColors[member.role] || roleColors.member
                    }`}
                  >
                    {member.role}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-[#1a1a1a] border border-[#262626] rounded-xl p-5">
            <h2 className="text-sm font-semibold text-[#f5f5f5] uppercase tracking-wider mb-4">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#737373]" />
                Recent Activity
              </div>
            </h2>
            {loading ? (
              <p className="text-xs text-[#525252]">Loading...</p>
            ) : activities.length === 0 ? (
              <p className="text-xs text-[#525252] italic">No activity yet</p>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {activities.map((a) => (
                  <div key={a.id} className="flex items-start gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-[#6B7C42] flex items-center justify-center text-white text-[10px] font-medium flex-shrink-0 mt-0.5">
                      {a.user.name[0].toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-[#d4d4d4] leading-relaxed">
                        <span className="font-medium text-[#f5f5f5]">{a.user.name}</span>{" "}
                        {actionLabels[a.action] || a.action}{" "}
                        <span className="font-medium text-[#B8C87A]">{a.task.title}</span>
                      </p>
                      <p className="text-[10px] text-[#525252] mt-0.5">
                        {formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Sub-components ---

function StatCard({
  label,
  value,
  icon,
  color,
  bg,
  sub,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  bg: string;
  sub?: string;
}) {
  return (
    <div className={`${bg} border border-[#262626] rounded-xl p-4`}>
      <div className={`flex items-center gap-2 mb-2 ${color}`}>
        {icon}
        <span className="text-xs font-medium uppercase tracking-wider text-[#737373]">
          {label}
        </span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className={`text-2xl font-bold ${color}`}>{value}</span>
        {sub && <span className="text-xs text-[#737373]">{sub}</span>}
      </div>
    </div>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2.5 text-[#737373]">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      <div className="text-sm text-[#d4d4d4]">{value}</div>
    </div>
  );
}
