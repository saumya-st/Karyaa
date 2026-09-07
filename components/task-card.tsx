"use client";

import { useState, useTransition } from "react";
import { format, isPast, isToday } from "date-fns";
import { updateTask } from "@/lib/actions/tasks";
import {
  MessageSquare,
  Paperclip,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Circle,
  Clock,
  FolderOpen,
} from "lucide-react";

interface Task {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  trackingStatus?: string;
  startDate?: string | null;
  dueDate: string | null;
  completed: boolean;
  assignee: { id: string; name: string; avatar: string | null; email: string } | null;
  assignees?: Array<{ user: { id: string; name: string; avatar: string | null; email: string } }>;
  _count: { comments: number; attachments: number; taskProjects?: number };
}

interface Props {
  task: Task;
  onClick: () => void;
}

const PRIORITY_STYLES: Record<string, { color: string; icon: typeof AlertCircle }> = {
  urgent: { color: "text-red-500", icon: AlertCircle },
  high: { color: "text-orange-500", icon: AlertCircle },
  medium: { color: "text-yellow-500", icon: Clock },
  low: { color: "text-blue-400", icon: Circle },
};

const TRACKING_STATUS_STYLES: Record<string, { label: string; bg: string; text: string }> = {
  on_track: { label: "On Track", bg: "bg-green-950/40", text: "text-green-400" },
  at_risk: { label: "At Risk", bg: "bg-yellow-950/40", text: "text-yellow-400" },
  off_track: { label: "Off Track", bg: "bg-red-950/40", text: "text-red-400" },
};

export function TaskCard({ task, onClick }: Props) {
  const [isPending, startTransition] = useTransition();
  const [optimisticCompleted, setOptimisticCompleted] = useState(task.completed);
  const priority = PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.medium;
  const PriorityIcon = priority.icon;
  const hasDueDate = task.dueDate;
  const isOverdue = hasDueDate && isPast(new Date(task.dueDate!)) && !isToday(new Date(task.dueDate!));
  const isDueToday = hasDueDate && isToday(new Date(task.dueDate!));

  function handleToggleComplete(e: React.MouseEvent) {
    e.stopPropagation();
    const newVal = !optimisticCompleted;
    setOptimisticCompleted(newVal);
    startTransition(async () => {
      await updateTask(task.id, { completed: newVal });
    });
  }

  return (
    <div
      onClick={onClick}
      className="bg-[#212121] rounded-lg border border-[#2e2e2e] p-3 cursor-pointer hover:shadow-xl hover:border-[#3a3a3a] transition group"
    >
      {/* Title */}
      <div className="flex items-start gap-2">
        <button
          onClick={handleToggleComplete}
          className={`mt-0.5 shrink-0 ${optimisticCompleted ? "text-green-500" : "text-[#444444] hover:text-[#737373]"}`}
        >
          {optimisticCompleted ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <Circle className="w-4 h-4" />
          )}
        </button>
        <span
          className={`text-sm font-medium ${
            optimisticCompleted ? "line-through text-[#525252]" : "text-[#f5f5f5]"
          }`}
        >
          {task.title}
        </span>
      </div>

      {/* Description preview */}
      {task.description && (
        <p className="text-xs text-[#525252] mt-1.5 ml-6 line-clamp-2">
          {task.description}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center gap-2 mt-3 ml-6 flex-wrap">
        {/* Tracking status badge */}
        {task.trackingStatus && TRACKING_STATUS_STYLES[task.trackingStatus] && (
          <span
            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${TRACKING_STATUS_STYLES[task.trackingStatus].bg} ${TRACKING_STATUS_STYLES[task.trackingStatus].text}`}
          >
            {TRACKING_STATUS_STYLES[task.trackingStatus].label}
          </span>
        )}

        {/* Priority */}
        <div className={`flex items-center gap-1 ${priority.color}`}>
          <PriorityIcon className="w-3 h-3" />
          <span className="text-xs capitalize">{task.priority}</span>
        </div>

        {/* Date range */}
        {(task.startDate || hasDueDate) && (
          <div
            className={`flex items-center gap-1 text-xs ${
              isOverdue
                ? "text-red-500"
                : isDueToday
                ? "text-orange-500"
                : "text-[#525252]"
            }`}
          >
            <Calendar className="w-3 h-3" />
            {task.startDate && !hasDueDate && format(new Date(task.startDate), "MMM d")}
            {task.startDate && hasDueDate && `${format(new Date(task.startDate), "MMM d")} – `}
            {hasDueDate && (
              isOverdue
                ? "Overdue"
                : isDueToday
                ? "Today"
                : format(new Date(task.dueDate!), "MMM d")
            )}
          </div>
        )}

        {/* Comment count */}
        {task._count.comments > 0 && (
          <div className="flex items-center gap-1 text-xs text-[#525252]">
            <MessageSquare className="w-3 h-3" />
            {task._count.comments}
          </div>
        )}

        {/* Attachment count */}
        {task._count.attachments > 0 && (
          <div className="flex items-center gap-1 text-xs text-[#525252]">
            <Paperclip className="w-3 h-3" />
            {task._count.attachments}
          </div>
        )}

        {/* Multi-project badge */}
        {(task._count.taskProjects ?? 0) > 0 && (
          <div className="flex items-center gap-1 text-xs text-[#9aad6f]" title={`In ${(task._count.taskProjects ?? 0) + 1} projects`}>
            <FolderOpen className="w-3 h-3" />
            {(task._count.taskProjects ?? 0) + 1}
          </div>
        )}

        {/* Spacer + Assignees */}
        <div className="flex-1" />
        {(() => {
          const assigneeList = task.assignees && task.assignees.length > 0
            ? task.assignees.map((a) => a.user)
            : task.assignee
            ? [task.assignee]
            : [];
          if (assigneeList.length === 0) return null;
          return (
            <div className="flex -space-x-1.5">
              {assigneeList.slice(0, 3).map((a) => (
                <div
                  key={a.id}
                  className="w-6 h-6 rounded-full bg-[#6B7C42] flex items-center justify-center text-white text-[10px] font-medium ring-2 ring-[#212121]"
                  title={a.name}
                >
                  {a.name[0].toUpperCase()}
                </div>
              ))}
              {assigneeList.length > 3 && (
                <div
                  className="w-6 h-6 rounded-full bg-[#2a2a2a] flex items-center justify-center text-[10px] font-medium text-[#737373] ring-2 ring-[#212121]"
                >
                  +{assigneeList.length - 3}
                </div>
              )}
            </div>
          );
        })()}
      </div>
    </div>
  );
}
