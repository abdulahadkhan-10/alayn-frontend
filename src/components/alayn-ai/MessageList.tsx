"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { ThinkingOrb } from "thinking-orbs";
import { AlertTriangle, Check, CheckCircle2, Copy, RotateCcw, Share2 } from "lucide-react";
import { AlaynAITopic } from "@/lib/api";
import MarkdownAnswer from "./MarkdownAnswer";
import { TOPIC_LABELS } from "./topics";

export interface ChatTurn {
  id: string;
  question: string;
  answer: string;
  topics: AlaynAITopic[];
  status: "streaming" | "done" | "stopped" | "error";
  askedAt?: string; // ISO; saved turns only
  error?: string;
}

interface MessageListProps {
  turns: ChatTurn[];
  copiedId: string | null;
  onCopy: (turn: ChatTurn) => void;
  onShare: (turn: ChatTurn) => void;
  onRetry: (turn: ChatTurn) => void;
  followUps: string[];
  onFollowUp: (q: string) => void;
  reduceMotion: boolean;
}

/** While AlaynAI works: what it is checking, ticked off as soon as the data is in. */
function ThinkingSteps({ topics }: { topics: AlaynAITopic[] }) {
  return (
    <div className="flex items-start gap-3" role="status" aria-live="polite">
      <ThinkingOrb state="searching" size={32} theme="dark" color="#F87171" aria-hidden="true" />
      <div className="pt-1">
        <p className="text-sm text-slate-300">{topics.length ? "Writing the answer…" : "Checking your numbers…"}</p>
        {topics.length > 0 && (
          <ul className="mt-2 space-y-1">
            {topics.map((t) => (
              <li key={t} className="flex items-center gap-2 text-xs text-slate-400">
                <Check className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
                Checked {TOPIC_LABELS[t].toLowerCase()}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

const ACTION = "inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-white";

export default function MessageList({ turns, copiedId, onCopy, onShare, onRetry, followUps, onFollowUp, reduceMotion }: MessageListProps) {
  const enter = reduceMotion ? {} : { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] as const } };

  return (
    <ol className="space-y-8">
      {turns.map((turn, idx) => {
        const isLast = idx === turns.length - 1;
        const waiting = turn.status === "streaming" && !turn.answer;
        return (
          <li key={turn.id} className="space-y-4">
            {/* The owner's question, on the right */}
            <motion.div {...enter} className="flex justify-end">
              <p className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-white/[0.07] px-4 py-2.5 text-[15px] leading-6 text-slate-100">
                {turn.question}
              </p>
            </motion.div>

            {/* AlaynAI's answer, full width */}
            <motion.div {...enter} className="flex gap-3">
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white" aria-hidden="true">
                <Image src="/justlogo.png" alt="" width={16} height={16} />
              </span>
              <div className="min-w-0 flex-1">
                {waiting ? (
                  <ThinkingSteps topics={turn.topics} />
                ) : (
                  <>
                    {turn.answer && <MarkdownAnswer text={turn.answer} />}
                    {turn.status === "streaming" && (
                      <span className="ml-0.5 inline-block h-4 w-2 translate-y-0.5 animate-pulse rounded-sm bg-slate-300" aria-hidden="true" />
                    )}
                    {turn.status === "stopped" && <p className="mt-2 text-xs text-slate-400">Stopped.</p>}
                    {turn.status === "error" && (
                      <p className="mt-2 flex items-center gap-2 text-sm text-rose-300">
                        <AlertTriangle className="h-4 w-4 shrink-0" />
                        {turn.error}
                      </p>
                    )}
                  </>
                )}

                {turn.status !== "streaming" && (
                  <div className="mt-3 flex flex-wrap items-center gap-1">
                    {turn.answer && (
                      <>
                        <button type="button" onClick={() => onCopy(turn)} className={ACTION}>
                          {copiedId === turn.id ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                          {copiedId === turn.id ? "Copied" : "Copy"}
                        </button>
                        <button type="button" onClick={() => onShare(turn)} className={ACTION}>
                          <Share2 className="h-3.5 w-3.5" />
                          Share
                        </button>
                      </>
                    )}
                    {isLast && (
                      <button type="button" onClick={() => onRetry(turn)} className={ACTION}>
                        <RotateCcw className="h-3.5 w-3.5" />
                        Ask again
                      </button>
                    )}
                    {turn.topics.length > 0 && turn.status === "done" && (
                      <span className="ml-auto text-xs text-slate-400">
                        Checked: {turn.topics.map((t) => TOPIC_LABELS[t]).join(" · ")}
                      </span>
                    )}
                  </div>
                )}

                {/* Suggested next questions, under the newest finished answer only */}
                {isLast && turn.status === "done" && followUps.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {followUps.map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => onFollowUp(q)}
                        className="rounded-full border border-white/10 px-3.5 py-1.5 text-sm text-slate-200 transition-colors hover:border-white/25 hover:bg-white/[0.04]"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </li>
        );
      })}
    </ol>
  );
}
