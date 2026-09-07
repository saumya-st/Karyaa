"use client";

import {
  BarChart3,
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  FolderOpen,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

interface AnalyticsData {
  totalProjects: number;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  completionRate: number;
  priorityDistribution: { low: number; medium: number; high: number; urgent: number };
  tasksByDay: Record<string, number>;
  projectStats: Array<{
    id: string;
    name: string;
    color: string;
    totalTasks: number;
    completedTasks: number;
    completionRate: number;
  }>;
  memberWorkload: Record<string, number>;
}

export function AnalyticsDashboard({ data }: { data: AnalyticsData }) {
  const dayLabels = Object.keys(data.tasksByDay).map((d) => {
    const date = new Date(d + "T00:00:00");
    return date.toLocaleDateString("en-US", { weekday: "short" });
  });
  const dayValues = Object.values(data.tasksByDay);
  const maxDayValue = Math.max(...dayValues, 1);

  const totalPriority =
    data.priorityDistribution.low +
    data.priorityDistribution.medium +
    data.priorityDistribution.high +
    data.priorityDistribution.urgent;

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={FolderOpen}
          iconColor="text-blue-400"
          iconBg="bg-blue-900/40"
          label="Total Projects"
          value={data.totalProjects}
        />
        <StatCard
          icon={CheckCircle2}
          iconColor="text-green-400"
          iconBg="bg-green-900/40"
          label="Tasks Completed"
          value={data.completedTasks}
          subtitle={`of ${data.totalTasks} total`}
        />
        <StatCard
          icon={TrendingUp}
          iconColor="text-[#8a9a5b]"
          iconBg="bg-[#1f2414]"
          label="Completion Rate"
          value={`${data.completionRate}%`}
          trend={data.completionRate >= 50 ? "up" : "down"}
        />
        <StatCard
          icon={AlertTriangle}
          iconColor="text-red-400"
          iconBg="bg-red-900/40"
          label="Overdue Tasks"
          value={data.overdueTasks}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tasks Created (Last 7 Days) */}
        <div className="bg-[#212121] rounded-xl border border-[#2e2e2e] p-5">
          <h3 className="text-sm font-semibold text-[#d4d4d4] mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Tasks Created (Last 7 Days)
          </h3>
          <div className="flex items-end gap-2 h-40">
            {dayValues.map((value, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs text-[#a3a3a3] font-medium">{value}</span>
                <div className="w-full bg-[#2a2a2a] rounded-t-md relative" style={{ height: "120px" }}>
                  <div
                    className="absolute bottom-0 w-full bg-[#6B7A45] rounded-t-md transition-all"
                    style={{ height: `${(value / maxDayValue) * 100}%`, minHeight: value > 0 ? "4px" : "0" }}
                  />
                </div>
                <span className="text-[10px] text-[#737373]">{dayLabels[i]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Priority Distribution */}
        <div className="bg-[#212121] rounded-xl border border-[#2e2e2e] p-5">
          <h3 className="text-sm font-semibold text-[#d4d4d4] mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Priority Distribution
          </h3>
          <div className="space-y-3">
            <PriorityBar label="Urgent" count={data.priorityDistribution.urgent} total={totalPriority} color="bg-red-500" />
            <PriorityBar label="High" count={data.priorityDistribution.high} total={totalPriority} color="bg-orange-500" />
            <PriorityBar label="Medium" count={data.priorityDistribution.medium} total={totalPriority} color="bg-yellow-500" />
            <PriorityBar label="Low" count={data.priorityDistribution.low} total={totalPriority} color="bg-blue-400" />
          </div>
        </div>
      </div>

      {/* Project Completion Rates */}
      <div className="bg-[#212121] rounded-xl border border-[#2e2e2e] p-5">
        <h3 className="text-sm font-semibold text-[#d4d4d4] mb-4">Project Completion Rates</h3>
        {data.projectStats.length === 0 ? (
          <p className="text-sm text-[#737373] text-center py-8">No projects yet</p>
        ) : (
          <div className="space-y-4">
            {data.projectStats.map((project) => (
              <div key={project.id} className="flex items-center gap-4">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold shrink-0"
                  style={{ backgroundColor: project.color }}
                >
                  {project.name[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-[#d4d4d4] truncate">{project.name}</span>
                    <span className="text-sm font-medium text-[#a3a3a3]">
                      {project.completedTasks}/{project.totalTasks} ({project.completionRate}%)
                    </span>
                  </div>
                  <div className="w-full bg-[#2a2a2a] rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{
                        width: `${project.completionRate}%`,
                        backgroundColor: project.color,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  iconColor,
  iconBg,
  label,
  value,
  subtitle,
  trend,
}: {
  icon: typeof BarChart3;
  iconColor: string;
  iconBg: string;
  label: string;
  value: number | string;
  subtitle?: string;
  trend?: "up" | "down";
}) {
  return (
    <div className="bg-[#212121] rounded-xl border border-[#2e2e2e] p-5">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconBg}`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <p className="text-2xl font-bold text-[#f5f5f5]">{value}</p>
            {trend && (
              trend === "up" ? (
                <ArrowUp className="w-4 h-4 text-green-500" />
              ) : (
                <ArrowDown className="w-4 h-4 text-red-500" />
              )
            )}
          </div>
          <p className="text-sm text-[#a3a3a3]">{label}</p>
          {subtitle && <p className="text-xs text-[#737373]">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}

function PriorityBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="text-[#a3a3a3]">{label}</span>
        <span className="text-[#737373]">{count} ({pct}%)</span>
      </div>
      <div className="w-full bg-[#2a2a2a] rounded-full h-2">
        <div className={`h-2 rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
