"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ThinkingOrb } from "thinking-orbs";
import { Loader2, Menu, Plus } from "lucide-react";
import AuthGuard from "@/components/auth/AuthGuard";
import { useBranch } from "@/lib/BranchContext";
import { useAppSelector } from "@/redux/store/hooks";
import {
  AlaynAISavedMessage,
  deleteAlaynAIChat,
  deleteAllAlaynAIChats,
  getAlaynAIChat,
  listAlaynAIChats,
  streamAlaynAI,
} from "@/lib/api";
import Composer, { ComposerHandle } from "@/components/alayn-ai/Composer";
import ConversationRail from "@/components/alayn-ai/ConversationRail";
import MessageList, { ChatTurn } from "@/components/alayn-ai/MessageList";
import { followUpsFor } from "@/components/alayn-ai/topics";

/**
 * One conversation, saved on the server (private to this person, kept for 30 days). `turns` is null
 * until the chat is opened; a chat whose id starts with "draft:" hasn't been saved yet.
 */
interface Chat {
  id: string;
  title: string;
  updatedAt: string;
  turns: ChatTurn[] | null;
}

const SUGGESTIONS = [
  {
    label: "Which days will be busiest this week?",
    prompt: "How will my sales look over the next 7 days, and which days should I prepare more for?",
  },
  {
    label: "Where is our waste coming from?",
    prompt: "Where is our waste coming from, what stock is expiring soon, and what should we do about it?",
  },
  {
    label: "Is today's roster right for our busy hours?",
    prompt: "Who is rostered today, and does that match our busiest hours and today's forecast?",
  },
  {
    label: "Which dishes sell best and worst?",
    prompt: "Which menu items are selling best this month, and which are selling least or not at all?",
  },
];

const newId = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`);
const isDraft = (id: string) => id.startsWith("draft:");
const titleFrom = (q: string) => {
  const oneLine = q.replace(/\s+/g, " ").trim();
  return oneLine.length > 60 ? `${oneLine.slice(0, 59)}…` : oneLine;
};
const istDay = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

/** "Good morning" by India time */
function greeting() {
  const hour = Number(new Date().toLocaleString("en-US", { hour: "numeric", hourCycle: "h23", timeZone: "Asia/Kolkata" }));
  return hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
}

/** Saved messages → question/answer turns (a question whose answer wasn't saved says so) */
function toTurns(messages: AlaynAISavedMessage[]): ChatTurn[] {
  const turns: ChatTurn[] = [];
  for (const m of messages) {
    if (m.role === "user") {
      turns.push({ id: m.id, question: m.content, answer: "", topics: [], status: "error", error: "No answer was saved for this question.", askedAt: m.createdAt });
    } else if (turns.length) {
      const t = turns[turns.length - 1];
      turns[turns.length - 1] = {
        ...t,
        answer: m.content,
        topics: m.topics,
        status: m.status,
        error: m.status === "error" ? (m.content ? "The answer was cut off." : "Alayn AI couldn't answer this one.") : undefined,
      };
    }
  }
  return turns;
}

export default function AlaynAIPage() {
  return (
    <AuthGuard>
      <AlaynAIWorkspace />
    </AuthGuard>
  );
}

function AlaynAIWorkspace() {
  const { activeBranch } = useBranch();
  const user = useAppSelector((state) => state.auth.user);
  const reduceMotion = !!useReducedMotion();
  const outletKey = activeBranch?.id ?? "";

  // The chat list belongs to one outlet; switching outlet loads that outlet's chats
  const [store, setStore] = useState<{ outletKey: string; chats: Chat[] } | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const composerRef = useRef<ComposerHandle>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);

  const listLoading = !!activeBranch && store?.outletKey !== outletKey;
  const chats = store?.outletKey === outletKey ? store.chats : [];
  const activeChat = chats.find((c) => c.id === activeId) ?? null;
  const turns = activeChat?.turns ?? [];
  const chatLoading = !!activeChat && activeChat.turns === null;

  /** Changes this outlet's chat list (ignored if the outlet has changed meanwhile) */
  const updateChats = useCallback(
    (key: string, change: (chats: Chat[]) => Chat[]) =>
      setStore((s) => (s && s.outletKey === key ? { ...s, chats: change(s.chats) } : s)),
    [],
  );

  useEffect(() => {
    if (!outletKey) return;
    let cancelled = false;
    const key = outletKey;
    listAlaynAIChats(key).then((res) => {
      if (cancelled) return;
      setStore({ outletKey: key, chats: res.ok ? res.data.chats.map((c) => ({ ...c, turns: null })) : [] });
      if (!res.ok) setNotice("Couldn't load your saved chats. New questions still work.");
    });
    return () => {
      cancelled = true;
    };
  }, [outletKey]);

  // Dark page from edge to edge, including the overscroll area behind it
  useEffect(() => {
    const html = document.documentElement;
    const prev = { bg: document.body.style.backgroundColor, scheme: html.style.colorScheme };
    document.body.style.backgroundColor = "#0B0F17";
    html.style.colorScheme = "dark";
    return () => {
      document.body.style.backgroundColor = prev.bg;
      html.style.colorScheme = prev.scheme;
    };
  }, []);

  useEffect(() => {
    composerRef.current?.focus();
  }, [activeId]);

  // Stop an answer that is still coming when the owner leaves the page
  useEffect(() => () => abortRef.current?.abort(), []);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setDrawerOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  // Follow the answer as it is written, unless the owner has scrolled up to read
  const lastAnswer = turns[turns.length - 1]?.answer;
  useEffect(() => {
    const el = scrollRef.current;
    if (el && stickToBottom.current) el.scrollTo({ top: el.scrollHeight, behavior: reduceMotion ? "auto" : "smooth" });
  }, [turns.length, lastAnswer, reduceMotion, activeId]);

  async function openChat(id: string) {
    setDrawerOpen(false);
    setNotice(null);
    setActiveId(id);
    stickToBottom.current = true;
    const chat = chats.find((c) => c.id === id);
    if (!chat || chat.turns !== null || isDraft(id)) return;
    const key = outletKey;
    const res = await getAlaynAIChat(id, key);
    if (res.ok) {
      updateChats(key, (all) => all.map((c) => (c.id === id ? { ...c, turns: toTurns(res.data.messages) } : c)));
    } else {
      // Deleted elsewhere or past 30 days: drop it from the list
      updateChats(key, (all) => all.filter((c) => c.id !== id));
      setActiveId(null);
      setNotice("That chat is no longer available. It may have been deleted or be older than 30 days.");
    }
  }

  async function ask(question: string, retry = false) {
    const q = question.trim();
    // Wait until the outlet and its chats are known, so the answer is filed under the right outlet
    if (!q || generating || !activeBranch || listLoading || chatLoading) return;

    const key = outletKey;
    const existing = activeChat;
    let chatId = existing?.id ?? `draft:${newId()}`;
    const earlier = existing?.turns ?? [];
    const kept = retry ? earlier.slice(0, -1) : earlier;
    const turn: ChatTurn = { id: newId(), question: q, answer: "", topics: [], status: "streaming", askedAt: new Date().toISOString() };
    const now = new Date().toISOString();

    updateChats(key, (all) => [
      { id: chatId, title: existing?.title ?? titleFrom(q), updatedAt: now, turns: [...kept, turn] },
      ...all.filter((c) => c.id !== chatId),
    ]);
    setActiveId(chatId);
    setPrompt("");
    setNotice(null);
    setGenerating(true);
    stickToBottom.current = true;

    const updateTurn = (change: (t: ChatTurn) => ChatTurn) =>
      updateChats(key, (all) => all.map((c) => (c.id !== chatId ? c : { ...c, turns: (c.turns ?? []).map((t) => (t.id === turn.id ? change(t) : t)) })));

    const abort = new AbortController();
    abortRef.current = abort;
    const result = await streamAlaynAI(
      q,
      activeBranch.id,
      { chatId: existing && !isDraft(existing.id) ? existing.id : null, retry },
      {
        // A new chat is saved as soon as the question arrives; swap the draft for its real id
        onChat: (savedId, title) => {
          if (savedId === chatId) return;
          const draftId = chatId;
          chatId = savedId;
          updateChats(key, (all) => all.map((c) => (c.id === draftId ? { ...c, id: savedId, title } : c)));
          setActiveId((cur) => (cur === draftId ? savedId : cur));
        },
        onTopics: (topics) => updateTurn((t) => ({ ...t, topics })),
        onDelta: (text) => updateTurn((t) => ({ ...t, answer: t.answer + text })),
        signal: abort.signal,
      },
    );
    abortRef.current = null;
    setGenerating(false);
    updateTurn((t) =>
      result.ok
        ? { ...t, status: "done" }
        : result.stopped
          ? { ...t, status: "stopped" }
          : { ...t, status: "error", error: result.error ?? "Couldn't get an answer right now. Please try again." },
    );
  }

  function stop() {
    abortRef.current?.abort();
  }

  function newChat() {
    if (generating) return;
    setActiveId(null);
    setPrompt("");
    setNotice(null);
    setDrawerOpen(false);
  }

  async function removeChat(id: string) {
    if (generating) return;
    const key = outletKey;
    if (!isDraft(id)) {
      const res = await deleteAlaynAIChat(id, key);
      // Already gone counts as deleted
      if (!res.ok && res.status !== 404) {
        setNotice("Couldn't delete that chat. Please try again.");
        return;
      }
    }
    updateChats(key, (all) => all.filter((c) => c.id !== id));
    if (activeId === id) setActiveId(null);
  }

  async function removeAllChats() {
    if (generating) return;
    const key = outletKey;
    const res = await deleteAllAlaynAIChats(key);
    if (!res.ok) {
      setNotice("Couldn't delete your chats. Please try again.");
      return;
    }
    updateChats(key, () => []);
    setActiveId(null);
  }

  function copy(turn: ChatTurn) {
    navigator.clipboard?.writeText(turn.answer).catch(() => {});
    setCopiedId(turn.id);
    setTimeout(() => setCopiedId((cur) => (cur === turn.id ? null : cur)), 2000);
  }

  function share(turn: ChatTurn) {
    if (typeof navigator !== "undefined" && navigator.share) navigator.share({ title: "Alayn AI answer", text: turn.answer }).catch(() => {});
    else copy(turn);
  }

  const last = turns[turns.length - 1];
  const followUps = last && last.status === "done" ? followUpsFor(last.topics, turns.map((t) => t.question)) : [];
  const outletName = activeBranch?.name ?? "All outlets";
  const firstName = typeof user?.name === "string" ? user.name.trim().split(/\s+/)[0] : "";
  // A chat from an earlier day: its numbers were right then, not necessarily now
  const staleSince = last?.askedAt && istDay(new Date(last.askedAt)) !== istDay(new Date()) ? new Date(last.askedAt) : null;

  const composer = (
    <Composer
      ref={composerRef}
      value={prompt}
      onChange={setPrompt}
      onSend={() => ask(prompt)}
      onStop={stop}
      generating={generating}
      disabled={!activeBranch || chatLoading}
      reduceMotion={reduceMotion}
      placeholder={!activeBranch ? "Loading your outlet…" : turns.length ? "Ask a follow-up…" : "Ask about your café…"}
    />
  );

  const rail = (onClose?: () => void) => (
    <ConversationRail
      chats={chats.map((c) => ({ id: c.id, title: c.title, updatedAt: c.updatedAt }))}
      activeId={activeChat?.id ?? null}
      outletName={outletName}
      loading={listLoading}
      disabled={generating}
      onNew={newChat}
      onSelect={openChat}
      onDelete={removeChat}
      onDeleteAll={removeAllChats}
      onClose={onClose}
    />
  );

  return (
    <div className="fixed inset-0 z-40 flex bg-[#0B0F17] font-sans text-slate-100 antialiased [color-scheme:dark] selection:bg-rose-500/30">
      {/* Conversations: a rail on wide screens, a drawer on phones */}
      <aside className="hidden w-[260px] shrink-0 border-r border-white/[0.06] md:block">{rail()}</aside>
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/60 md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
              aria-hidden="true"
            />
            <motion.aside
              className="fixed inset-y-0 left-0 z-50 w-[280px] max-w-[85vw] border-r border-white/[0.06] md:hidden"
              initial={reduceMotion ? { opacity: 0 } : { x: "-100%" }}
              animate={reduceMotion ? { opacity: 1 } : { x: 0 }}
              exit={reduceMotion ? { opacity: 0 } : { x: "-100%" }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            >
              {rail(() => setDrawerOpen(false))}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <main className="flex min-w-0 flex-1 flex-col">
        {/* Phone header */}
        <header className="flex items-center justify-between gap-2 border-b border-white/[0.06] px-3 py-2 md:hidden">
          <button type="button" onClick={() => setDrawerOpen(true)} aria-label="Open conversations" className="rounded-lg p-2 text-slate-300 hover:bg-white/[0.06]">
            <Menu className="h-5 w-5" />
          </button>
          <p className="truncate text-sm font-semibold">Alayn AI</p>
          <button
            type="button"
            onClick={newChat}
            disabled={generating}
            aria-label="New chat"
            className="rounded-lg p-2 text-slate-300 hover:bg-white/[0.06] disabled:opacity-50"
          >
            <Plus className="h-5 w-5" />
          </button>
        </header>

        <div
          ref={scrollRef}
          onScroll={(e) => {
            const el = e.currentTarget;
            stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
          }}
          className="min-h-0 flex-1 overflow-y-auto"
        >
          {chatLoading ? (
            <div className="flex h-full items-center justify-center gap-2 text-sm text-slate-400" role="status">
              <Loader2 className="h-4 w-4 animate-spin" /> Opening chat…
            </div>
          ) : turns.length === 0 ? (
            /* Empty state: greeting, the question box, and a few good first questions */
            <div className="mx-auto flex min-h-full w-full max-w-2xl flex-col justify-center px-4 py-10">
              <div className="mb-8 flex flex-col items-center text-center">
                <ThinkingOrb state="breathing" size={64} theme="dark" color="#F87171" paused={reduceMotion} aria-hidden="true" />
                <h1 className="mt-5 text-2xl sm:text-3xl font-semibold tracking-tight text-white">
                  {greeting()}
                  {firstName ? `, ${firstName}` : ""}
                </h1>
                <p className="mt-2 text-sm text-slate-400">What would you like to know about {outletName}?</p>
              </div>
              {notice && <p className="mb-3 text-center text-sm text-rose-300">{notice}</p>}
              {composer}
              <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s.label}
                    type="button"
                    onClick={() => ask(s.prompt)}
                    disabled={!activeBranch}
                    className="rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3 text-left text-sm text-slate-200 transition-colors hover:border-white/20 hover:bg-white/[0.05] disabled:opacity-50"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mx-auto w-full max-w-3xl px-4 pb-6 pt-6 sm:pt-10">
              {staleSince && (
                <p className="mb-6 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-xs text-slate-300">
                  From {staleSince.toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" })}. The numbers may have
                  changed since then; ask again for today&apos;s figures.
                </p>
              )}
              <MessageList
                turns={turns}
                copiedId={copiedId}
                onCopy={copy}
                onShare={share}
                onRetry={(t) => ask(t.question, true)}
                followUps={generating ? [] : followUps}
                onFollowUp={(q) => ask(q)}
                reduceMotion={reduceMotion}
              />
            </div>
          )}
        </div>

        {/* Question box pinned to the bottom during a conversation */}
        {turns.length > 0 && (
          <div className="mx-auto w-full max-w-3xl px-4 pb-4 pt-2">
            {notice && <p className="mb-2 text-center text-sm text-rose-300">{notice}</p>}
            {composer}
            <p className="mt-2 text-center text-[11px] text-slate-400">Enter to send · Shift + Enter for a new line</p>
          </div>
        )}
      </main>
    </div>
  );
}
