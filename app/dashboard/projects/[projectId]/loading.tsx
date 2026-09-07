// Shown while a project page is loading (heavy query)
export default function ProjectLoading() {
  return (
    <div className="h-full flex flex-col">
      {/* Header skeleton */}
      <div className="bg-[#1a1a1a] border-b border-[#262626] px-4 py-3 md:px-6 md:py-4 animate-pulse">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#2e2e2e] shrink-0" />
            <div className="space-y-1.5">
              <div className="h-4 w-40 bg-[#2e2e2e] rounded-lg" />
              <div className="h-3 w-24 bg-[#262626] rounded hidden sm:block" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-24 h-8 bg-[#2e2e2e] rounded-lg" />
            <div className="w-16 h-8 bg-[#2a2a2a] rounded-lg" />
            <div className="w-20 h-8 bg-[#2e2e2e] rounded-lg" />
          </div>
        </div>
        <div className="flex items-center gap-2 mt-2.5">
          <div className="w-16 h-7 bg-[#2a2a2a] rounded-lg" />
          <div className="w-16 h-7 bg-[#2a2a2a] rounded-lg" />
        </div>
      </div>

      {/* Kanban columns skeleton */}
      <div className="flex gap-3 md:gap-4 p-3 md:p-6 overflow-hidden animate-pulse">
        {Array.from({ length: 3 }).map((_, col) => (
          <div
            key={col}
            className="flex flex-col bg-[#212121] border border-[#2e2e2e] rounded-xl w-[82vw] sm:w-80 shrink-0"
          >
            {/* Column header */}
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-[#3a3a3a]" />
                <div className="h-3.5 w-20 bg-[#2e2e2e] rounded" />
                <div className="w-5 h-5 rounded-full bg-[#2a2a2a]" />
              </div>
              <div className="w-5 h-5 rounded bg-[#2a2a2a]" />
            </div>

            {/* Task cards */}
            <div className="px-3 pb-3 space-y-2">
              {Array.from({ length: col === 0 ? 3 : col === 1 ? 2 : 1 }).map((_, i) => (
                <div key={i} className="bg-[#1a1a1a] border border-[#2e2e2e] rounded-xl p-3 space-y-2.5">
                  <div className="flex items-start gap-2">
                    <div className="w-4 h-4 rounded-full bg-[#2e2e2e] shrink-0 mt-0.5" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3.5 bg-[#2e2e2e] rounded w-full" />
                      <div className="h-3 bg-[#262626] rounded w-2/3" />
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 pt-1">
                    <div className="h-5 w-16 bg-[#2a2a2a] rounded-full" />
                    <div className="h-5 w-12 bg-[#2a2a2a] rounded-full" />
                    <div className="ml-auto w-6 h-6 rounded-full bg-[#2e2e2e]" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
