"use client";

import { format, isPast, isToday } from "date-fns";
import {
  CheckCircle2,
  Circle,
  Calendar,
  AlertCircle,
  Clock,
  ChevronDown,
  ChevronRight,
  MessageSquare,
  Paperclip,
  FolderOpen,
} from "lucide-react";
import { useState } from "react";
import { updateTask } from "@/lib/actions/tasks";

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

interface Section {
  id: string;
  name: string;
  order: number;
  tasks: Task[];
}

interface Props {
  sections: Section[];
  projectId: string;
  teamMembers: Array<{ id: string; name: string; email: string; avatar: string | null }>;
  onTaskClick: (taskId: string) => void;
}

const PRIORITY_COLORS: Record<string, string> = {
  urgent: "text-red-400 bg-red-950/40",
  high: "text-orange-400 bg-orange-950/40",
  medium: "text-yellow-400 bg-yellow-950/40",
  low: "text-blue-400 bg-blue-950/40",
};

const SECTION_COLORS: Record<string, string> = {
  "To Do": "border-l-gray-400",
  "In Progress": "border-l-blue-500",
  "Done": "border-l-green-500",
};

const TRACKING_STATUS_STYLES: Record<string, { label: string; bg: string; text: string }> = {
  on_track: { label: "On Track", bg: "bg-green-950/40", text: "text-green-400" },
  at_risk: { label: "At Risk", bg: "bg-yellow-950/40", text: "text-yellow-400" },
  off_track: { label: "Off Track", bg: "bg-red-950/40", text: "text-red-400" },
};

export function ListView({ sections, projectId, teamMembers, onTaskClick }: Props) {
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

  function toggleSection(sectionId: string) {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  }

  async function toggleComplete(taskId: string, completed: boolean) {
    await updateTask(taskId, { completed: !completed });
  }

  return (
    <div className="p-3 md:p-6 max-w-5xl">
      {sections.map((section) => {
        const isCollapsed = collapsedSections.has(section.id);
        return (
          <div key={section.id} className="mb-6">
            {/* Section header */}
            <button
              onClick={() => toggleSection(section.id)}
              className="flex items-center gap-2 mb-2 group"
            >
              {isCollapsed ? (
                <ChevronRight className="w-4 h-4 text-[#525252]" />
              ) : (
                <ChevronDown className="w-4 h-4 text-[#525252]" />
              )}
              <h3 className="text-sm font-semibold text-[#d4d4d4]">{section.name}</h3>
              <span className="text-xs text-[#525252] bg-[#2a2a2a] px-1.5 py-0.5 rounded-full">
                {section.tasks.length}
              </span>
            </button>

            {/* Tasks table */}
            {!isCollapsed && (
              <div className="overflow-x-auto -mx-0">
              <div className="bg-[#212121] rounded-xl border border-[#2e2e2e] overflow-hidden min-w-[560px]">
                {/* Header */}
                <div className="grid grid-cols-12 gap-4 px-4 py-2 bg-[#1a1a1a] border-b border-[#262626] text-xs font-medium text-[#737373] uppercase tracking-wider">
                  <div className="col-span-4">Task</div>
                  <div className="col-span-2">Assignee</div>
                  <div className="col-span-2">Dates</div>
                  <div className="col-span-1">Priority</div>
                  <div className="col-span-1">Status</div>
                  <div className="col-span-2 text-right">Activity</div>
                </div>

                {/* Rows */}
                {section.tasks.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-[#525252]">
                    No tasks in this section
                  </div>
                ) : (
                  section.tasks.map((task) => {
                    const hasDueDate = task.dueDate;
                    const isOverdue = hasDueDate && isPast(new Date(task.dueDate!)) && !isToday(new Date(task.dueDate!));
                    const isDueToday = hasDueDate && isToday(new Date(task.dueDate!));

                    return (
                      <div
                        key={task.id}
                        onClick={() => onTaskClick(task.id)}
                        className={`grid grid-cols-12 gap-4 px-4 py-3 border-b border-[#262626] last:border-0 hover:bg-[#1f1f1f] cursor-pointer transition border-l-2 ${
                          SECTION_COLORS[section.name] || "border-l-[#6B7C42]"
                        }`}
                      >
                        {/* Task name */}
                        <div className="col-span-4 flex items-center gap-2 min-w-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleComplete(task.id, task.completed);
                            }}
                            className={`shrink-0 ${
                              task.completed ? "text-green-500" : "text-[#444444] hover:text-[#737373]"
                            }`}
                          >
                            {task.completed ? (
                              <CheckCircle2 className="w-4 h-4" />
                            ) : (
                              <Circle className="w-4 h-4" />
                            )}
                          </button>
                          <span
                            className={`text-sm truncate ${
                              task.completed ? "line-through text-[#525252]" : "text-[#f5f5f5]"
                            }`}
                          >
                            {task.title}
                          </span>
                        </div>

                        {/* Assignee */}
                        <div className="col-span-2 flex items-center">
                          {(() => {
                            const assigneeList = task.assignees && task.assignees.length > 0
                              ? task.assignees.map((a) => a.user)
                              : task.assignee
                              ? [task.assignee]
                              : [];
                            if (assigneeList.length === 0) return <span className="text-sm text-[#444444]">Unassigned</span>;
                            return (
                              <div className="flex items-center gap-1.5">
                                <div className="flex -space-x-1.5">
                                  {assigneeList.slice(0, 2).map((a) => (
                                    <div
                                      key={a.id}
                                      className="w-6 h-6 rounded-full bg-[#6B7C42] flex items-center justify-center text-white text-[10px] font-medium ring-2 ring-[#212121]"
                                      title={a.name}
                                    >
                                      {a.name[0].toUpperCase()}
                                    </div>
                                  ))}
                                  {assigneeList.length > 2 && (
                                    <div className="w-6 h-6 rounded-full bg-[#2a2a2a] flex items-center justify-center text-[10px] font-medium text-[#737373] ring-2 ring-[#212121]">
                                      +{assigneeList.length - 2}
                                    </div>
                                  )}
                                </div>
                                {assigneeList.length === 1 && (
                                  <span className="text-sm text-[#a3a3a3] truncate">
                                    {assigneeList[0].name.split(" ")[0]}
                                  </span>
                                )}
                              </div>
                            );
                          })()}
                        </div>

                        {/* Date range */}
                        <div className="col-span-2 flex items-center">
                          {(task.startDate || hasDueDate) ? (
                            <span
                              className={`flex items-center gap-1 text-sm ${
                                isOverdue
                                  ? "text-red-500"
                                  : isDueToday
                                  ? "text-orange-500"
                                  : "text-[#737373]"
                              }`}
                            >
                              <Calendar className="w-3.5 h-3.5" />
                              {task.startDate && !hasDueDate && format(new Date(task.startDate), "MMM d")}
                              {task.startDate && hasDueDate && `${format(new Date(task.startDate), "MMM d")} – `}
                              {hasDueDate && (
                                isOverdue
                                  ? "Overdue"
                                  : isDueToday
                                  ? "Today"
                                  : format(new Date(task.dueDate!), "MMM d")
                              )}
                            </span>
                          ) : (
                            <span className="text-sm text-[#444444]">No date</span>
                          )}
                        </div>

                        {/* Priority */}
                        <div className="col-span-1 flex items-center">
                          <span
                            className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${
                              PRIORITY_COLORS[task.priority] || "text-[#737373] bg-[#2a2a2a]"
                            }`}
                          >
                            {task.priority}
                          </span>
                        </div>

                        {/* Tracking Status */}
                        <div className="col-span-1 flex items-center">
                          {task.trackingStatus && TRACKING_STATUS_STYLES[task.trackingStatus] ? (
                            <span
                              className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                TRACKING_STATUS_STYLES[task.trackingStatus].bg
                              } ${
                                TRACKING_STATUS_STYLES[task.trackingStatus].text
                              }`}
                            >
                              {TRACKING_STATUS_STYLES[task.trackingStatus].label}
                            </span>
                          ) : (
                            <span className="text-xs text-[#444444]">—</span>
                          )}
                        </div>

                        {/* Activity */}
                        <div className="col-span-2 flex items-center justify-end gap-3">
                          {task._count.comments > 0 && (
                            <span className="flex items-center gap-1 text-xs text-[#525252]">
                              <MessageSquare className="w-3 h-3" />
                              {task._count.comments}
                            </span>
                          )}
                          {task._count.attachments > 0 && (
                            <span className="flex items-center gap-1 text-xs text-[#525252]">
                              <Paperclip className="w-3 h-3" />
                              {task._count.attachments}
                            </span>
                          )}
                          {(task._count.taskProjects ?? 0) > 0 && (
                            <span className="flex items-center gap-1 text-xs text-[#9aad6f]" title={`In ${(task._count.taskProjects ?? 0) + 1} projects`}>
                              <FolderOpen className="w-3 h-3" />
                              {(task._count.taskProjects ?? 0) + 1}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
