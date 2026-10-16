"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ThinkingOrb } from "thinking-orbs";
import { BorderBeam } from "border-beam";
import Image from "next/image";
import { useRouter } from "next/navigation";
import AuthGuard from "@/components/auth/AuthGuard";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useBranch } from "@/lib/BranchContext";
import { askAlaynAI, AlaynAIMessage } from "@/lib/api";
import { useGetKpisQuery } from "@/redux/slices/dashboardApiSlice";
import {
  ArrowUp,
  Share2,
  RotateCcw,
  Copy,
  CheckCircle2,
  ArrowLeft,
  ArrowUpRight,
  Sparkles,
  AlertTriangle,
} from "lucide-react";

/* ─────────────────────────────────────────────────────────────────────────────
   TEXT HELPERS
───────────────────────────────────────────────────────────────────────────── */
function stripEmojis(s: string) {
  return s.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, "");
}

function renderInline(raw: string) {
  return stripEmojis(raw).split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*\s][^*]*\*)/g).map((seg, i) => {
    if (seg.startsWith("`") && seg.endsWith("`") && seg.length > 2)
      return (
        <code
          key={i}
          className="font-mono text-xs px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-800 font-semibold"
        >
          {seg.slice(1, -1)}
        </code>
      );
    if (seg.startsWith("**") && seg.endsWith("**") && seg.length > 4)
      return (
        <strong key={i} className="font-bold text-slate-900">
          {seg.slice(2, -2)}
        </strong>
      );
    if (seg.length > 2 && seg.startsWith("*") && seg.endsWith("*"))
      return (
        <em key={i} className="italic">
          {seg.slice(1, -1)}
        </em>
      );
    return seg;
  });
}

// "| a | b |" → ["a", "b"]
const tableCells = (line: string) => line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());
const isTableLine = (line: string) => /^\|.*\|$/.test(line.trim());
const isTableDivider = (line: string) => /^\|?[\s:|-]+\|?$/.test(line.trim()) && line.includes("-");

function FormattedResponse({ text }: { text: string }) {
  if (!text) return null;
  const els: React.ReactNode[] = [];
  let firstH = true;
  const lines = text.split("\n");
  lines.forEach((line, i) => {
    const t = stripEmojis(line.trim());
    if (!t) return;

    // Markdown tables: rendered once, at their first row; the other rows are skipped
    if (isTableLine(t)) {
      if (i > 0 && isTableLine(lines[i - 1])) return;
      const rows: string[][] = [];
      for (let j = i; j < lines.length && isTableLine(lines[j]); j++) {
        if (!isTableDivider(lines[j])) rows.push(tableCells(stripEmojis(lines[j])));
      }
      const [header, ...body] = rows;
      els.push(
        <div key={i} className="my-4 overflow-x-auto rounded-xl border border-slate-200/80">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                {header.map((cell, c) => (
                  <th key={c} className="px-3.5 py-2.5 font-semibold whitespace-nowrap">{renderInline(cell)}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {body.map((row, r) => (
                <tr key={r}>
                  {row.map((cell, c) => (
                    <td key={c} className="px-3.5 py-2.5 text-slate-700 align-top">{renderInline(cell)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      return;
    }
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(t)) {
      els.push(<hr key={i} className="my-6 border-slate-200/70" />);
      return;
    }

    const isH =
      t.startsWith("#") ||
      (t.startsWith("**") && (t.endsWith(":") || t.length < 80)) ||
      (t.endsWith(":") && !t.startsWith("-") && t.length < 80);
    const isB = /^[-*•]\s/.test(t) || /^\d+\.\s/.test(t);

    if (isH) {
      const title = t.replace(/^#+\s*/, "").replace(/\*\*/g, "").replace(/:$/, "").trim();
      els.push(
        <h3 key={i} className={`text-sm font-semibold text-slate-900 ${firstH ? "mt-0" : "mt-6"} mb-2`}>
          {title}
        </h3>
      );
      firstH = false;
    } else if (isB) {
      const content = t.replace(/^[-*•\d.]+\s*/, "");
      els.push(
        <div key={i} className="flex items-start gap-3 my-2 pl-3">
          <span className="w-1.5 h-1.5 rounded-full bg-[#E5484D] shrink-0 mt-2 opacity-80" />
          <div className="flex-1 text-sm text-slate-700 leading-relaxed font-normal">
            {renderInline(content)}
          </div>
        </div>
      );
    } else {
      els.push(
        <p key={i} className="text-sm text-slate-700 leading-relaxed my-2">
          {renderInline(t)}
        </p>
      );
    }
  });
  return <div className="max-w-3xl font-sans">{els}</div>;
}

/* ─────────────────────────────────────────────────────────────────────────────
   ULTRA-MINIMAL EDITORIAL PROMPT SHORTCUT ROW
───────────────────────────────────────────────────────────────────────────── */
function PromptRow({
  query,
  category,
  onClick,
  index,
}: {
  query: string;
  category: string;
  onClick: () => void;
  index: number;
}) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
      onClick={onClick}
      className="group w-full py-4 px-5 rounded-xl border border-transparent hover:border-slate-200/90 bg-white/40 hover:bg-white hover:shadow-2xs transition-all duration-200 flex items-center justify-between gap-4 text-left cursor-pointer"
    >
      <div className="flex items-center gap-3.5 min-w-0">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-[#E5484D] transition-colors w-20 shrink-0">
          {category}
        </span>
        <span className="text-sm font-semibold text-slate-800 group-hover:text-slate-900 transition-colors truncate">
          {query}
        </span>
      </div>
      <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-[#E5484D] transition-colors shrink-0" />
    </motion.button>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN ALAYN AI ENTERPRISE WORKSPACE
───────────────────────────────────────────────────────────────────────────── */
export default function AlaynAIPage() {
  const router = useRouter();
  const { activeBranch } = useBranch();
  const inputRef = useRef<HTMLInputElement>(null);

  const [prompt, setPrompt] = useState("");
  // The conversation so far; the last few exchanges are sent with each question so follow-ups work.
  // It belongs to one outlet: switching outlet shows a fresh conversation.
  const outletKey = activeBranch?.id ?? "";
  const [conversation, setConversation] = useState<{ outletKey: string; turns: { question: string; answer: string }[] }>({
    outletKey: "",
    turns: [],
  });
  const thread = conversation.outletKey === outletKey ? conversation.turns : [];
  const setThread = (turns: { question: string; answer: string }[]) => setConversation({ outletKey, turns });
  const [pendingQuestion, setPendingQuestion] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  // The orb honours the OS "reduce motion" setting itself; the border glow needs telling
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Keep the newest answer (and the question box under it) in view
  useEffect(() => {
    if (thread.length > 0 || isGenerating) endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [thread.length, isGenerating]);

  async function handleAsk(override?: string, rerunLast = false) {
    const q = (override ?? prompt).trim();
    // Wait until the outlet is known, so the answer is about (and filed under) the right outlet
    if (!q || isGenerating || !activeBranch) return;
    const earlier = rerunLast ? thread.slice(0, -1) : thread;
    const history: AlaynAIMessage[] = earlier.slice(-3).flatMap((turn) => [
      { role: "user" as const, content: turn.question },
      { role: "assistant" as const, content: turn.answer },
    ]);
    setPrompt("");
    setPendingQuestion(q);
    setIsGenerating(true);
    setError(null);
    const result = await askAlaynAI(q, activeBranch?.id, history);
    setIsGenerating(false);
    setPendingQuestion(null);
    if (result.ok && result.answer) {
      setThread([...earlier, { question: q, answer: result.answer }]);
    } else {
      setError(result.error ?? "Couldn't get an answer right now. Please try again.");
      setPrompt(q);
    }
  }

  function handleCopy(text: string, idx: number) {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx((cur) => (cur === idx ? null : cur)), 2200);
  }

  function handleShare(text: string, idx: number) {
    if (typeof navigator !== "undefined" && navigator.share)
      navigator.share({ title: "Alayn AI answer", text }).catch(() => {});
    else handleCopy(text, idx);
  }

  function handleClear() {
    setThread([]);
    setError(null);
    setPrompt("");
    setTimeout(() => inputRef.current?.focus(), 60);
  }

  // Margins need recipe (food) costs; until they exist the question can't be answered, so don't offer it
  const { data: kpis } = useGetKpisQuery({ outletId: activeBranch?.id || undefined });
  const marginsAvailable = kpis?.cogsConfigured === true;

  // 4 Highly Curated Editorial Queries (No redundant cards, no bloated graphics)
  const SUGGESTED_QUERIES = [
    {
      query: "Which days will be busiest this week?",
      category: "Forecast",
      prompt: "How will my sales look over the next 7 days, and which days should I prepare more for?",
    },
    {
      query: "Where are we losing inventory waste?",
      category: "Inventory",
      prompt: "Where is our waste coming from, what stock is expiring soon, and what should we do about it?",
    },
    {
      query: "Is today's roster right for our busy hours?",
      category: "Workforce",
      prompt: "Who is rostered today, and does that match our busiest hours and today's forecast?",
    },
    marginsAvailable
      ? {
          query: "Which dishes yield our best profit margins?",
          category: "Menu",
          prompt: "Which menu items have the best margin and which underperform?",
        }
      : {
          query: "Which menu items are selling best and worst?",
          category: "Menu",
          prompt: "Which menu items are selling best this month, and which are selling least or not at all?",
        },
  ];

  const composer = (
    <>
      {/* A warm glow travels around the box while AlaynAI is answering (still for reduced-motion users) */}
      <BorderBeam active={isGenerating && !reduceMotion} size="md" colorVariant="sunset" theme="light" strength={0.8}>
      <div
        className={`bg-white rounded-2xl p-2.5 sm:p-3 border transition-all duration-300 flex items-center gap-3 ${
          isFocused
            ? "border-[#E5484D] shadow-md ring-4 ring-rose-500/5"
            : "border-slate-200/80 shadow-2xs hover:border-slate-300"
        }`}
      >
        <input
          ref={inputRef}
          type="text"
          placeholder={
            !activeBranch
              ? "Loading your outlet..."
              : thread.length
              ? "Ask a follow-up question..."
              : "Ask AlaynAI anything about your restaurant..."
          }
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAsk();
            }
          }}
          disabled={isGenerating || !activeBranch}
          className="flex-1 bg-transparent px-3 text-base sm:text-lg font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none min-w-0"
        />

        <button
          onClick={() => handleAsk()}
          disabled={!prompt.trim() || isGenerating || !activeBranch}
          className={`w-11 h-11 rounded-xl font-bold transition-all flex items-center justify-center shrink-0 ${
            prompt.trim() && !isGenerating
              ? "bg-[#E5484D] hover:bg-[#D3232A] text-white shadow-2xs"
              : "bg-slate-100 text-slate-300 cursor-not-allowed"
          }`}
        >
          {isGenerating ? (
            <ThinkingOrb state="working" size={20} theme="light" color="#64748B" aria-hidden="true" />
          ) : (
            <ArrowUp className="w-5 h-5" />
          )}
        </button>
      </div>
      </BorderBeam>

      <div className="mt-2.5 px-3 flex items-center justify-between text-xs text-slate-400">
        <span>Ask about sales, forecasts, stock, staff or your menu</span>
        <span className="hidden sm:inline">↵ Enter</span>
      </div>
    </>
  );

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="min-h-screen bg-[#FAFAFC] font-sans text-slate-800 antialiased selection:bg-rose-100 selection:text-rose-900">
          
          {/* ── TOP UTILITY NAVIGATION BAR ── */}
          <div className="sticky top-0 z-20 bg-[#FAFAFC]/80 backdrop-blur-md px-6 sm:px-12 py-4 flex items-center justify-between border-b border-slate-200/50">
            <button
              onClick={() => router.push("/dashboard")}
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </button>

            <div className="flex items-center gap-2.5 text-xs text-slate-500 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>{activeBranch?.name ?? "All Locations"}</span>
            </div>
          </div>

          {/* ── MAIN EDITORIAL CANVAS CONTAINER ── */}
          <div className="max-w-4xl mx-auto px-6 sm:px-8 pt-12 sm:pt-16 pb-24">
            
            {/* ── HERO & TITLE (CONFIDENT & MINIMAL) ── */}
            <div className="mb-10 text-center sm:text-left">
              <div className="inline-flex items-center gap-2.5 mb-3">
                <Image src="/justlogo.png" alt="Alayn AI" width={22} height={22} className="object-contain" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#E5484D]">
                  AlaynAI Workspace
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                Ask Alayn AI
              </h1>
            </div>

            {/* ── QUESTION BOX: here before a conversation starts, pinned to the bottom during one ── */}
            {thread.length === 0 && !isGenerating && <div className="mb-14">{composer}</div>}

            {/* ── CONVERSATION SO FAR ── */}
            {thread.length > 0 && (
              <div className="space-y-8 mb-6">
                <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-200/60">
                  <span className="font-semibold text-slate-600">Conversation</span>
                  <button
                    onClick={handleClear}
                    disabled={isGenerating}
                    className="hover:text-slate-900 transition-colors font-medium disabled:opacity-50"
                  >
                    New conversation
                  </button>
                </div>

                {thread.map((turn, idx) => {
                  const isLatest = idx === thread.length - 1;
                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-3"
                    >
                      <p className="px-1 text-sm font-semibold text-slate-900">{turn.question}</p>
                      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-7 shadow-2xs">
                        <FormattedResponse text={turn.answer} />
                      </div>
                      <div className="flex items-center justify-between px-1 text-xs">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleCopy(turn.answer, idx)}
                            className="inline-flex items-center gap-1.5 font-semibold text-slate-500 hover:text-slate-900 transition-colors"
                          >
                            {copiedIdx === idx ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedIdx === idx ? "Copied" : "Copy"}</span>
                          </button>
                          <button
                            onClick={() => handleShare(turn.answer, idx)}
                            className="inline-flex items-center gap-1.5 font-semibold text-slate-500 hover:text-slate-900 transition-colors"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                            <span>Share</span>
                          </button>
                        </div>
                        {isLatest && !isGenerating && (
                          <button
                            onClick={() => handleAsk(turn.question, true)}
                            className="inline-flex items-center gap-1.5 font-semibold text-[#E5484D] hover:underline"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Ask again</span>
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* ── DYNAMIC STATES ── */}
            <AnimatePresence mode="wait">

              {/* LOADING STATE */}
              {isGenerating && (
                <motion.div
                  key="generating"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="py-10 text-center space-y-4"
                >
                  {pendingQuestion && <p className="text-sm font-semibold text-slate-900">{pendingQuestion}</p>}
                  <div className="flex justify-center">
                    <ThinkingOrb
                      state="searching"
                      size={64}
                      theme="light"
                      // Deeper red and bolder dots: the light theme fades ink toward white
                      color="#C81E25"
                      dotSize={1.6}
                      role="img"
                      aria-label="AlaynAI is checking your numbers"
                    />
                  </div>
                  <p className="text-sm font-medium text-slate-500">Checking your numbers...</p>
                </motion.div>
              )}

              {/* ERROR STATE */}
              {!isGenerating && error && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2"
                >
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}

              {/* SUGGESTED QUESTIONS */}
              {!isGenerating && thread.length === 0 && (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  <div className="px-1 text-xs font-bold uppercase tracking-wider text-slate-400">
                    Try asking
                  </div>

                  <div className="space-y-1">
                    {SUGGESTED_QUERIES.map((item, idx) => (
                      <PromptRow
                        key={idx}
                        index={idx}
                        category={item.category}
                        query={item.query}
                        onClick={() => handleAsk(item.prompt)}
                      />
                    ))}
                  </div>
                </motion.div>
              )}

            </AnimatePresence>

            {/* Pinned question box for follow-ups, next to the newest answer */}
            {(thread.length > 0 || isGenerating) && (
              <div className="sticky bottom-0 z-10 -mx-2 px-2 pt-6 pb-4 bg-gradient-to-t from-[#FAFAFC] via-[#FAFAFC] to-[#FAFAFC]/0">
                {composer}
              </div>
            )}
            <div ref={endRef} />
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
