"use client";

import React, { useState, useEffect, useTransition } from "react";
import { createPortal } from "react-dom";
import { createProject } from "@/lib/actions/projects";
import { Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { LoaderOverlay } from "@/components/ui/loader";

const COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e",
  "#f97316", "#eab308", "#22c55e", "#14b8a6",
  "#0ea5e9", "#6b7280",
];

interface Props {
  teams: Array<{ id: string; name: string }>;
  trigger?: React.ReactNode;
}

export function CreateProjectDialog({ teams, trigger }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const [, startTransition] = useTransition();

  useEffect(() => { setMounted(true); }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.set("color", selectedColor);
    const result = await createProject(formData);
    if (!result?.projectId) {
      // Error — hide loader and stay on form
      setLoading(false);
      return;
    }
    // Keep overlay visible while Next.js navigates to the new project page.
    // The component (and overlay) unmount once the new page renders.
    setOpen(false);
    startTransition(() => {
      router.push(`/dashboard/projects/${result.projectId}`);
    });
  }

  const modal = open && mounted ? createPortal(
    <>
    {loading && <LoaderOverlay message="Creating project…" />}
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#141414] border border-[#262626] rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-[#f5f5f5]">New Project</h2>
          <button
            onClick={() => setOpen(false)}
            className="p-1 rounded-lg hover:bg-[#262626] text-[#737373] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#a3a3a3] mb-1">
              Project name
            </label>
            <input
              name="name"
              required
              className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#262626] rounded-xl focus:ring-2 focus:ring-[#6B7A45] focus:border-transparent outline-none text-sm text-[#f5f5f5] placeholder-[#525252]"
              placeholder="e.g., Website Redesign"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#a3a3a3] mb-1">
              Description
            </label>
            <textarea
              name="description"
              rows={2}
              className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#262626] rounded-xl focus:ring-2 focus:ring-[#6B7A45] focus:border-transparent outline-none text-sm text-[#f5f5f5] placeholder-[#525252] resize-none"
              placeholder="What's this project about?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#a3a3a3] mb-1">
              Team
            </label>
            <select
              name="teamId"
              required
              className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#262626] rounded-xl focus:ring-2 focus:ring-[#6B7A45] focus:border-transparent outline-none text-sm text-[#f5f5f5]"
            >
              {teams.map((team) => (
                <option key={team.id} value={team.id} className="bg-[#1a1a1a]">
                  {team.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#a3a3a3] mb-2">
              Color
            </label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={`w-8 h-8 rounded-lg transition ring-2 ring-offset-2 ring-offset-[#141414] ${
                    selectedColor === color ? "ring-[#6B7A45]" : "ring-transparent"
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex-1 py-2 text-sm font-medium text-[#a3a3a3] bg-[#1a1a1a] border border-[#262626] rounded-xl hover:bg-[#222] transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 text-sm font-medium text-white bg-[#6B7A45] rounded-xl hover:bg-[#4e5a31] transition disabled:opacity-50"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
    </>,
    document.body
  ) : null;

  if (trigger) {
    return (
      <>
        <div onClick={() => setOpen(true)}>{trigger}</div>
        {modal}
      </>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[#6B7A45] bg-[#1f2414] border border-[#6B7A45]/30 rounded-lg hover:bg-[#2a3019] transition"
      >
        <Plus className="w-4 h-4" />
        New Project
      </button>
      {modal}
    </>
  );
}
