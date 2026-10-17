"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, MessageSquare, Plus, X } from "lucide-react";

export interface RailChat {
  id: string;
  title: string;
}

interface ConversationRailProps {
  chats: RailChat[];
  activeId: string | null;
  outletName: string;
  onSelect: (id: string) => void;
  onNew: () => void;
  /** Phones: the rail is a drawer that closes after choosing */
  onClose?: () => void;
  disabled?: boolean;
}

/** Left rail: back to the dashboard, new chat, and this session's conversations (kept until reload). */
export default function ConversationRail({ chats, activeId, outletName, onSelect, onNew, onClose, disabled }: ConversationRailProps) {
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
          <Image src="/justlogo.png" alt="" width={20} height={20} className="object-contain" />
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
        <p className="px-2 pb-2 text-xs font-medium text-slate-400">This session</p>
        {chats.length === 0 ? (
          <p className="px-2 text-xs leading-5 text-slate-400">Your questions show here until you reload the page.</p>
        ) : (
          <ul className="space-y-0.5">
            {chats.map((chat) => (
              <li key={chat.id}>
                <button
                  type="button"
                  onClick={() => onSelect(chat.id)}
                  disabled={disabled}
                  aria-current={chat.id === activeId ? "page" : undefined}
                  className={`flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm transition-colors disabled:opacity-50 ${
                    chat.id === activeId ? "bg-white/[0.08] text-white" : "text-slate-300 hover:bg-white/[0.04] hover:text-white"
                  }`}
                >
                  <MessageSquare className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                  <span className="truncate">{chat.title}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="px-2 pb-1 text-[11px] leading-4 text-slate-400">
        Answers come from your own sales, stock and roster. Check important numbers before acting on them.
      </p>
    </nav>
  );
}
