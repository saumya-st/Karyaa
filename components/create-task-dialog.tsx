"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { createTask } from "@/lib/actions/tasks";
import { addTaskToProject } from "@/lib/actions/projects";
import { X, ChevronDown, Check, Users, FolderOpen } from "lucide-react";
import { useRouter } from "next/navigation";
import { LoaderOverlay } from "@/components/ui/loader";

interface OtherProject {
  id: string;
  name: string;
  color: string;
  sections: Array<{ id: string; name: string }>;
}

interface Props {
  projectId: string;
  sectionId: string;
  sections: Array<{ id: string; name: string }>;
  teamMembers: Array<{ id: string; name: string; email: string }>;
  otherProjects?: OtherProject[];
  onClose: () => void;
}

export function CreateTaskDialog({
  projectId,
  sectionId,
  sections,
  teamMembers,
  otherProjects,
  onClose,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [readyToClose, setReadyToClose] = useState(false);

  // Close dialog only after the router.refresh() transition has fully painted
  useEffect(() => {
    if (readyToClose && !isPending) {
      setLoading(false);
      onClose();
    }
  }, [readyToClose, isPending, onClose]);
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [showAssigneeDropdown, setShowAssigneeDropdown] = useState(false);
  const [assigneeSearch, setAssigneeSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  // Multi-project: list of { projectId, sectionId } to also add the task to
  const [additionalProjects, setAdditionalProjects] = useState<Array<{ projectId: string; sectionId: string }>>([]);
  const [showProjectPicker, setShowProjectPicker] = useState(false);
  const [pickProjectId, setPickProjectId] = useState("");
  const [pickSectionId, setPickSectionId] = useState("");

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowAssigneeDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function toggleAssignee(id: string) {
    setSelectedAssignees((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  }

  const filteredMembers = teamMembers.filter(
    (m) =>
      m.name.toLowerCase().includes(assigneeSearch.toLowerCase()) ||
      m.email.toLowerCase().includes(assigneeSearch.toLowerCase())
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const formData = new FormData(e.currentTarget);
    formData.set("projectId", projectId);
    // Remove default assigneeId and add all selected
    formData.delete("assigneeId");
    for (const id of selectedAssignees) {
      formData.append("assigneeId", id);
    }
    const result = await createTask(formData);
    if (result?.error) {
      setLoading(false);
      setError(result.error);
      return;
    }
    // Add to additional projects
    if (result?.taskId && additionalProjects.length > 0) {
      await Promise.all(
        additionalProjects.map((ap) =>
          addTaskToProject(result.taskId!, ap.projectId, ap.sectionId)
        )
      );
    }
    // Trigger a refresh transition; useEffect above will close the dialog
    // once the new task is actually painted on screen.
    setReadyToClose(true);
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <>
    {loading && <LoaderOverlay message="Creating task…" />}
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-[#1e1e1e] border border-[#2e2e2e] rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-[#f5f5f5]">Create Task</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-[#2a2a2a] text-[#525252]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="bg-red-950/40 text-red-400 text-sm rounded-lg p-3 mb-4 border border-red-900/40">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#a3a3a3] mb-1">
              Title *
            </label>
            <input
              name="title"
              required
              className="w-full px-3 py-2 bg-[#2a2a2a] border border-[#3a3a3a] text-[#f5f5f5] rounded-xl focus:ring-2 focus:ring-[#6B7A45] focus:border-transparent outline-none text-sm"
              placeholder="Task title"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#a3a3a3] mb-1">
              Description
            </label>
            <textarea
              name="description"
              rows={3}
              className="w-full px-3 py-2 bg-[#2a2a2a] border border-[#3a3a3a] text-[#f5f5f5] rounded-xl focus:ring-2 focus:ring-[#6B7A45] focus:border-transparent outline-none text-sm resize-none"
              placeholder="Add details..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#a3a3a3] mb-1">
                Section
              </label>
              <select
                name="sectionId"
                defaultValue={sectionId}
                className="w-full px-3 py-2 bg-[#2a2a2a] border border-[#3a3a3a] text-[#f5f5f5] rounded-xl focus:ring-2 focus:ring-[#6B7A45] focus:border-transparent outline-none text-sm"
              >
                {sections.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="relative" ref={dropdownRef}>
              <label className="block text-sm font-medium text-[#a3a3a3] mb-1">
                Assignees
              </label>
              <button
                type="button"
                onClick={() => setShowAssigneeDropdown(!showAssigneeDropdown)}
                className="w-full px-3 py-2 bg-[#2a2a2a] border border-[#3a3a3a] text-[#f5f5f5] rounded-xl focus:ring-2 focus:ring-[#6B7A45] focus:border-transparent outline-none text-sm text-left flex items-center justify-between"
              >
                <span className={selectedAssignees.length === 0 ? "text-[#525252]" : "text-[#f5f5f5]"}>
                  {selectedAssignees.length === 0
                    ? "Unassigned"
                    : selectedAssignees.length === 1
                    ? teamMembers.find((m) => m.id === selectedAssignees[0])?.name
                    : `${selectedAssignees.length} people`}
                </span>
                <ChevronDown className="w-4 h-4 text-[#525252]" />
              </button>

              {showAssigneeDropdown && (
                <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-[#1e1e1e] border border-[#2e2e2e] rounded-xl shadow-xl max-h-60 overflow-hidden">
                  <div className="p-2 border-b border-[#262626]">
                    <input
                      type="text"
                      value={assigneeSearch}
                      onChange={(e) => setAssigneeSearch(e.target.value)}
                      placeholder="Name or email"
                      className="w-full px-2.5 py-1.5 text-sm bg-[#2a2a2a] border border-[#3a3a3a] text-[#f5f5f5] rounded-lg focus:ring-1 focus:ring-[#6B7A45] outline-none"
                      autoFocus
                    />
                  </div>
                  <div className="overflow-y-auto max-h-44">
                    {filteredMembers.map((m) => {
                      const isSelected = selectedAssignees.includes(m.id);
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => toggleAssignee(m.id)}
                          className="flex items-center gap-3 w-full px-3 py-2 hover:bg-[#1f1f1f] transition"
                        >
                          <div className="w-7 h-7 rounded-full bg-[#6B7C42] flex items-center justify-center text-white text-[10px] font-medium shrink-0">
                            {m.name[0].toUpperCase()}
                          </div>
                          <div className="flex-1 text-left min-w-0">
                            <p className="text-sm font-medium text-[#f5f5f5] truncate">{m.name}</p>
                            <p className="text-xs text-[#525252] truncate">{m.email}</p>
                          </div>
                          {isSelected && (
                            <Check className="w-4 h-4 text-[#6B7C42] shrink-0" />
                          )}
                        </button>
                      );
                    })}
                    {filteredMembers.length === 0 && (
                      <p className="text-sm text-[#525252] text-center py-3">No matches</p>
                    )}
                  </div>
                  {selectedAssignees.length > 0 && (
                    <div className="border-t border-[#262626] px-3 py-2">
                      <div className="flex items-center gap-1 flex-wrap">
                        <Users className="w-3.5 h-3.5 text-[#525252] mr-1" />
                        {selectedAssignees.map((id) => {
                          const member = teamMembers.find((m) => m.id === id);
                          return member ? (
                            <span
                              key={id}
                              className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-[#1f2414] text-[#9aad6f] rounded-full"
                            >
                              {member.name.split(" ")[0]}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleAssignee(id);
                                }}
                                className="hover:text-[#f5f5f5]"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#a3a3a3] mb-1">
                Priority
              </label>
              <select
                name="priority"
                defaultValue="medium"
                className="w-full px-3 py-2 bg-[#2a2a2a] border border-[#3a3a3a] text-[#f5f5f5] rounded-xl focus:ring-2 focus:ring-[#6B7A45] focus:border-transparent outline-none text-sm"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#a3a3a3] mb-1">
                Tracking Status
              </label>
              <select
                name="trackingStatus"
                defaultValue="on_track"
                className="w-full px-3 py-2 bg-[#2a2a2a] border border-[#3a3a3a] text-[#f5f5f5] rounded-xl focus:ring-2 focus:ring-[#6B7A45] focus:border-transparent outline-none text-sm"
              >
                <option value="on_track">On Track</option>
                <option value="at_risk">At Risk</option>
                <option value="off_track">Off Track</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#a3a3a3] mb-1">
                Start Date
              </label>
              <input
                name="startDate"
                type="date"
                className="w-full px-3 py-2 bg-[#2a2a2a] border border-[#3a3a3a] text-[#f5f5f5] rounded-xl focus:ring-2 focus:ring-[#6B7A45] focus:border-transparent outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#a3a3a3] mb-1">
                Due Date
              </label>
              <input
                name="dueDate"
                type="date"
                className="w-full px-3 py-2 bg-[#2a2a2a] border border-[#3a3a3a] text-[#f5f5f5] rounded-xl focus:ring-2 focus:ring-[#6B7A45] focus:border-transparent outline-none text-sm"
              />
            </div>
          </div>

          {/* Also add to other projects */}
          {otherProjects && otherProjects.length > 0 && (
            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-[#a3a3a3] mb-2">
                <FolderOpen className="w-4 h-4" />
                Also add to projects
              </label>

              {/* Selected additional projects */}
              {additionalProjects.length > 0 && (
                <div className="space-y-1.5 mb-2">
                  {additionalProjects.map((ap) => {
                    const proj = otherProjects.find((p) => p.id === ap.projectId);
                    const sec = proj?.sections.find((s) => s.id === ap.sectionId);
                    return (
                      <div key={ap.projectId} className="flex items-center justify-between px-2.5 py-1.5 bg-[#141414] rounded-lg border border-[#262626]">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: proj?.color || "#6366f1" }} />
                          <span className="text-sm text-[#d4d4d4] truncate">{proj?.name}</span>
                          <span className="text-[10px] text-[#525252] bg-[#2a2a2a] px-1.5 py-0.5 rounded">{sec?.name}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setAdditionalProjects((prev) => prev.filter((p) => p.projectId !== ap.projectId))}
                          className="p-0.5 text-[#525252] hover:text-red-500"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Add project picker */}
              {showProjectPicker ? (
                <div className="p-3 bg-[#141414] border border-[#262626] rounded-lg space-y-2">
                  <select
                    value={pickProjectId}
                    onChange={(e) => { setPickProjectId(e.target.value); setPickSectionId(""); }}
                    className="w-full px-2.5 py-1.5 text-sm bg-[#2a2a2a] border border-[#3a3a3a] text-[#f5f5f5] rounded-lg focus:ring-1 focus:ring-[#6B7A45] outline-none"
                  >
                    <option value="">Select project...</option>
                    {otherProjects
                      .filter((p) => !additionalProjects.some((ap) => ap.projectId === p.id))
                      .map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                  </select>
                  {pickProjectId && (() => {
                    const proj = otherProjects.find((p) => p.id === pickProjectId);
                    if (!proj || proj.sections.length === 0) return null;
                    return (
                      <select
                        value={pickSectionId}
                        onChange={(e) => setPickSectionId(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-sm bg-[#2a2a2a] border border-[#3a3a3a] text-[#f5f5f5] rounded-lg focus:ring-1 focus:ring-[#6B7A45] outline-none"
                      >
                        <option value="">Select section...</option>
                        {proj.sections.map((s) => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    );
                  })()}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (pickProjectId && pickSectionId) {
                          setAdditionalProjects((prev) => [...prev, { projectId: pickProjectId, sectionId: pickSectionId }]);
                          setPickProjectId("");
                          setPickSectionId("");
                          setShowProjectPicker(false);
                        }
                      }}
                      disabled={!pickProjectId || !pickSectionId}
                      className="px-3 py-1 text-xs font-medium text-white bg-[#6B7A45] rounded-lg hover:bg-[#5a6838] disabled:opacity-50"
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowProjectPicker(false); setPickProjectId(""); setPickSectionId(""); }}
                      className="px-3 py-1 text-xs font-medium text-[#a3a3a3] bg-[#2a2a2a] rounded-lg hover:bg-[#3a3a3a]"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowProjectPicker(true)}
                  className="flex items-center gap-1.5 text-xs text-[#6B7C42] hover:text-[#4A5628] font-medium"
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                  Add to another project
                </button>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 text-sm font-medium text-[#a3a3a3] bg-[#2a2a2a] rounded-xl hover:bg-[#363636] transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 text-sm font-medium text-white bg-[#6B7A45] rounded-xl hover:bg-[#5a6838] transition disabled:opacity-50"
            >
              Create Task
            </button>
          </div>
        </form>
      </div>
    </div>
    </>
  );
}
