export default function InboxLoading() {
  return (
    <div className="p-4 md:p-6 animate-pulse">
      <div className="h-6 w-16 bg-[#2a2a2a] rounded-lg mb-6" />
      <div className="bg-[#212121] border border-[#2e2e2e] rounded-xl overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3 p-4 border-b border-[#262626] last:border-0">
            <div className="w-8 h-8 rounded-full bg-[#2e2e2e] shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3.5 w-48 bg-[#2e2e2e] rounded" />
              <div className="h-3 w-32 bg-[#262626] rounded" />
            </div>
            <div className="w-16 h-3 bg-[#262626] rounded shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
