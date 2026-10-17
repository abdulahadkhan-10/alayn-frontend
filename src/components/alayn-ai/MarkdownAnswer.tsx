"use client";

import React from "react";
import ReactMarkdown, { Components } from "react-markdown";
import remarkGfm from "remark-gfm";

/* Dark-theme styling for each Markdown element AlaynAI uses (lists, bold, short headings, tables) */
const components: Components = {
  p: ({ children }) => <p className="my-3 first:mt-0 last:mb-0 leading-7 text-slate-200">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
  em: ({ children }) => <em className="italic text-slate-200">{children}</em>,
  h1: ({ children }) => <h3 className="mt-6 mb-2 first:mt-0 text-base font-semibold text-white">{children}</h3>,
  h2: ({ children }) => <h3 className="mt-6 mb-2 first:mt-0 text-base font-semibold text-white">{children}</h3>,
  h3: ({ children }) => <h3 className="mt-5 mb-2 first:mt-0 text-[15px] font-semibold text-white">{children}</h3>,
  h4: ({ children }) => <h4 className="mt-4 mb-1.5 first:mt-0 text-sm font-semibold text-white">{children}</h4>,
  ul: ({ children }) => <ul className="my-3 space-y-1.5 pl-5 list-disc marker:text-slate-500">{children}</ul>,
  ol: ({ children }) => <ol className="my-3 space-y-1.5 pl-5 list-decimal marker:text-slate-400">{children}</ol>,
  li: ({ children }) => <li className="pl-1 leading-7 text-slate-200">{children}</li>,
  hr: () => <hr className="my-5 border-white/10" />,
  blockquote: ({ children }) => <blockquote className="my-3 border-l-2 border-white/15 pl-4 text-slate-300">{children}</blockquote>,
  a: ({ children, href }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-rose-300 underline underline-offset-2 hover:text-rose-200">
      {children}
    </a>
  ),
  code: ({ children }) => <code className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[13px] text-slate-100">{children}</code>,
  table: ({ children }) => (
    <div className="my-4 overflow-x-auto rounded-xl border border-white/10">
      <table className="w-full text-left text-sm tabular-nums">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-white/[0.04] text-slate-300">{children}</thead>,
  tbody: ({ children }) => <tbody className="divide-y divide-white/[0.06]">{children}</tbody>,
  th: ({ children }) => <th className="px-3.5 py-2.5 font-semibold whitespace-nowrap">{children}</th>,
  td: ({ children }) => <td className="px-3.5 py-2.5 align-top text-slate-200">{children}</td>,
};

/** An AlaynAI answer, rendered as Markdown (GitHub flavour, for tables). */
export default function MarkdownAnswer({ text }: { text: string }) {
  return (
    <div className="text-[15px] break-words">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {text}
      </ReactMarkdown>
    </div>
  );
}
