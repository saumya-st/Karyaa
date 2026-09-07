"use client";

import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { TaskCard } from "./task-card";
import { moveTask } from "@/lib/actions/tasks";
import { createSection } from "@/lib/actions/projects";
import { Plus } from "lucide-react";
import { useState, useEffect, useRef } from "react";

interface Task {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  trackingStatus?: string;
  startDate?: string | null;
  dueDate: string | null;
  order: number;
  completed: boolean;
  sectionId: string;
  projectId: string;
  assignee: { id: string; name: string; avatar: string | null; email: string } | null;
  assignees?: Array<{ user: { id: string; name: string; avatar: string | null; email: string } }>;
  _count: { comments: number; attachments: number };
}

interface Section {
  id: string;
  name: string;
  order: number;
  tasks: Task[];
}

interface Props {
  sections: Section[];
  projectId: string;
  teamMembers: Array<{ id: string; name: string; email: string; avatar: string | null }>;
  onTaskClick: (taskId: string) => void;
  onAddTask: (sectionId: string) => void;
}

const SECTION_COLORS: Record<string, string> = {
  "To Do": "bg-gray-400",
  "In Progress": "bg-blue-500",
  "Done": "bg-green-500",
};

export function KanbanBoard({ sections, projectId, teamMembers, onTaskClick, onAddTask }: Props) {
  const [localSections, setLocalSections] = useState(sections);
  const [addingSection, setAddingSection] = useState(false);
  const [newSectionName, setNewSectionName] = useState("");
  // Track in-flight drag mutations — while >0, ignore server prop updates so the
  // optimistic state isn't overwritten by stale RSC re-renders (Redis still warm).
  const mutatingRef = useRef(0);
  // Absorbs the one stale RSC re-render that arrives after moveTask completes
  // (Redis still has old positions because invalidation runs in after())
  const pendingRefreshRef = useRef(false);

  // Sync from server when RSC re-renders deliver fresh data (only when idle)
  useEffect(() => {
    if (mutatingRef.current > 0) return;
    if (pendingRefreshRef.current) {
      // skip this one stale update; the next poll will bring correct data
      pendingRefreshRef.current = false;
      return;
    }
    setLocalSections(sections);
  }, [sections]);

  async function handleDragEnd(result: DropResult) {
    if (!result.destination) return;

    const { draggableId: taskId, source, destination } = result;
    const newSectionId = destination.droppableId;
    const newOrder = destination.index;

    // Optimistic update: move the task in local state immediately
    setLocalSections(prev => {
      const next = prev.map(s => ({ ...s, tasks: [...s.tasks] }));
      const srcSection = next.find(s => s.id === source.droppableId);
      const dstSection = next.find(s => s.id === newSectionId);
      if (!srcSection || !dstSection) return prev;
      const [moved] = srcSection.tasks.splice(source.index, 1);
      dstSection.tasks.splice(newOrder, 0, moved);
      return next;
    });

    mutatingRef.current++;
    try {
      await moveTask(taskId, newSectionId, newOrder);
      // Flag to skip the imminent stale RSC re-render (Redis not yet invalidated)
      pendingRefreshRef.current = true;
      // Safety reset: if RSC re-render somehow never comes, unblock after 5s
      setTimeout(() => { pendingRefreshRef.current = false; }, 5000);
    } finally {
      mutatingRef.current--;
    }
  }

  async function handleAddSection() {
    if (!newSectionName.trim()) return;
    await createSection(projectId, newSectionName.trim());
    setNewSectionName("");
    setAddingSection(false);
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-3 md:gap-4 p-3 md:p-6 h-full overflow-x-auto">
        {localSections.map((section) => (
          <div
            key={section.id}
            className="flex flex-col bg-[#212121] border border-[#2e2e2e] rounded-xl w-[82vw] sm:w-80 shrink-0"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2">
                <div
                  className={`w-2.5 h-2.5 rounded-full ${
                    SECTION_COLORS[section.name] || "bg-[#EEF0E0]0"
                  }`}
                />
                <h3 className="text-sm font-semibold text-[#d4d4d4]">
                  {section.name}
                </h3>
                <span className="text-xs text-[#525252] bg-[#2a2a2a] px-1.5 py-0.5 rounded-full">
                  {section.tasks.length}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onAddTask(section.id)}
                  className="p-1 rounded hover:bg-[#2a2a2a] text-[#525252] hover:text-[#d4d4d4] transition"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Tasks list */}
            <Droppable droppableId={section.id}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`flex-1 px-3 pb-3 space-y-2 overflow-y-auto min-h-[100px] transition ${
                    snapshot.isDraggingOver ? "bg-[#1f2414]/50 rounded-lg" : ""
                  }`}
                >
                  {section.tasks.map((task, index) => (
                    <Draggable key={task.id} draggableId={task.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`${snapshot.isDragging ? "rotate-2 shadow-lg" : ""}`}
                        >
                          <TaskCard
                            task={task}
                            onClick={() => onTaskClick(task.id)}
                          />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>

            {/* Add task button at bottom */}
            <button
              onClick={() => onAddTask(section.id)}
              className="flex items-center gap-2 px-4 py-2.5 text-sm text-[#525252] hover:text-[#d4d4d4] hover:bg-[#1a1a1a] transition rounded-b-xl"
            >
              <Plus className="w-4 h-4" />
              Add task
            </button>
          </div>
        ))}

        {/* Add section */}
        <div className="shrink-0 w-80">
          {addingSection ? (
            <div className="bg-[#212121] border border-[#2e2e2e] rounded-xl p-3">
              <input
                type="text"
                value={newSectionName}
                onChange={(e) => setNewSectionName(e.target.value)}
                placeholder="Section name"
                className="w-full px-3 py-2 text-sm bg-[#2a2a2a] border border-[#3a3a3a] text-[#f5f5f5] rounded-lg focus:ring-2 focus:ring-[#6B7A45] focus:border-transparent outline-none"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddSection();
                  if (e.key === "Escape") setAddingSection(false);
                }}
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={handleAddSection}
                  className="px-3 py-1.5 text-sm font-medium text-white bg-[#6B7A45] rounded-lg hover:bg-[#5a6838]"
                >
                  Add
                </button>
                <button
                  onClick={() => setAddingSection(false)}
                  className="px-3 py-1.5 text-sm font-medium text-[#737373] hover:text-[#d4d4d4]"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setAddingSection(true)}
              className="flex items-center gap-2 w-full px-4 py-3 text-sm text-[#525252] hover:text-[#d4d4d4] bg-[#1a1a1a] hover:bg-[#1f1f1f] rounded-xl transition"
            >
              <Plus className="w-4 h-4" />
              Add section
            </button>
          )}
        </div>
      </div>
    </DragDropContext>
  );
}
