"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ThinkingOrb } from "thinking-orbs";
import { Menu, Plus } from "lucide-react";
import AuthGuard from "@/components/auth/AuthGuard";
import { useBranch } from "@/lib/BranchContext";
import { useAppSelector } from "@/redux/store/hooks";
import { AlaynAIMessage, streamAlaynAI } from "@/lib/api";
import Composer, { ComposerHandle } from "@/components/alayn-ai/Composer";
import ConversationRail from "@/components/alayn-ai/ConversationRail";
import MessageList, { ChatTurn } from "@/components/alayn-ai/MessageList";
import { followUpsFor } from "@/components/alayn-ai/topics";

/** One conversation. Kept in memory for this session only, and tied to the outlet it was about. */
interface Chat {
  id: string;
  outletKey: string;
  title: string;
  turns: ChatTurn[];
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

// Earlier exchanges sent with each question, so "and Sunday?" makes sense
const HISTORY_TURNS = 3;

const newId = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`);

/** "Good morning" by India time */
function greeting() {
  const hour = Number(new Date().toLocaleString("en-US", { hour: "numeric", hourCycle: "h23", timeZone: "Asia/Kolkata" }));
  return hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
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

  const [chats, setChats] = useState<Chat[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const composerRef = useRef<ComposerHandle>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);

  // Conversations belong to one outlet: switching outlet shows that outlet's (initially none)
  const outletChats = useMemo(() => chats.filter((c) => c.outletKey === outletKey), [chats, outletKey]);
  const activeChat = outletChats.find((c) => c.id === activeId) ?? null;
  const turns = activeChat?.turns ?? [];

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
  }, [turns.length, lastAnswer, reduceMotion]);

  const updateTurn = useCallback((chatId: string, turnId: string, change: (t: ChatTurn) => ChatTurn) => {
    setChats((all) =>
      all.map((c) => (c.id !== chatId ? c : { ...c, turns: c.turns.map((t) => (t.id === turnId ? change(t) : t)) })),
    );
  }, []);

  async function ask(question: string, retry = false) {
    const q = question.trim();
    // Wait until the outlet is known, so the answer is about (and filed under) the right outlet
    if (!q || generating || !activeBranch) return;

    const chat: Chat = activeChat ?? { id: newId(), outletKey, title: q.length > 60 ? `${q.slice(0, 57)}…` : q, turns: [] };
    const earlier = retry ? chat.turns.slice(0, -1) : chat.turns;
    const history: AlaynAIMessage[] = earlier
      .filter((t) => t.status === "done" && t.answer)
      .slice(-HISTORY_TURNS)
      .flatMap((t) => [
        { role: "user" as const, content: t.question },
        { role: "assistant" as const, content: t.answer },
      ]);
    const turn: ChatTurn = { id: newId(), question: q, answer: "", topics: [], status: "streaming" };

    setChats((all) => [{ ...chat, turns: [...earlier, turn] }, ...all.filter((c) => c.id !== chat.id)]);
    setActiveId(chat.id);
    setPrompt("");
    setGenerating(true);
    stickToBottom.current = true;

    const abort = new AbortController();
    abortRef.current = abort;
    const result = await streamAlaynAI(q, activeBranch.id, history, {
      onTopics: (topics) => updateTurn(chat.id, turn.id, (t) => ({ ...t, topics })),
      onDelta: (text) => updateTurn(chat.id, turn.id, (t) => ({ ...t, answer: t.answer + text })),
      signal: abort.signal,
    });
    abortRef.current = null;
    setGenerating(false);
    updateTurn(chat.id, turn.id, (t) =>
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
    setDrawerOpen(false);
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

  const composer = (
    <Composer
      ref={composerRef}
      value={prompt}
      onChange={setPrompt}
      onSend={() => ask(prompt)}
      onStop={stop}
      generating={generating}
      disabled={!activeBranch}
      reduceMotion={reduceMotion}
      placeholder={!activeBranch ? "Loading your outlet…" : turns.length ? "Ask a follow-up…" : "Ask about your café…"}
    />
  );

  const rail = (onClose?: () => void) => (
    <ConversationRail
      chats={outletChats.map((c) => ({ id: c.id, title: c.title }))}
      activeId={activeChat?.id ?? null}
      outletName={outletName}
      disabled={generating}
      onNew={newChat}
      onSelect={(id) => {
        setActiveId(id);
        setDrawerOpen(false);
      }}
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
          {turns.length === 0 ? (
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
            {composer}
            <p className="mt-2 text-center text-[11px] text-slate-400">Enter to send · Shift + Enter for a new line</p>
          </div>
        )}
      </main>
    </div>
  );
}
