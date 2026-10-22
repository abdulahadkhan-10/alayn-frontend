"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Loader2, MessageSquare, Plus, Trash2, X } from "lucide-react";

export interface RailChat {
  id: string;
  title: string;
  updatedAt: string; // ISO
}

interface ConversationRailProps {
  chats: RailChat[];
  activeId: string | null;
  outletName: string;
  loading?: boolean;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onDeleteAll: () => void;
  /** Phones: the rail is a drawer that closes after choosing */
  onClose?: () => void;
  disabled?: boolean;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** "Today", "Last 7 days", "Older" by India time */
function groupOf(iso: string) {
  const day = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  if (day(new Date(iso)) === day(new Date())) return "Today";
  return Date.now() - new Date(iso).getTime() < 7 * DAY_MS ? "Last 7 days" : "Older";
}

/** Left rail: back to the dashboard, new chat, and the person's saved chats (kept for 30 days). */
export default function ConversationRail({
  chats,
  activeId,
  outletName,
  loading,
  onSelect,
  onNew,
  onDelete,
  onDeleteAll,
  onClose,
  disabled,
}: ConversationRailProps) {
  // Deleting asks once, inline (no pop-up): the first click arms it, the second confirms
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [confirmAll, setConfirmAll] = useState(false);

  const groups: { label: string; chats: RailChat[] }[] = [];
  for (const chat of chats) {
    const label = groupOf(chat.updatedAt);
    const group = groups.find((g) => g.label === label);
    if (group) group.chats.push(chat);
    else groups.push({ label, chats: [chat] });
  }

  return (
    <nav aria-label="Alayn AI conversations" className="flex h-full w-full flex-col gap-4 bg-[#0F141D] p-3">
      <div className="flex items-center justify-between gap-2 px-1 pt-1">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-slate-300 transition-colors hover:bg-white/[0.06] hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Dashboard
        </Link>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close conversations"
            className="rounded-lg p-2 text-slate-400 hover:bg-white/[0.06] hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-2.5 px-2">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white" aria-hidden="true">
          <Image src="/alayn-mark-tm.png" alt="" width={20} height={20} className="object-contain" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white">Alayn AI</p>
          <p className="truncate text-xs text-slate-400">{outletName}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={onNew}
        disabled={disabled}
        className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2.5 text-sm font-medium text-slate-100 transition-colors hover:bg-white/[0.06] disabled:opacity-50"
      >
        <Plus className="h-4 w-4" />
        New chat
      </button>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {loading ? (
          <p className="flex items-center gap-2 px-2 text-xs text-slate-400">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading your chats…
          </p>
        ) : chats.length === 0 ? (
          <p className="px-2 text-xs leading-5 text-slate-400">Your chats will show here. They are kept for 30 days and only you can see them.</p>
        ) : (
          groups.map((group) => (
            <div key={group.label} className="mb-4">
              <p className="px-2 pb-1.5 text-xs font-medium text-slate-400">{group.label}</p>
              <ul className="space-y-0.5">
                {group.chats.map((chat) => {
                  const active = chat.id === activeId;
                  return (
                    <li key={chat.id} className={`group flex items-center rounded-lg ${active ? "bg-white/[0.08]" : "hover:bg-white/[0.04]"}`}>
                      <button
                        type="button"
                        onClick={() => onSelect(chat.id)}
                        disabled={disabled}
                        aria-current={active ? "page" : undefined}
                        className={`flex min-w-0 flex-1 items-center gap-2 px-2 py-2 text-left text-sm disabled:opacity-50 ${
                          active ? "text-white" : "text-slate-300 hover:text-white"
                        }`}
                      >
                        <MessageSquare className="h-3.5 w-3.5 shrink-0 text-slate-500" aria-hidden="true" />
                        <span className="truncate">{chat.title}</span>
                      </button>
                      {confirmId === chat.id ? (
                        <button
                          type="button"
                          onClick={() => {
                            setConfirmId(null);
                            onDelete(chat.id);
                          }}
                          onBlur={() => setConfirmId(null)}
                          autoFocus
                          className="mr-1 shrink-0 rounded-md bg-rose-500/15 px-2 py-1 text-xs font-medium text-rose-300 hover:bg-rose-500/25"
                        >
                          Delete
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmId(chat.id)}
                          disabled={disabled}
                          aria-label={`Delete "${chat.title}"`}
                          // Always visible on phones (no hover there); on wide screens it appears on hover or focus
                          className="mr-1 shrink-0 rounded-md p-1.5 text-slate-400 transition-opacity hover:bg-white/[0.06] hover:text-rose-300 focus:opacity-100 disabled:opacity-30 md:opacity-0 md:group-hover:opacity-100"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))
        )}
      </div>

      <div className="space-y-2 px-2 pb-1">
        {chats.length > 0 &&
          (confirmAll ? (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-slate-300">Delete all your chats?</span>
              <button
                type="button"
                onClick={() => {
                  setConfirmAll(false);
                  onDeleteAll();
                }}
                className="rounded-md bg-rose-500/15 px-2 py-1 font-medium text-rose-300 hover:bg-rose-500/25"
              >
                Delete all
              </button>
              <button type="button" onClick={() => setConfirmAll(false)} className="rounded-md px-2 py-1 text-slate-400 hover:text-white">
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmAll(true)}
              disabled={disabled}
              className="text-xs text-slate-400 hover:text-rose-300 disabled:opacity-50"
            >
              Delete all chats
            </button>
          ))}
        <p className="text-[11px] leading-4 text-slate-400">
          Chats are private to you and deleted after 30 days. Check important numbers before acting on them.
        </p>
      </div>
    </nav>
  );
}
