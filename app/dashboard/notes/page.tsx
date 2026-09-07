import { getSession } from "@/lib/auth";
import { getNotes } from "@/lib/actions/notes";
import { PersonalNotes } from "@/components/personal-notes";
import { redirect } from "next/navigation";

export default async function NotesPage() {
  const session = await getSession();
  if (!session?.user?.id) redirect("/login");

  const notes = await getNotes();

  return (
    <div className="p-4 sm:p-8 max-w-5xl w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#f5f5f5]">My Notes</h1>
        <p className="text-[#a3a3a3] mt-1">
          Personal notes &mdash; only visible to you
        </p>
      </div>
      <PersonalNotes notes={JSON.parse(JSON.stringify(notes))} />
    </div>
  );
}
