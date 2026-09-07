"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { KanbanBoard } from "./kanban-board";
import { ListView } from "./list-view";
import { TaskDetailModal } from "./task-detail-modal";
import { CreateTaskDialog } from "./create-task-dialog";
import {
  LayoutGrid,
  List,
  Plus,
  Filter,
  X,
  Search,
  UserPlus,
  FileText,
  BarChart3,
  Trash2,
  Loader2,
} from "lucide-react";
import { deleteProject } from "@/lib/actions/projects";
import { InviteDialog } from "./invite-dialog";
import { ProjectOverview } from "./project-overview";
import { ProjectProgress } from "./project-progress";

interface Section {
  id: string;
  name: string;
  order: number;
  tasks: Task[];
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  trackingStatus?: string;
  startDate?: string | null;
  dueDate: string | null;
  order: number;
  completed: boolean;
  sectionId: string;
  projectId: string;
  assignee: { id: string; name: string; avatar: string | null; email: string } | null;
  assignees?: Array<{ user: { id: string; name: string; avatar: string | null; email: string } }>;
  _count: { comments: number; attachments: number; taskProjects?: number };
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

interface OtherProject {
  id: string;
  name: string;
  color: string;
  sections: Array<{ id: string; name: string }>;
}

interface Props {
  project: Project;
  teamMembers: TeamMember[];
  currentUserId: string;
  otherProjects?: OtherProject[];
}

export function ProjectView({ project, teamMembers, currentUserId, otherProjects }: Props) {
  const router = useRouter();

  // Auto-refresh every 30 seconds so collaborators see live updates
  useEffect(() => {
    const id = setInterval(() => router.refresh(), 30_000);
    return () => clearInterval(id);
  }, [router]);

  const [view, setView] = useState<"overview" | "board" | "list" | "progress">("board");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [defaultSectionId, setDefaultSectionId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filterPriority, setFilterPriority] = useState<string>("");
  const [filterAssignee, setFilterAssignee] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterTrackingStatus, setFilterTrackingStatus] = useState<string>("");
  const [filterSearch, setFilterSearch] = useState("");
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isCreator = project.creatorId === currentUserId;

  async function handleDeleteProject() {
    setDeleting(true);
    await deleteProject(project.id);
    router.push("/dashboard");
  }

  const hasActiveFilters = filterPriority || filterAssignee || filterStatus || filterTrackingStatus || filterSearch;

  const filteredSections = useMemo(() => {
    if (!hasActiveFilters) return project.sections;
    return project.sections.map((section) => ({
      ...section,
      tasks: section.tasks.filter((task) => {
        if (filterPriority && task.priority !== filterPriority) return false;
        if (filterAssignee === "unassigned" && (task.assignees?.length || task.assignee)) return false;
        if (filterAssignee && filterAssignee !== "unassigned") {
          const hasAssignee = task.assignees?.some((a) => a.user.id === filterAssignee) || task.assignee?.id === filterAssignee;
          if (!hasAssignee) return false;
        }
        if (filterStatus === "completed" && !task.completed) return false;
        if (filterStatus === "incomplete" && task.completed) return false;
        if (filterTrackingStatus && task.trackingStatus !== filterTrackingStatus) return false;
        if (filterSearch && !task.title.toLowerCase().includes(filterSearch.toLowerCase())) return false;
        return true;
      }),
    }));
  }, [project.sections, filterPriority, filterAssignee, filterStatus, filterTrackingStatus, filterSearch, hasActiveFilters]);

  return (
    <div className="h-full flex flex-col">
      {/* Project Header */}
      <div className="bg-[#1a1a1a] border-b border-[#262626] px-4 py-3 md:px-6 md:py-4">
        {/* Row 1: project identity + add task */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-white font-bold text-sm"
              style={{ backgroundColor: project.color }}
            >
              {project.name[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <h1 className="text-base md:text-lg font-semibold text-[#f5f5f5] truncate leading-tight">
                {project.name}
              </h1>
              {project.description && (
                <p className="text-xs md:text-sm text-[#a3a3a3] truncate hidden sm:block">{project.description}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* Members indicator — hidden on very small screens */}
            <div className="hidden sm:flex -space-x-2">
              {teamMembers.slice(0, 3).map((m) => (
                <div
                  key={m.id}
                  className="w-7 h-7 rounded-full bg-[#6B7C42] flex items-center justify-center text-white text-xs font-medium ring-2 ring-[#1a1a1a]"
                  title={m.name}
                >
                  {m.name[0].toUpperCase()}
                </div>
              ))}
              {teamMembers.length > 3 && (
                <div className="w-7 h-7 rounded-full bg-[#2a2a2a] flex items-center justify-center text-xs font-medium text-[#737373] ring-2 ring-[#1a1a1a]">
                  +{teamMembers.length - 3}
                </div>
              )}
            </div>

            {/* Delete project — only for creator */}
            {isCreator && (
              confirmDelete ? (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleDeleteProject}
                    disabled={deleting}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                  >
                    {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete"}
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="inline-flex items-center px-2.5 py-1.5 text-sm font-medium text-[#a3a3a3] bg-[#2a2a2a] rounded-lg hover:bg-[#3a3a3a] transition"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-sm font-medium text-red-400 bg-red-500/10 rounded-lg hover:bg-red-500/20 transition"
                  title="Delete project"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )
            )}

            {/* Invite button — icon-only on mobile */}
            <button
              onClick={() => setShowInviteDialog(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-sm font-medium text-[#9aad6f] bg-[#1f2414] rounded-lg hover:bg-[#2a3018] transition"
              title="Invite people"
            >
              <UserPlus className="w-4 h-4" />
              <span className="hidden sm:inline">Invite</span>
            </button>

            {/* Add task */}
            <button
              onClick={() => {
                setDefaultSectionId(project.sections[0]?.id || null);
                setShowCreateTask(true);
              }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-sm font-medium text-white bg-[#6B7A45] rounded-lg hover:bg-[#5a6838] transition"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Task</span>
            </button>
          </div>
        </div>

        {/* Row 2: view toggle + filter */}
        <div className="flex items-center gap-2 mt-2.5">
          {/* View toggle */}
          <div className="flex items-center bg-[#2a2a2a] rounded-lg p-0.5 flex-shrink-0">
            <button
              onClick={() => setView("overview")}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm font-medium transition ${
                view === "overview"
                  ? "bg-[#3a3a3a] text-[#f5f5f5] shadow-sm"
                  : "text-[#737373] hover:text-[#d4d4d4]"
              }`}
            >
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Overview</span>
            </button>
            <button
              onClick={() => setView("board")}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm font-medium transition ${
                view === "board"
                  ? "bg-[#3a3a3a] text-[#f5f5f5] shadow-sm"
                  : "text-[#737373] hover:text-[#d4d4d4]"
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">Board</span>
            </button>
            <button
              onClick={() => setView("list")}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm font-medium transition ${
                view === "list"
                  ? "bg-[#3a3a3a] text-[#f5f5f5] shadow-sm"
                  : "text-[#737373] hover:text-[#d4d4d4]"
              }`}
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">List</span>
            </button>
            <button
              onClick={() => setView("progress")}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm font-medium transition ${
                view === "progress"
                  ? "bg-[#3a3a3a] text-[#f5f5f5] shadow-sm"
                  : "text-[#737373] hover:text-[#d4d4d4]"
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Progress</span>
            </button>
          </div>

          {/* Filter bar — scrolls horizontally on mobile */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none flex-1">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg border transition flex-shrink-0 ${
              hasActiveFilters
                ? "border-[#B8C87A] bg-[#EEF0E0] text-[#4A5628]"
                : "border-[#2e2e2e] text-[#737373] hover:text-[#d4d4d4] hover:bg-[#1f1f1f]"
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            Filter
            {hasActiveFilters && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setFilterPriority("");
                  setFilterAssignee("");
                  setFilterStatus("");
                  setFilterTrackingStatus("");
                  setFilterSearch("");
                }}
                className="ml-1 hover:text-[#f5f5f5]"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </button>

          {showFilters && (
            <>
              <div className="relative flex-shrink-0">
                <Search className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-[#525252]" />
                <input
                  value={filterSearch}
                  onChange={(e) => setFilterSearch(e.target.value)}
                  placeholder="Search tasks..."
                  className="pl-7 pr-2 py-1 text-xs bg-[#2a2a2a] border border-[#3a3a3a] text-[#f5f5f5] placeholder:text-[#525252] rounded-lg focus:ring-1 focus:ring-[#6B7A45] outline-none w-36"
                />
              </div>
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="px-2 py-1 text-xs bg-[#2a2a2a] border border-[#3a3a3a] text-[#d4d4d4] rounded-lg focus:ring-1 focus:ring-[#6B7A45] outline-none flex-shrink-0"
              >
                <option value="">All priorities</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <select
                value={filterAssignee}
                onChange={(e) => setFilterAssignee(e.target.value)}
                className="px-2 py-1 text-xs bg-[#2a2a2a] border border-[#3a3a3a] text-[#d4d4d4] rounded-lg focus:ring-1 focus:ring-[#6B7A45] outline-none flex-shrink-0"
              >
                <option value="">All assignees</option>
                <option value="unassigned">Unassigned</option>
                {teamMembers.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-2 py-1 text-xs bg-[#2a2a2a] border border-[#3a3a3a] text-[#d4d4d4] rounded-lg focus:ring-1 focus:ring-[#6B7A45] outline-none flex-shrink-0"
              >
                <option value="">All statuses</option>
                <option value="incomplete">Incomplete</option>
                <option value="completed">Completed</option>
              </select>
              <select
                value={filterTrackingStatus}
                onChange={(e) => setFilterTrackingStatus(e.target.value)}
                className="px-2 py-1 text-xs bg-[#2a2a2a] border border-[#3a3a3a] text-[#d4d4d4] rounded-lg focus:ring-1 focus:ring-[#6B7A45] outline-none flex-shrink-0"
              >
                <option value="">All tracking</option>
                <option value="on_track">On Track</option>
                <option value="at_risk">At Risk</option>
                <option value="off_track">Off Track</option>
              </select>
            </>
          )}
          </div>{/* end scrollable filter row */}
        </div>{/* end row 2 */}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {view === "overview" ? (
          <ProjectOverview project={project} currentUserId={currentUserId} />
        ) : view === "progress" ? (
          <ProjectProgress project={project} />
        ) : view === "board" ? (
          <KanbanBoard
            sections={filteredSections}
            projectId={project.id}
            teamMembers={teamMembers}
            onTaskClick={setSelectedTaskId}
            onAddTask={(sectionId: string) => {
              setDefaultSectionId(sectionId);
              setShowCreateTask(true);
            }}
          />
        ) : (
          <ListView
            sections={filteredSections}
            projectId={project.id}
            teamMembers={teamMembers}
            onTaskClick={setSelectedTaskId}
          />
        )}
      </div>

      {/* Task Detail Modal */}
      {selectedTaskId && (
        <TaskDetailModal
          taskId={selectedTaskId}
          teamMembers={teamMembers}
          currentUserId={currentUserId}
          onClose={() => setSelectedTaskId(null)}
        />
      )}

      {/* Create Task Dialog */}
      {showCreateTask && defaultSectionId && (
        <CreateTaskDialog
          projectId={project.id}
          sectionId={defaultSectionId}
          sections={project.sections}
          teamMembers={teamMembers}
          otherProjects={otherProjects}
          onClose={() => setShowCreateTask(false)}
        />
      )}

      {/* Invite Dialog */}
      {showInviteDialog && (
        <InviteDialog
          projectId={project.id}
          projectName={project.name}
          onClose={() => setShowInviteDialog(false)}
        />
      )}
    </div>
  );
}
