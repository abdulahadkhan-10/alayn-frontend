"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useOpenTransition } from "@/lib/useOpenTransition";

const MODAL_TIMING = { openVar: "--modal-open-dur", closeVar: "--modal-close-dur" };

/**
 * Drives the transitions.dev modal (`.t-modal` in styles/transitions.css).
 * Render on `mounted` instead of `isOpen` and put `stateClass` on the panel + backdrop.
 */
export function useModalTransition(isOpen: boolean) {
  return useOpenTransition(isOpen, MODAL_TIMING);
}

interface TModalProps {
  open: boolean;
  onClose?: () => void;
  /** Classes for the full-screen overlay (positioning, backdrop colour, padding). */
  className?: string;
  children: ReactNode;
}

/**
 * Overlay + animated panel wrapper for modals whose parent controls mounting.
 * The last open children are kept on screen during the close animation, so the
 * parent can clear the data the modal reads (e.g. a selected row) immediately.
 */
export function TModal({ open, onClose, className, children }: TModalProps) {
  const { mounted, stateClass } = useModalTransition(open);
  const [shownChildren, setShownChildren] = useState(children);

  if (open && children !== shownChildren) setShownChildren(children);

  if (!mounted) return null;

  return (
    <div
      className={cn("t-modal-backdrop fixed inset-0 z-50 flex items-center justify-center", stateClass, className)}
      onClick={onClose}
    >
      <div
        className={cn("t-modal flex w-full justify-center", stateClass)}
        onClick={(e) => e.stopPropagation()}
      >
        {open ? children : shownChildren}
      </div>
    </div>
  );
}
