"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import AuthGuard from "@/components/auth/AuthGuard";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useBranch } from "@/lib/BranchContext";
import { askAlaynAI } from "@/lib/api";
import {
  ArrowUp,
  RefreshCw,
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
  return stripEmojis(raw).split(/(`[^`]+`|\*\*[^*]+\*\*)/g).map((seg, i) => {
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
    return seg;
  });
}

function FormattedResponse({ text }: { text: string }) {
  if (!text) return null;
  const els: React.ReactNode[] = [];
  let firstH = true;
  text.split("\n").forEach((line, i) => {
    const t = stripEmojis(line.trim());
    if (!t) return;
    const isH =
      t.startsWith("#") ||
      (t.startsWith("**") && (t.endsWith(":") || t.length < 80)) ||
      (t.endsWith(":") && !t.startsWith("-") && t.length < 80);
    const isB = /^[-*•]\s/.test(t) || /^\d+\.\s/.test(t);

    if (isH) {
      const title = t.replace(/^#+\s*/, "").replace(/\*\*/g, "").replace(/:$/, "").trim();
      els.push(
        <div key={i} className={`flex items-center gap-2.5 ${firstH ? "mt-0" : "mt-8"} mb-3`}>
          <span className="w-1 h-3.5 rounded-full bg-[#E5484D]" />
          <h3 className="text-base font-bold text-slate-900 tracking-tight">{title}</h3>
        </div>
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
  const [answer, setAnswer] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function handleAsk(override?: string) {
    const q = (override ?? prompt).trim();
    if (!q || isGenerating) return;
    setPrompt(q);
    setIsGenerating(true);
    setError(null);
    setAnswer(null);
    const result = await askAlaynAI(q, activeBranch?.id);
    setIsGenerating(false);
    if (result.ok && result.answer) setAnswer(result.answer);
    else setError(result.error ?? "Failed to analyze telemetry. Please try again.");
  }

  function handleCopy() {
    if (!answer) return;
    navigator.clipboard.writeText(answer);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2200);
  }

  function handleShare() {
    if (!answer) return;
    if (typeof navigator !== "undefined" && navigator.share)
      navigator.share({ title: "Alayn AI Analysis", text: answer }).catch(() => {});
    else handleCopy();
  }

  function handleClear() {
    setAnswer(null);
    setError(null);
    setPrompt("");
    setTimeout(() => inputRef.current?.focus(), 60);
  }

  // 4 Highly Curated Editorial Queries (No redundant cards, no bloated graphics)
  const SUGGESTED_QUERIES = [
    {
      query: "Where will revenue peak this weekend?",
      category: "Forecast",
      prompt: "Forecast weekend revenue surge based on current data",
    },
    {
      query: "Where are we losing inventory waste?",
      category: "Inventory",
      prompt: "Detect inventory waste anomalies and suggest corrective actions",
    },
    {
      query: "How should I staff tonight's rush shift?",
      category: "Workforce",
      prompt: "Optimize peak shift roster for the upcoming week",
    },
    {
      query: "Which dishes yield our best profit margins?",
      category: "Menu",
      prompt: "Which menu items have the best margin and which underperform?",
    },
  ];

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
              <span className="text-slate-300">·</span>
              <span className="text-slate-400 font-mono text-[11px]">AlaynAI Telemetry</span>
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

            {/* ── REFINED INPUT COMPOSER ── */}
            <div className="mb-14">
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
                  placeholder="Ask AlaynAI anything about your restaurant..."
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
                  disabled={isGenerating}
                  className="flex-1 bg-transparent px-3 text-base sm:text-lg font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none min-w-0"
                />

                <button
                  onClick={() => handleAsk()}
                  disabled={!prompt.trim() || isGenerating}
                  className={`w-11 h-11 rounded-xl font-bold transition-all flex items-center justify-center shrink-0 ${
                    prompt.trim() && !isGenerating
                      ? "bg-[#E5484D] hover:bg-[#D3232A] text-white shadow-2xs"
                      : "bg-slate-100 text-slate-300 cursor-not-allowed"
                  }`}
                >
                  {isGenerating ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-slate-500" />
                  ) : (
                    <ArrowUp className="w-5 h-5" />
                  )}
                </button>
              </div>

              <div className="mt-2.5 px-3 flex items-center justify-between text-xs text-slate-400">
                <span>Direct inquiry into sales, inventory, staffing &amp; recipes</span>
                <span>↵ Enter</span>
              </div>
            </div>

            {/* ── DYNAMIC STATES ── */}
            <AnimatePresence mode="wait">
              
              {/* LOADING STATE */}
              {isGenerating && (
                <motion.div
                  key="generating"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="py-12 text-center space-y-4"
                >
                  <RefreshCw className="w-5 h-5 text-[#E5484D] animate-spin mx-auto" />
                  <p className="text-sm font-semibold text-slate-600">
                    Querying live telemetry &amp; cross-referencing sales history...
                  </p>
                </motion.div>
              )}

              {/* ANSWER DISPLAY */}
              {!isGenerating && answer && (
                <motion.div
                  key="answer"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-200/60">
                    <span className="font-semibold text-slate-600">AlaynAI Analysis Report</span>
                    <button
                      onClick={handleClear}
                      className="hover:text-slate-900 transition-colors font-medium"
                    >
                      Clear
                    </button>
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-200/80 p-7 sm:p-9 shadow-2xs">
                    <FormattedResponse text={answer} />
                  </div>

                  <div className="flex items-center justify-between pt-2 text-xs">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleCopy}
                        className="inline-flex items-center gap-1.5 font-semibold text-slate-600 hover:text-slate-900 transition-colors"
                      >
                        {isCopied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{isCopied ? "Copied" : "Copy"}</span>
                      </button>
                      <button
                        onClick={handleShare}
                        className="inline-flex items-center gap-1.5 font-semibold text-slate-600 hover:text-slate-900 transition-colors"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>Share</span>
                      </button>
                    </div>

                    <button
                      onClick={() => handleAsk(prompt)}
                      className="inline-flex items-center gap-1.5 font-semibold text-[#E5484D] hover:underline"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Re-run query</span>
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ERROR STATE */}
              {!isGenerating && error && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2"
                >
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}

              {/* SUGGESTED SHORTCUTS — EDITORIAL MINIMAL ROW LAYOUT */}
              {!isGenerating && !answer && (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  <div className="px-1 text-xs font-bold uppercase tracking-wider text-slate-400">
                    Suggested Analysis
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

          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
