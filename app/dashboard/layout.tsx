import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getProjects } from "@/lib/actions/projects";
import { getTeams } from "@/lib/actions/teams";
import { getUnreadCount } from "@/lib/actions/notifications";
import { DashboardShell } from "@/components/dashboard-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const [projects, teams, unreadCount] = await Promise.all([
    getProjects(),
    getTeams(),
    getUnreadCount(),
  ]);

  return (
    <DashboardShell
      user={session.user!}
      projects={projects}
      teams={teams}
      unreadCount={unreadCount}
    >
      {children}
    </DashboardShell>
  );
}
