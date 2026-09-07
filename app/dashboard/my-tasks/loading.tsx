function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-[#262626] last:border-0">
      <div className="w-4 h-4 rounded-full bg-[#2e2e2e] shrink-0" />
      <div className="flex-1 h-3.5 bg-[#2e2e2e] rounded" />
      <div className="w-16 h-3 bg-[#262626] rounded shrink-0" />
      <div className="w-12 h-3 bg-[#262626] rounded shrink-0" />
    </div>
  );
}

export default function MyTasksLoading() {
  return (
    <div className="p-4 md:p-6 animate-pulse">
      <div className="h-6 w-28 bg-[#2a2a2a] rounded-lg mb-6" />
      <div className="bg-[#212121] border border-[#2e2e2e] rounded-xl p-4 space-y-1">
        {Array.from({ length: 7 }).map((_, i) => <SkeletonRow key={i} />)}
      </div>
    </div>
  );
}
