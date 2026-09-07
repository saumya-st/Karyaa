import { getAnalytics } from "@/lib/actions/analytics";
import { AnalyticsDashboard } from "@/components/analytics-dashboard";

export default async function ReportingPage() {
  const analytics = await getAnalytics();

  return (
    <div className="p-4 sm:p-8 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#f5f5f5]">Reporting</h1>
        <p className="text-[#a3a3a3] mt-1">Analytics and insights across your projects</p>
      </div>
      <AnalyticsDashboard data={analytics} />
    </div>
  );
}
