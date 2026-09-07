// Shown during client-side navigation to /dashboard and initial hard-load
export default function DashboardLoading() {
  return (
    <div className="min-h-full bg-[#1a1a1a] p-6 animate-pulse">
      {/* Top bar skeleton */}
      <div className="flex items-center justify-between mb-8">
        <div className="space-y-2">
          <div className="h-7 w-48 bg-[#2a2a2a] rounded-lg" />
          <div className="h-4 w-32 bg-[#232323] rounded-lg" />
        </div>
        <div className="h-9 w-32 bg-[#2a2a2a] rounded-xl" />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-[#212121] border border-[#2e2e2e] rounded-xl p-4 space-y-2">
            <div className="h-3 w-20 bg-[#2a2a2a] rounded" />
            <div className="h-7 w-12 bg-[#2e2e2e] rounded-lg" />
          </div>
        ))}
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Projects */}
        <div className="bg-[#212121] border border-[#2e2e2e] rounded-xl p-4 space-y-3">
          <div className="h-4 w-24 bg-[#2a2a2a] rounded" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 py-2">
              <div className="w-8 h-8 rounded-lg bg-[#2e2e2e] shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 w-32 bg-[#2e2e2e] rounded" />
                <div className="h-2.5 w-20 bg-[#262626] rounded" />
              </div>
            </div>
          ))}
        </div>

        {/* Tasks */}
        <div className="bg-[#212121] border border-[#2e2e2e] rounded-xl p-4 space-y-3">
          <div className="h-4 w-20 bg-[#2a2a2a] rounded" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 py-2 border-b border-[#262626] last:border-0">
              <div className="w-4 h-4 rounded-full bg-[#2e2e2e] shrink-0" />
              <div className="flex-1 h-3.5 bg-[#2e2e2e] rounded" />
              <div className="w-12 h-3 bg-[#262626] rounded shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
