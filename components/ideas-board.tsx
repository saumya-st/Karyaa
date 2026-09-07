"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { format } from "date-fns";
import {
  createIdea,
  updateIdea,
  deleteIdea,
  toggleIdeaVote,
  addIdeaComment,
  deleteIdeaComment,
} from "@/lib/actions/ideas";
import {
  Lightbulb,
  Plus,
  X,
  ChevronUp,
  MessageSquare,
  Send,
  Pencil,
  Trash2,
  Loader2,
  Tag,
  Check,
} from "lucide-react";

interface IdeaComment {
  id: string;
  content: string;
  createdAt: string;
  author: { id: string; name: string; email: string; avatar: string | null };
}

interface Idea {
  id: string;
  title: string;
  description: string | null;
  category: string;
  status: string;
  upvotes: number;
  createdAt: string;
  updatedAt: string;
  creator: { id: string; name: string; email: string; avatar: string | null };
  team: { id: string; name: string };
  comments?: IdeaComment[];
  _count: { comments: number; voters: number };
  voters: Array<{ id: string }>;
}

interface Team {
  id: string;
  name: string;
}

interface Props {
  ideas: Idea[];
  teams: Team[];
  currentUserId: string;
}

const CATEGORIES: Record<string, { label: string; color: string; bg: string }> = {
  general: { label: "General", color: "text-[#a3a3a3]", bg: "bg-[#2a2a2a]" },
  feature: { label: "Feature", color: "text-blue-400", bg: "bg-blue-900/40" },
  improvement: { label: "Improvement", color: "text-green-400", bg: "bg-green-900/40" },
  bug: { label: "Bug Fix", color: "text-red-400", bg: "bg-red-900/40" },
  other: { label: "Other", color: "text-[#8a9a5b]", bg: "bg-[#1f2414]" },
};

const STATUSES: Record<string, { label: string; color: string; bg: string }> = {
  new: { label: "New", color: "text-blue-400", bg: "bg-blue-900/40" },
  under_review: { label: "Under Review", color: "text-amber-400", bg: "bg-amber-900/40" },
  approved: { label: "Approved", color: "text-green-400", bg: "bg-green-900/40" },
  in_progress: { label: "In Progress", color: "text-[#8a9a5b]", bg: "bg-[#1f2414]" },
  done: { label: "Done", color: "text-emerald-400", bg: "bg-emerald-900/40" },
  archived: { label: "Archived", color: "text-[#737373]", bg: "bg-[#2a2a2a]" },
};

export function IdeasBoard({ ideas, teams, currentUserId }: Props) {
  const [showCreate, setShowCreate] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "most_voted">("newest");

  const filtered = ideas
    .filter((i) => (!filterCategory || i.category === filterCategory))
    .filter((i) => (!filterStatus || i.status === filterStatus))
    .sort((a, b) => {
      if (sortBy === "most_voted") return b.upvotes - a.upvotes;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  return (
    <div className="space-y-6">
      {/* Header actions */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-medium text-sm hover:from-amber-600 hover:to-orange-600 transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          New Idea
        </button>

        <div className="flex items-center gap-2 ml-auto">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="text-sm bg-[#2a2a2a] border border-[#3a3a3a] text-[#d4d4d4] rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="">All Categories</option>
            {Object.entries(CATEGORIES).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-sm bg-[#2a2a2a] border border-[#3a3a3a] text-[#d4d4d4] rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="">All Statuses</option>
            {Object.entries(STATUSES).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "newest" | "most_voted")}
            className="text-sm bg-[#2a2a2a] border border-[#3a3a3a] text-[#d4d4d4] rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="newest">Newest First</option>
            <option value="most_voted">Most Voted</option>
          </select>
        </div>
      </div>

      {/* Ideas list */}
      {filtered.length === 0 ? (
        <div className="bg-[#212121] rounded-xl border border-[#2e2e2e] p-12 text-center">
          <Lightbulb className="w-10 h-10 text-amber-400 mx-auto mb-3" />
          <p className="text-[#a3a3a3]">
            {ideas.length === 0
              ? "No ideas yet. Be the first to share one!"
              : "No ideas match your filters."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((idea) => (
            <IdeaCard
              key={idea.id}
              idea={idea}
              currentUserId={currentUserId}
              isExpanded={expandedId === idea.id}
              isEditing={editingId === idea.id}
              onToggleExpand={() => setExpandedId(expandedId === idea.id ? null : idea.id)}
              onStartEdit={() => setEditingId(idea.id)}
              onStopEdit={() => setEditingId(null)}
            />
          ))}
        </div>
      )}

      {/* Create dialog */}
      {showCreate && (
        <CreateIdeaDialog teams={teams} onClose={() => setShowCreate(false)} />
      )}
    </div>
  );
}

// --- Idea Card ---
function IdeaCard({
  idea,
  currentUserId,
  isExpanded,
  isEditing,
  onToggleExpand,
  onStartEdit,
  onStopEdit,
}: {
  idea: Idea;
  currentUserId: string;
  isExpanded: boolean;
  isEditing: boolean;
  onToggleExpand: () => void;
  onStartEdit: () => void;
  onStopEdit: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [comment, setComment] = useState("");
  const [isCommenting, startCommentTransition] = useTransition();
  const [editTitle, setEditTitle] = useState(idea.title);
  const [editDesc, setEditDesc] = useState(idea.description || "");
  const [editCategory, setEditCategory] = useState(idea.category);
  const [editStatus, setEditStatus] = useState(idea.status);
  const isCreator = idea.creator.id === currentUserId;
  const hasVoted = idea.voters.length > 0;
  const cat = CATEGORIES[idea.category] || CATEGORIES.general;
  const status = STATUSES[idea.status] || STATUSES.new;

  function handleVote() {
    startTransition(async () => {
      await toggleIdeaVote(idea.id);
    });
  }

  function handleDelete() {
    if (!confirm("Delete this idea?")) return;
    startTransition(async () => {
      await deleteIdea(idea.id);
    });
  }

  function handleSaveEdit() {
    startTransition(async () => {
      await updateIdea(idea.id, {
        title: editTitle,
        description: editDesc,
        category: editCategory,
        status: editStatus,
      });
      onStopEdit();
    });
  }

  function handleAddComment() {
    if (!comment.trim()) return;
    startCommentTransition(async () => {
      await addIdeaComment(idea.id, comment);
      setComment("");
    });
  }

  return (
    <div className="bg-[#212121] rounded-xl border border-[#2e2e2e] overflow-hidden hover:border-[#3a3a3a] transition">
      <div className="flex items-start gap-3 p-4">
        {/* Upvote button */}
        <button
          onClick={handleVote}
          disabled={isPending}
          className={`flex flex-col items-center min-w-[48px] py-2 px-1 rounded-lg border transition text-xs font-semibold ${
            hasVoted
              ? "bg-amber-900/40 border-amber-700/40 text-amber-400"
              : "bg-[#2a2a2a] border-[#3a3a3a] text-[#737373] hover:border-amber-600/50 hover:text-amber-400"
          }`}
        >
          <ChevronUp className="w-4 h-4" />
          {idea.upvotes}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="space-y-3">
              <input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full px-3 py-2 bg-[#2a2a2a] border border-[#3a3a3a] text-[#f5f5f5] rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <textarea
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 bg-[#2a2a2a] border border-[#3a3a3a] text-[#f5f5f5] placeholder-[#525252] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                placeholder="Describe your idea..."
              />
              <div className="flex items-center gap-2">
                <select value={editCategory} onChange={(e) => setEditCategory(e.target.value)} className="text-xs bg-[#2a2a2a] border border-[#3a3a3a] text-[#d4d4d4] rounded-lg px-2 py-1.5">
                  {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
                <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)} className="text-xs bg-[#2a2a2a] border border-[#3a3a3a] text-[#d4d4d4] rounded-lg px-2 py-1.5">
                  {Object.entries(STATUSES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
                <div className="flex gap-1.5 ml-auto">
                  <button onClick={onStopEdit} className="px-3 py-1.5 text-xs text-[#a3a3a3] border border-[#3a3a3a] rounded-lg hover:bg-[#2a2a2a]">Cancel</button>
                  <button onClick={handleSaveEdit} disabled={isPending} className="px-3 py-1.5 text-xs text-white bg-amber-500 rounded-lg hover:bg-amber-600 disabled:opacity-50 flex items-center gap-1">
                    {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />} Save
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between gap-2">
                <button onClick={onToggleExpand} className="text-left flex-1 min-w-0">
                  <h3 className="font-semibold text-[#f5f5f5] text-sm leading-snug">{idea.title}</h3>
                  {idea.description && (
                    <p className="text-xs text-[#a3a3a3] mt-1 line-clamp-2">{idea.description}</p>
                  )}
                </button>
                {isCreator && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={onStartEdit} className="p-1.5 text-[#737373] hover:text-amber-400 hover:bg-amber-900/30 rounded-lg transition">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={handleDelete} disabled={isPending} className="p-1.5 text-[#737373] hover:text-red-400 hover:bg-red-950/40 rounded-lg transition">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Meta row */}
              <div className="flex flex-wrap items-center gap-2 mt-2.5">
                <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${cat.bg} ${cat.color}`}>
                  <Tag className="w-3 h-3" /> {cat.label}
                </span>
                <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${status.bg} ${status.color}`}>
                  {status.label}
                </span>
                <span className="text-[11px] text-[#525252]">·</span>
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full bg-[#6B7A45] flex items-center justify-center text-white text-[10px] font-medium">
                    {idea.creator.name[0].toUpperCase()}
                  </div>
                  <span className="text-[11px] text-[#a3a3a3]">{idea.creator.name}</span>
                </div>
                <span className="text-[11px] text-[#525252]">·</span>
                <span className="text-[11px] text-[#737373]">{idea.team.name}</span>
                <span className="text-[11px] text-[#525252]">·</span>
                <span className="text-[11px] text-[#737373]">{format(new Date(idea.createdAt), "MMM d")}</span>
                <button
                  onClick={onToggleExpand}
                  className="inline-flex items-center gap-1 text-[11px] text-[#737373] hover:text-[#a3a3a3] ml-auto"
                >
                  <MessageSquare className="w-3 h-3" />
                  {idea._count.comments}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Expanded comments section */}
      {isExpanded && !isEditing && (
        <div className="border-t border-[#262626] bg-[#1a1a1a] p-4">
          {/* Comments */}
          {idea.comments && idea.comments.length > 0 ? (
            <div className="space-y-3 mb-4">
              {idea.comments.map((c) => (
                <CommentRow key={c.id} comment={c} currentUserId={currentUserId} />
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#525252] mb-4">No comments yet. Be the first!</p>
          )}

          {/* Add comment */}
          <div className="flex items-center gap-2">
            <input
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleAddComment()}
              placeholder="Write a comment..."
              className="flex-1 px-3 py-2 bg-[#2a2a2a] border border-[#3a3a3a] text-[#f5f5f5] placeholder-[#525252] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <button
              onClick={handleAddComment}
              disabled={!comment.trim() || isCommenting}
              className="p-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 transition"
            >
              {isCommenting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Comment Row ---
function CommentRow({ comment, currentUserId }: { comment: IdeaComment; currentUserId: string }) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      await deleteIdeaComment(comment.id);
    });
  }

  return (
    <div className="flex items-start gap-2.5 group">
      <div className="w-6 h-6 rounded-full bg-[#6B7A45] flex items-center justify-center text-white text-[10px] font-medium shrink-0 mt-0.5">
        {comment.author.name[0].toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-[#f5f5f5]">{comment.author.name}</span>
          <span className="text-[10px] text-[#525252]">{format(new Date(comment.createdAt), "MMM d, h:mm a")}</span>
          {comment.author.id === currentUserId && (
            <button
              onClick={handleDelete}
              disabled={isPending}
              className="opacity-0 group-hover:opacity-100 p-0.5 text-[#737373] hover:text-red-400 transition"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
        <p className="text-sm text-[#a3a3a3] mt-0.5">{comment.content}</p>
      </div>
    </div>
  );
}

// --- Create Idea Dialog ---
function CreateIdeaDialog({ teams, onClose }: { teams: Team[]; onClose: () => void }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await createIdea(formData);
      if (result.error) {
        setError(result.error);
      } else {
        onClose();
      }
    });
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1e1e1e] border border-[#2e2e2e] rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="p-6 pb-0 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-amber-900/40 rounded-xl flex items-center justify-center">
              <Lightbulb className="w-5 h-5 text-amber-400" />
            </div>
            <h2 className="text-lg font-semibold text-[#f5f5f5]">New Idea</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-[#737373] hover:text-[#a3a3a3] hover:bg-[#2a2a2a] transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form ref={formRef} action={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-950/40 border border-red-900/40 rounded-lg text-sm text-red-400">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-[#a3a3a3] mb-1">Title *</label>
            <input
              name="title"
              required
              className="w-full px-3 py-2.5 bg-[#2a2a2a] border border-[#3a3a3a] text-[#f5f5f5] placeholder-[#525252] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              placeholder="What's your idea?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#a3a3a3] mb-1">Description</label>
            <textarea
              name="description"
              rows={4}
              className="w-full px-3 py-2.5 bg-[#2a2a2a] border border-[#3a3a3a] text-[#f5f5f5] placeholder-[#525252] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
              placeholder="Describe your idea in detail..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-[#a3a3a3] mb-1">Category</label>
              <select name="category" className="w-full px-3 py-2.5 bg-[#2a2a2a] border border-[#3a3a3a] text-[#f5f5f5] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500">
                {Object.entries(CATEGORIES).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#a3a3a3] mb-1">Team *</label>
              <select name="teamId" required className="w-full px-3 py-2.5 bg-[#2a2a2a] border border-[#3a3a3a] text-[#f5f5f5] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500">
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-[#a3a3a3] border border-[#3a3a3a] rounded-lg hover:bg-[#2a2a2a] transition">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 transition flex items-center gap-2"
            >
              {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Post Idea
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
