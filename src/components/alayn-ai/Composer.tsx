"use client";

import React, { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { BorderBeam } from "border-beam";
import { ArrowUp, Square } from "lucide-react";

interface ComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onStop: () => void;
  generating: boolean;
  disabled?: boolean;
  placeholder: string;
  reduceMotion: boolean;
}

export interface ComposerHandle {
  focus: () => void;
}

const MAX_HEIGHT = 200;
/** The glow needs a box to trace; this one never changes, so the glow never re-renders while typing */
const BEAM_SHAPE = <div className="h-full w-full rounded-2xl" />;

/**
 * The question box: grows with the text, Enter sends, Shift+Enter adds a line. While AlaynAI is
 * answering, the send button becomes Stop and a glow runs around the box.
 */
const Composer = forwardRef<ComposerHandle, ComposerProps>(function Composer(
  { value, onChange, onSend, onStop, generating, disabled, placeholder, reduceMotion },
  ref,
) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  useImperativeHandle(ref, () => ({ focus: () => textareaRef.current?.focus() }), []);

  // Fit the box to its text, up to MAX_HEIGHT, then scroll inside it
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT)}px`;
  }, [value]);

  const canSend = !!value.trim() && !generating && !disabled;

  return (
    <div className="relative">
      <div className="relative flex items-end gap-2 rounded-2xl border border-white/10 bg-[#141A24] p-2 transition-colors focus-within:border-white/25">
        <label htmlFor="alayn-ai-question" className="sr-only">
          Ask Alayn AI
        </label>
        <textarea
          id="alayn-ai-question"
          ref={textareaRef}
          rows={1}
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            // Enter sends; Shift+Enter is a new line; never interrupt an IME (Hindi/Tamil input) mid-word
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              if (canSend) onSend();
            }
          }}
          className="max-h-[200px] min-h-[44px] flex-1 resize-none bg-transparent px-3 py-2.5 text-base leading-6 text-slate-100 placeholder:text-slate-400 focus:outline-none disabled:opacity-60"
        />
        {generating ? (
          <button
            type="button"
            onClick={onStop}
            aria-label="Stop answering"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-[#0B0F17] transition-colors hover:bg-slate-200"
          >
            <Square className="h-4 w-4 fill-current" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onSend}
            disabled={!canSend}
            aria-label="Send question"
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors ${
              canSend ? "bg-[#E5484D] text-white hover:bg-[#EF5350]" : "bg-white/[0.06] text-slate-500 cursor-not-allowed"
            }`}
          >
            <ArrowUp className="h-5 w-5" />
          </button>
        )}
      </div>
      {/* The glow sits on its own layer over the box and ignores clicks. border-beam resets its
          state whenever its children change, so wrapping the textarea re-rendered it on every
          keystroke; fast typing then hit React's update limit and dropped letters. */}
      <BorderBeam
        active={generating && !reduceMotion}
        size="md"
        colorVariant="sunset"
        theme="dark"
        strength={0.7}
        className="pointer-events-none !absolute inset-0"
        style={{ position: "absolute" }}
        aria-hidden="true"
      >
        {BEAM_SHAPE}
      </BorderBeam>
    </div>
  );
});

export default Composer;
