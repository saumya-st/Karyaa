import { getProject } from "@/lib/actions/projects";
import { notFound } from "next/navigation";
import { ProjectView } from "@/components/project-view";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface Props {
  params: Promise<{ projectId: string }>;
}

export default async function ProjectPage({ params }: Props) {
  const { projectId } = await params;
  const [project, session] = await Promise.all([
    getProject(projectId),
    getSession(),
  ]);

  if (!project || !session?.user?.id) notFound();

  const teamMembers = project.team.members.map((m: { user: { id: string; name: string; email: string; avatar: string | null } }) => m.user);

  // Fetch other projects in the same team for multi-project task feature
  const otherProjects = await prisma.project.findMany({
    where: { teamId: (project as { team: { id: string } }).team.id, id: { not: projectId } },
    select: {
      id: true,
      name: true,
      color: true,
      sections: { select: { id: true, name: true }, orderBy: { order: "asc" } },
    },
    orderBy: { name: "asc" },
  });

  // JSON round-trip to serialize Dates to strings for client components
  const serializedProject = JSON.parse(JSON.stringify(project));

  return (
    <ProjectView
      project={serializedProject}
      teamMembers={teamMembers}
      currentUserId={session.user.id}
      otherProjects={otherProjects}
    />
  );
}
