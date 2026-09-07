import { getSession } from "@/lib/auth";
import { getTeams } from "@/lib/actions/teams";
import { TeamManagement } from "@/components/team-management";

export default async function TeamPage() {
  const session = await getSession();
  const teams = await getTeams();

  return (
    <div className="p-4 sm:p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#f5f5f5]">Team</h1>
        <p className="text-[#a3a3a3] mt-1">Manage your team members and invitations</p>
      </div>

      <TeamManagement teams={teams} currentUserId={session!.user!.id!} />
    </div>
  );
}
