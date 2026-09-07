"use client";

import { useState, useTransition } from "react";
import { markAsRead, markAllAsRead, deleteNotification } from "@/lib/actions/notifications";
import { format } from "date-fns";
import Link from "next/link";
import {
  Bell,
  CheckCircle2,
  MessageSquare,
  UserPlus,
  AlertCircle,
  Trash2,
  CheckCheck,
  Inbox,
} from "lucide-react";

interface Notification {
  id: string;
  type: string;
  message: string;
  read: boolean;
  link: string | null;
  createdAt: string;
}

const TYPE_ICONS: Record<string, typeof Bell> = {
  assigned: UserPlus,
  commented: MessageSquare,
  completed: CheckCircle2,
  mentioned: AlertCircle,
  due_soon: AlertCircle,
};

const TYPE_COLORS: Record<string, string> = {
  assigned: "bg-blue-900/40 text-blue-400",
  commented: "bg-[#1f2414] text-[#8a9a5b]",
  completed: "bg-green-900/40 text-green-400",
  mentioned: "bg-orange-900/40 text-orange-400",
  due_soon: "bg-red-900/40 text-red-400",
};

export function InboxList({ notifications }: { notifications: Notification[] }) {
  const [items, setItems] = useState(notifications);
  const [isPending, startTransition] = useTransition();
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const filtered = filter === "unread" ? items.filter((n) => !n.read) : items;
  const unreadCount = items.filter((n) => !n.read).length;

  function handleMarkRead(id: string) {
    startTransition(async () => {
      await markAsRead(id);
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    });
  }

  function handleMarkAllRead() {
    startTransition(async () => {
      await markAllAsRead();
      setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteNotification(id);
      setItems((prev) => prev.filter((n) => n.id !== id));
    });
  }

  return (
    <div>
      {/* Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1.5 text-sm rounded-lg transition ${
              filter === "all" ? "bg-[#1f2414] text-[#8a9a5b] font-medium" : "text-[#737373] hover:bg-[#2a2a2a] hover:text-[#a3a3a3]"
            }`}
          >
            All ({items.length})
          </button>
          <button
            onClick={() => setFilter("unread")}
            className={`px-3 py-1.5 text-sm rounded-lg transition ${
              filter === "unread" ? "bg-[#1f2414] text-[#8a9a5b] font-medium" : "text-[#737373] hover:bg-[#2a2a2a] hover:text-[#a3a3a3]"
            }`}
          >
            Unread ({unreadCount})
          </button>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            disabled={isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-[#8a9a5b] hover:bg-[#1f2414] rounded-lg transition"
          >
            <CheckCheck className="w-4 h-4" />
            Mark all read
          </button>
        )}
      </div>

      {/* Notifications */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <Inbox className="w-12 h-12 text-[#525252] mx-auto mb-3" />
          <p className="text-[#737373]">
            {filter === "unread" ? "No unread notifications" : "No notifications yet"}
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          {filtered.map((notification) => {
            const Icon = TYPE_ICONS[notification.type] || Bell;
            const colorClass = TYPE_COLORS[notification.type] || "bg-gray-50 text-gray-600";

            const content = (
              <div
                className={`flex items-start gap-3 p-4 rounded-xl border transition group ${
                  notification.read
                    ? "bg-[#212121] border-[#2e2e2e]"
                    : "bg-[#1f2414]/60 border-[#4A5628]/40"
                }`}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${colorClass}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${notification.read ? "text-[#a3a3a3]" : "text-[#f5f5f5] font-medium"}`}>
                    {notification.message}
                  </p>
                  <p className="text-xs text-[#525252] mt-1">
                    {format(new Date(notification.createdAt), "MMM d, h:mm a")}
                  </p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                  {!notification.read && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleMarkRead(notification.id);
                      }}
                      className="p-1.5 text-[#737373] hover:text-[#8a9a5b] rounded-lg hover:bg-[#1f2414] transition"
                      title="Mark as read"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDelete(notification.id);
                    }}
                    className="p-1.5 text-[#737373] hover:text-red-400 rounded-lg hover:bg-red-950/40 transition"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );

            return notification.link ? (
              <Link key={notification.id} href={notification.link} onClick={() => !notification.read && handleMarkRead(notification.id)}>
                {content}
              </Link>
            ) : (
              <div key={notification.id}>{content}</div>
            );
          })}
        </div>
      )}
    </div>
  );
}
