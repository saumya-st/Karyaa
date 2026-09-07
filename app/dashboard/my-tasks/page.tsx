import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MyTasksList } from "@/components/my-tasks-list";

export default async function MyTasksPage() {
  const session = await getSession();
  const userId = session!.user!.id!;

  const tasks = await prisma.task.findMany({
    where: {
      OR: [
        { assigneeId: userId },
        { assignees: { some: { userId } } },
      ],
    },
    include: {
      project: { select: { id: true, name: true, color: true } },
      section: { select: { name: true } },
      assignees: {
        include: { user: { select: { id: true, name: true, avatar: true, email: true } } },
      },
      _count: { select: { comments: true, attachments: true } },
    },
    orderBy: [
      { completed: "asc" },
      { dueDate: "asc" },
      { createdAt: "desc" },
    ],
  });

  return (
    <div className="p-4 sm:p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#f5f5f5]">My Tasks</h1>
        <p className="text-[#a3a3a3] mt-1">
          Tasks assigned to you across all projects
        </p>
      </div>

      <MyTasksList tasks={tasks} />
    </div>
  );
}
