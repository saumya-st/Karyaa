"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Calendar, Clock, ChevronRight } from "lucide-react";
import type { MyTaskItem } from "@/lib/actions/tasks";

type Task = MyTaskItem;

interface Props {
  upcoming: Task[];
  overdue: Task[];
  completed: Task[];
  userName: string;
  userInitial: string;
}

const TABS = ["Upcoming", "Overdue", "Completed"] as const;
type Tab = (typeof TABS)[number];

const priorityColors: Record<string, string> = {
  urgent: "bg-red-500",
  high: "bg-orange-400",
  medium: "bg-yellow-400",
  low: "bg-[#6B7A45]",
};

function formatDate(date: Date | null) {
  if (!date) return null;
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function TaskRow({ task }: { task: Task }) {
  return (
    <Link
      href={`/dashboard/projects/${task.project.id}`}
      className="flex items-center gap-3 px-4 py-3 hover:bg-[#1f1f1f] transition group rounded-lg"
    >
      {/* Priority dot */}
      <div className={`w-2 h-2 rounded-full shrink-0 ${priorityColors[task.priority] ?? "bg-[#525252]"}`} />

      {/* Title */}
      <span className="flex-1 text-sm text-[#d4d4d4] truncate group-hover:text-[#f5f5f5] transition">
        {task.title}
      </span>

      {/* Project pill */}
      <span
        className="hidden sm:flex items-center gap-1.5 text-[11px] text-[#737373] bg-[#1a1a1a] border border-[#262626] px-2 py-0.5 rounded-full shrink-0"
      >
        <span
          className="w-2 h-2 rounded-sm shrink-0"
          style={{ backgroundColor: task.project.color }}
        />
        <span className="max-w-[80px] truncate">{task.project.name}</span>
      </span>

      {/* Due date */}
      {task.dueDate && (
        <span className="hidden md:flex items-center gap-1 text-[11px] text-[#737373] shrink-0">
          <Calendar className="w-3 h-3" />
          {formatDate(task.dueDate)}
        </span>
      )}

      <ChevronRight className="w-4 h-4 text-[#333] group-hover:text-[#737373] transition shrink-0" />
    </Link>
  );
}

export function MyTasksCard({ upcoming, overdue, completed, userName, userInitial }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("Upcoming");

  const tabData: Record<Tab, Task[]> = { Upcoming: upcoming, Overdue: overdue, Completed: completed };
  const tasks = tabData[activeTab];

  return (
    <div className="bg-[#212121] border border-[#2e2e2e] rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-[#2e2e2e]">
        <div className="w-9 h-9 rounded-full bg-[#6B7A45]/20 border border-[#6B7A45]/40 flex items-center justify-center text-[#8a9a5b] font-semibold text-sm shrink-0">
          {userInitial}
        </div>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <h2 className="text-base font-semibold text-[#f5f5f5]">My tasks</h2>
          <Clock className="w-3.5 h-3.5 text-[#525252]" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 px-5 pt-3 border-b border-[#2e2e2e]">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`relative px-3 py-2 text-sm font-medium transition pb-3 ${
              activeTab === tab
                ? "text-[#f5f5f5]"
                : "text-[#737373] hover:text-[#a3a3a3]"
            }`}
          >
            {tab}
            {tab === "Overdue" && overdue.length > 0 && (
              <span className="ml-1.5 text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded-full">
                {overdue.length}
              </span>
            )}
            {activeTab === tab && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#6B7A45] rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Task list */}
      <div className="min-h-[140px] max-h-72 overflow-y-auto">
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center px-6">
            <p className="text-sm text-[#525252]">
              {activeTab === "Upcoming" && "No upcoming tasks. You're all caught up!"}
              {activeTab === "Overdue" && "No overdue tasks. Great work!"}
              {activeTab === "Completed" && "No completed tasks yet."}
            </p>
          </div>
        ) : (
          <div className="p-2">
            {tasks.map((task) => (
              <TaskRow key={task.id} task={task} />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-[#2e2e2e] px-5 py-3">
        <Link
          href="/dashboard/my-tasks"
          className="text-sm text-[#6B7A45] hover:text-[#8a9a5b] font-medium transition-colors flex items-center gap-1"
        >
          View all tasks
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
