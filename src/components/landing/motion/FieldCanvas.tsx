"use client";

import { useEffect, useRef } from "react";
import { DEFAULT_NODES, type FieldNode, type FieldTarget } from "./GlobalField";

const NAVY = "27, 42, 74";
const CRIMSON = "196, 30, 42";

/**
 * The actual canvas + rAF draw loop, split out so it can be loaded with
 * next/dynamic({ ssr: false }) — it's pure decoration (aria-hidden, touches
 * window/canvas immediately) with zero SEO value, so there's no reason to
 * pay for it during SSR or block hydration of the real page content on it.
 */
export default function FieldCanvas({
  targetsRef,
  nodesOverrideRef,
}: {
  targetsRef: React.RefObject<Map<string, { target: FieldTarget; weight: number }>>;
  nodesOverrideRef: React.RefObject<FieldNode[] | null>;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const currentRef = useRef<FieldTarget>({ chaos: 0.55, sync: 0, presence: 0.7 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let routes: {
      a: FieldNode;
      b: { x: number; y: number };
      ctrlOx: number;
      ctrlOy: number;
      driftSpeed: number;
      driftPhase: number;
      dropPhase: number;
      dropSpeed: number;
    }[] = [];

    const buildRoutes = (nodes: FieldNode[]) => {
      routes = nodes.map((n, i) => ({
        a: n,
        b: { x: 0.5, y: 0.46 },
        ctrlOx: (Math.random() - 0.5) * 0.22,
        ctrlOy: (Math.random() - 0.5) * 0.22,
        driftSpeed: 0.00022 + (i % 3) * 0.00008,
        driftPhase: (i / nodes.length) * Math.PI * 2,
        dropPhase: Math.random() * Math.PI * 2,
        dropSpeed: 0.0004 + Math.random() * 0.0005,
      }));
    };
    buildRoutes(DEFAULT_NODES);

    let W = window.innerWidth;
    let H = window.innerHeight;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    let raf = 0;
    let startTs = 0;

    let wasCleared = false;

    const draw = (time: number) => {
      let wSum = 0;
      let chaos = 0;
      let sync = 0;
      let presence = 0;
      targetsRef.current.forEach(({ target, weight }) => {
        wSum += weight;
        chaos += target.chaos * weight;
        sync += target.sync * weight;
        presence += target.presence * weight;
      });
      const blended: FieldTarget =
        wSum > 0.001
          ? { chaos: chaos / wSum, sync: sync / wSum, presence: presence / wSum }
          : { chaos: currentRef.current.chaos, sync: currentRef.current.sync, presence: 0 };

      const cur = currentRef.current;
      const ease = 0.045;
      cur.chaos += (blended.chaos - cur.chaos) * ease;
      cur.sync += (blended.sync - cur.sync) * ease;
      cur.presence += (blended.presence - cur.presence) * ease;

      if (wSum === 0 && cur.presence < 0.005) {
        if (!wasCleared) {
          ctx.clearRect(0, 0, W, H);
          wasCleared = true;
        }
        raf = requestAnimationFrame(draw);
        return;
      }
      wasCleared = false;
      ctx.clearRect(0, 0, W, H);

      const activeNodes = nodesOverrideRef.current ?? DEFAULT_NODES;
      if (routes.length === 0 || routes[0].a.id !== activeNodes[0]?.id) buildRoutes(activeNodes);

      routes.forEach((r, i) => {
        const node = activeNodes[i] ?? r.a;
        const ax = node.x * W;
        const ay = node.y * H;
        const bx = r.b.x * W;
        const by = r.b.y * H;

        const driftX = Math.sin(time * r.driftSpeed + r.driftPhase) * 22;
        const driftY = Math.cos(time * r.driftSpeed * 0.8 + r.driftPhase) * 16;
        const cx = (ax + bx) / 2 + r.ctrlOx * W + driftX;
        const cy = (ay + by) / 2 + r.ctrlOy * H + driftY;

        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.quadraticCurveTo(cx, cy, bx, by);

        const drop = Math.sin(time * r.dropSpeed + r.dropPhase);
        const chaosDrop = cur.chaos > 0.05 ? (drop > 0.5 ? 1 - cur.chaos * 0.85 : 1) : 1;
        const baseAlpha = (0.16 + cur.sync * 0.28) * chaosDrop * cur.presence;
        const mixColor = cur.sync > 0.5 || cur.chaos > 0.5 ? CRIMSON : NAVY;
        ctx.strokeStyle = `rgba(${mixColor},${Math.max(0, baseAlpha)})`;
        ctx.lineWidth = 1;
        ctx.lineCap = "round";
        ctx.stroke();

        const speed = 0.00014 + cur.sync * 0.00008;
        let t = (time * speed + r.driftPhase * 0.1) % 1;
        if (cur.chaos > 0.3) {
          const jitter = Math.sin(time * 0.01 + i) * cur.chaos * 0.15;
          t = Math.min(1, Math.max(0, t + jitter));
        }
        const mt = 1 - t;
        const px = mt * mt * ax + 2 * mt * t * cx + t * t * bx;
        const py = mt * mt * ay + 2 * mt * t * cy + t * t * by;
        const fade = Math.sin(t * Math.PI);
        ctx.beginPath();
        ctx.arc(px, py, 1.6 + cur.sync * 0.6, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${mixColor},${fade * (0.55 + cur.sync * 0.35) * cur.presence})`;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(ax, ay, 2.2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${mixColor},${(0.35 + cur.sync * 0.25) * cur.presence})`;
        ctx.fill();
      });

      raf = requestAnimationFrame(draw);
    };

    const start = (ts: number) => {
      if (!startTs) startTs = ts;
      draw(ts - startTs);
    };

    resize();
    window.addEventListener("resize", resize);

    if (prefersReduced) {
      draw(6000);
    } else {
      raf = requestAnimationFrame(start);
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        cancelAnimationFrame(raf);
      } else if (!prefersReduced) {
        raf = requestAnimationFrame(start);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        pointerEvents: "none",
        zIndex: 0,
        willChange: "transform",
        transform: "translateZ(0)",
      }}
    />
  );
}
