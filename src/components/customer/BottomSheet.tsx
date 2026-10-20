"use client";

import React, { useEffect, useId, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

// iOS-style sheet curve: fast start, soft landing
const SHEET_EASE = [0.32, 0.72, 0, 1] as const;

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  /** Pinned below the scrolling content, e.g. the main action */
  footer?: React.ReactNode;
  /** Content shown above the title, e.g. a dish photo */
  media?: React.ReactNode;
  className?: string;
}

/**
 * A sheet that rises from the bottom on phones and sits centred as a dialog on larger screens.
 * Locks page scroll, closes on Escape or a tap outside, and returns focus to whatever opened it.
 */
export default function BottomSheet({ open, onClose, title, description, children, footer, media, className }: BottomSheetProps) {
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus({ preventScroll: true });

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = overflow;
      previouslyFocused?.focus?.({ preventScroll: true });
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
          <motion.div
            aria-hidden="true"
            className="absolute inset-0 bg-[#0B1220]/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={description ? descriptionId : undefined}
            tabIndex={-1}
            initial={{ y: "100%" }}
            animate={{ y: 0, transition: { duration: 0.4, ease: SHEET_EASE } }}
            exit={{ y: "100%", transition: { duration: 0.25, ease: SHEET_EASE } }}
            className={cn(
              "relative flex w-full max-h-[92dvh] flex-col overflow-hidden bg-white outline-none",
              "rounded-t-3xl shadow-[0_-12px_40px_-12px_rgba(11,18,32,0.25)]",
              "sm:max-w-lg sm:max-h-[min(88dvh,760px)] sm:rounded-3xl sm:shadow-[0_24px_64px_-16px_rgba(11,18,32,0.35)]",
              className
            )}
          >
            {/* Grab handle: tells phone users this is a sheet */}
            <div className="flex justify-center pt-2.5 sm:hidden" aria-hidden="true">
              <span className="h-1 w-10 rounded-full bg-zinc-300" />
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain">
              {media}
              <div className="flex items-start gap-3 px-5 pt-4 pb-1 sm:px-6 sm:pt-5">
                <div className="min-w-0 flex-1">
                  <h2 id={titleId} className="font-heading text-lg font-bold leading-snug text-(--espresso)">
                    {title}
                  </h2>
                  {description && (
                    <div id={descriptionId} className="mt-0.5 text-sm text-(--muted)">
                      {description}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close"
                  className="-mr-2 -mt-1 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--espresso)"
                >
                  <X className="h-5 w-5" strokeWidth={2} />
                </button>
              </div>
              <div className="px-5 pb-5 sm:px-6">{children}</div>
            </div>

            {footer && (
              <div className="border-t border-zinc-100 bg-white px-5 pt-3 pb-[max(0.875rem,env(safe-area-inset-bottom))] sm:px-6 sm:pb-5">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
