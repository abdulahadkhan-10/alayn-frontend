"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useInView, type Variants, type Transition } from "framer-motion";
import { introHoldSeconds } from "../introTiming";

/** Shared spring — "expensive, weighted, calm." Used everywhere instead of ease-out fades. */
export const springSettle: Transition = { type: "spring", stiffness: 140, damping: 22, mass: 1 };
export const springSnappy: Transition = { type: "spring", stiffness: 320, damping: 24, mass: 0.6 };

/**
 * Assemble-in-place reveal: elements arrive with weight (spring translate + slight
 * scale + soft blur-to-focus), not a plain opacity fade. Staggers children when used
 * with `stagger`. On the first load of a session the delay also covers whatever
 * is left of the logo reveal; it's read when the animation starts, so elements
 * revealed later by scrolling don't wait.
 */
const assembleVariants: Variants = {
  hidden: { opacity: 0, y: 26, scale: 0.98 },
  visible: (delay: number = 0) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { ...springSettle, delay: delay + introHoldSeconds() },
  }),
};

// Same motion without the fade. The server HTML renders the element at
// opacity 0 until JavaScript animates it in, so on a slow phone the hero
// heading — the page's largest paint — waited for hydration. Starting fully
// opaque lets it paint immediately while the slide still plays.
const assembleVisibleVariants: Variants = {
  hidden: { opacity: 1, y: 26, scale: 0.98 },
  visible: assembleVariants.visible,
};

export function Assemble({
  children,
  delay = 0,
  className = "",
  as = "div",
  once = true,
  style,
  id,
  visibleOnLoad = false,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  as?: keyof typeof motion;
  once?: boolean;
  style?: React.CSSProperties;
  id?: string;
  /** Paint immediately and only slide in; use for above-the-fold LCP text. */
  visibleOnLoad?: boolean;
}) {
  const Component = motion[as] as typeof motion.div;
  return (
    <Component
      id={id}
      className={className}
      style={style}
      variants={visibleOnLoad ? assembleVisibleVariants : assembleVariants}
      custom={delay}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount: 0.2, margin: "-40px" }}
    >
      {children}
    </Component>
  );
}

/** Parent wrapper that staggers Assemble children by `gap` seconds. */
export function AssembleGroup({
  children,
  className = "",
  gap = 0.08,
  once = true,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  gap?: number;
  once?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <motion.div
      className={className}
      style={style}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount: 0.2, margin: "-40px" }}
      variants={{ visible: { transition: { staggerChildren: gap } } }}
    >
      {children}
    </motion.div>
  );
}

export function AssembleItem({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div className={className} variants={assembleVariants}>
      {children}
    </motion.div>
  );
}

/** Magnetic pull toward the cursor, with a spring snap-back on leave. */
export function useMagnetic(strength = 0.35) {
  const ref = useRef<HTMLElement>(null);
  const x = useSpring(0, springSnappy);
  const y = useSpring(0, springSnappy);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const relX = e.clientX - (rect.left + rect.width / 2);
      const relY = e.clientY - (rect.top + rect.height / 2);
      x.set(relX * strength);
      y.set(relY * strength);
    };
    const onLeave = () => {
      x.set(0);
      y.set(0);
    };

    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, [strength, x, y]);

  return { ref, x, y };
}

/** Smooth, spring-driven number transition — for "quietly updating" metrics. */
export function useCountUp(target: number, { decimals = 0, active = true }: { decimals?: number; active?: boolean } = {}) {
  const motionVal = useMotionValue(target);
  const spring = useSpring(motionVal, { stiffness: 90, damping: 20, mass: 1 });
  const [display, setDisplay] = useState(target.toFixed(decimals));

  useEffect(() => {
    if (active) motionVal.set(target);
  }, [target, active, motionVal]);

  useEffect(() => {
    const unsub = spring.on("change", (v) => setDisplay(v.toFixed(decimals)));
    return unsub;
  }, [spring, decimals]);

  return display;
}

/** Cursor-aware tilt for cards — subtle, physical response to hover position. */
export function useTilt(max = 6) {
  const ref = useRef<HTMLDivElement>(null);
  const rotateX = useSpring(0, springSnappy);
  const rotateY = useSpring(0, springSnappy);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      rotateY.set(px * max);
      rotateX.set(-py * max);
    };
    const onLeave = () => {
      rotateX.set(0);
      rotateY.set(0);
    };

    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, [max, rotateX, rotateY]);

  return { ref, rotateX, rotateY };
}

export function useInViewOnce<T extends HTMLElement>(amount = 0.3) {
  const ref = useRef<T>(null);
  const inView = useInView(ref, { once: true, amount });
  return { ref, inView };
}
