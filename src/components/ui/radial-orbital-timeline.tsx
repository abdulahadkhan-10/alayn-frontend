"use client";
import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { ArrowRight, Link, MousePointerClick } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface TimelineItem {
  id: number;
  title: string;
  date: string;
  content: string;
  category: string;
  icon: React.ElementType;
  relatedIds: number[];
  energy?: number;
}

export interface RadialOrbitalTimelineProps {
  timelineData: TimelineItem[];
}

export default function RadialOrbitalTimeline({
  timelineData,
}: RadialOrbitalTimelineProps) {
  const [expandedItems, setExpandedItems] = useState<Record<number, boolean>>({});
  const expandedItemsRef = useRef(expandedItems);
  useEffect(() => {
    expandedItemsRef.current = expandedItems;
  }, [expandedItems]);

  const [activeNodeId, setActiveNodeId] = useState<number | null>(null);
  const [pulseEffect, setPulseEffect] = useState<Record<number, boolean>>({});
  
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const autoRotateRef = useRef<boolean>(true);
  const isHoveredRef = useRef<boolean>(false);
  
  useEffect(() => {
    autoRotateRef.current = autoRotate;
  }, [autoRotate]);

  const rotationAngleRef = useRef<number>(0);
  const targetAngleRef = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const orbitRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const [radius, setRadius] = useState<number>(220);
  const radiusRef = useRef<number>(220);

  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      let r = 220;
      if (w < 400) {
        r = 115;
      } else if (w < 520) {
        r = 140;
      } else if (w < 640) {
        r = 165;
      } else if (w < 768) {
        r = 190;
      }
      setRadius(r);
      radiusRef.current = r;
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const centerOffset = { x: 0, y: 0 };

  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === containerRef.current || e.target === orbitRef.current) {
      setExpandedItems({});
      setActiveNodeId(null);
      setPulseEffect({});
      setAutoRotate(true);
      targetAngleRef.current = rotationAngleRef.current; // sync target so it doesn't jump
    }
  };

  const centerViewOnNode = (nodeId: number) => {
    const nodeIndex = timelineData.findIndex((item) => item.id === nodeId);
    const totalNodes = timelineData.length;
    const targetAngle = (nodeIndex / totalNodes) * 360;
    targetAngleRef.current = 270 - targetAngle;
  };

  const toggleItem = (id: number) => {
    setExpandedItems((prev) => {
      const newState = { ...prev };
      Object.keys(newState).forEach((key) => {
        if (parseInt(key) !== id) {
          newState[parseInt(key)] = false;
        }
      });

      newState[id] = !prev[id];

      if (newState[id]) {
        setActiveNodeId(id);
        setAutoRotate(false);

        const relatedItems = getRelatedItems(id);
        const newPulseEffect: Record<number, boolean> = {};
        relatedItems.forEach((relId) => {
          newPulseEffect[relId] = true;
        });
        setPulseEffect(newPulseEffect);

        centerViewOnNode(id);
      } else {
        setActiveNodeId(null);
        setAutoRotate(true);
        setPulseEffect({});
        targetAngleRef.current = rotationAngleRef.current;
      }

      return newState;
    });
  };

  const getRelatedItems = (itemId: number): number[] => {
    const currentItem = timelineData.find((item) => item.id === itemId);
    return currentItem ? currentItem.relatedIds : [];
  };

  const isRelatedToActive = (itemId: number): boolean => {
    if (!activeNodeId) return false;
    const relatedItems = getRelatedItems(activeNodeId);
    return relatedItems.includes(itemId);
  };

  const calculateNodePosition = (index: number, total: number, angleOffset: number) => {
    const angle = ((index / total) * 360 + angleOffset) % 360;
    const r = radiusRef.current;
    const radian = (angle * Math.PI) / 180;

    const x = r * Math.cos(radian) + centerOffset.x;
    const y = r * Math.sin(radian) + centerOffset.y;

    const zIndex = Math.round(100 + 50 * Math.cos(radian));
    const opacity = Math.max(
      0.45,
      Math.min(1, 0.45 + 0.55 * ((1 + Math.sin(radian)) / 2))
    );

    return { x, y, zIndex, opacity };
  };

  const updateNodesPositions = () => {
    timelineData.forEach((item, index) => {
      const el = nodeRefs.current[item.id];
      if (el) {
        const isExpanded = expandedItemsRef.current[item.id];
        const pos = calculateNodePosition(index, timelineData.length, rotationAngleRef.current);
        
        el.style.transform = `translate(${pos.x}px, ${pos.y}px) ${isExpanded ? 'scale(1.25)' : 'scale(1)'}`;
        el.style.zIndex = isExpanded ? "200" : pos.zIndex.toString();
        el.style.opacity = isExpanded ? "1" : pos.opacity.toString();
      }
    });
  };

  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();

    const animateLoop = (time: number) => {
      const deltaTime = time - lastTime;
      lastTime = time;

      if (autoRotateRef.current && !isHoveredRef.current) {
        // Slowed down to 0.005 degrees per ms (7x slower)
        targetAngleRef.current = (targetAngleRef.current + 0.010 * deltaTime) % 360;
        rotationAngleRef.current = targetAngleRef.current;
        updateNodesPositions();
      } else if (!autoRotateRef.current) {
        // Smoothly lerp to center node if clicked
        let diff = targetAngleRef.current - rotationAngleRef.current;
        diff = ((diff + 540) % 360) - 180;
        rotationAngleRef.current += diff * 0.08;
        rotationAngleRef.current = (rotationAngleRef.current + 360) % 360;
        updateNodesPositions();
      }

      animationFrameId = requestAnimationFrame(animateLoop);
    };

    animationFrameId = requestAnimationFrame(animateLoop);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  // Update positions initially and on data change or radius change
  useEffect(() => {
    updateNodesPositions();
  }, [timelineData, radius]);

  const hubDiameter = Math.min(160, Math.max(76, Math.round(radius * 0.72)));

  return (
    <div className="w-full">
      {/* MOBILE-NATIVE VIEW (< 768px): Clean Module Selector & Interactive Card */}
      <div className="block md:hidden bg-[#F4F5F8] rounded-2xl border border-slate-200/90 shadow-md p-4 sm:p-6">
        {/* Mini Central Alayn Hub Core for Mobile Header */}
        <div className="flex items-center justify-center gap-2.5 mb-4 py-2.5 px-4 bg-white/80 backdrop-blur-sm rounded-xl border border-slate-200/80 shadow-xs">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-white to-slate-100 border border-slate-300 flex items-center justify-center p-1 shadow-xs shrink-0">
            <Image
              src="/justlogo.png"
              alt="Alayn Logo"
              width={20}
              height={20}
              className="object-contain"
            />
          </div>
          <span className="text-xs font-bold text-slate-800 tracking-wide">
            Alayn Operational Matrix
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#C41E2A] bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200/60 ml-auto">
            7 Modules
          </span>
        </div>

        {/* Mobile Pills Flex-Wrap Grid (100% visible, no hidden scroll) */}
        <div className="flex flex-wrap items-center gap-2 mb-5">
          {timelineData.map((item) => {
            const isSelected = activeNodeId === item.id || (!activeNodeId && item.id === 1);
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveNodeId(item.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold transition-all min-h-[40px] ${
                  isSelected
                    ? "bg-[#C41E2A] text-white shadow-md shadow-rose-950/20 ring-2 ring-rose-300/40"
                    : "bg-white text-slate-700 border border-slate-200/90 hover:bg-slate-100"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.title}</span>
              </button>
            );
          })}
        </div>

        {/* Mobile Active Module Details Card */}
        {(() => {
          const activeId = activeNodeId || 1;
          const activeIndex = timelineData.findIndex((i) => i.id === activeId);
          const activeItem = timelineData[activeIndex] || timelineData[0];
          const Icon = activeItem.icon;

          const prevItem = timelineData[(activeIndex - 1 + timelineData.length) % timelineData.length];
          const nextItem = timelineData[(activeIndex + 1) % timelineData.length];

          return (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-rose-50 border border-rose-200/60 flex items-center justify-center text-[#C41E2A]">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-[#C41E2A] uppercase tracking-wider block">
                      {activeItem.category} • Module {activeIndex + 1} of {timelineData.length}
                    </span>
                    <h3 className="text-base font-bold text-[#1B2A4A]">
                      {activeItem.title} Module
                    </h3>
                  </div>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {activeItem.content}
              </p>

              {/* Connected Operational Nodes */}
              {activeItem.relatedIds.length > 0 && (
                <div className="pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-1.5 mb-2.5">
                    <Link size={12} className="text-slate-400" />
                    <h4 className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                      Connected Workflows
                    </h4>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {activeItem.relatedIds.map((relatedId) => {
                      const relatedItem = timelineData.find((i) => i.id === relatedId);
                      if (!relatedItem) return null;
                      return (
                        <button
                          key={relatedId}
                          onClick={() => setActiveNodeId(relatedId)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 bg-slate-50 text-slate-700 hover:bg-[#1B2A4A] hover:text-white transition-all min-h-[36px]"
                        >
                          <span>{relatedItem.title}</span>
                          <ArrowRight className="w-3 h-3 opacity-60" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Mobile Sequential Step Controls */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3 text-xs">
                <button
                  onClick={() => setActiveNodeId(prevItem.id)}
                  className="flex items-center gap-1 px-3 py-2 rounded-lg border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors min-h-[40px]"
                >
                  <span>←</span>
                  <span>{prevItem.title}</span>
                </button>

                <button
                  onClick={() => setActiveNodeId(nextItem.id)}
                  className="flex items-center gap-1 px-3 py-2 rounded-lg border border-slate-200 bg-slate-900 text-white font-semibold hover:bg-slate-800 transition-colors min-h-[40px]"
                >
                  <span>{nextItem.title}</span>
                  <span>→</span>
                </button>
              </div>
            </div>
          );
        })()}
      </div>

      {/* DESKTOP VIEW (>= 768px): 3D Radial Orbital Component */}
      <div
        className="hidden md:flex w-full h-[620px] flex-col items-center justify-center bg-[#F4F5F8] rounded-2xl overflow-hidden relative border border-slate-200/80 shadow-inner"
        ref={containerRef}
        onClick={handleContainerClick}
      >
        

        <div className="relative w-full max-w-5xl h-full flex items-center justify-center">
          <div
            className="absolute w-full h-full flex items-center justify-center"
            ref={orbitRef}
            style={{
              perspective: "1000px",
              transform: `translate(${centerOffset.x}px, ${centerOffset.y}px)`,
            }}
          >
            {/* Interactive Circle Hover Target */}
            <div
              className="absolute rounded-full z-0 pointer-events-auto"
              style={{ width: `${radius * 2 + 40}px`, height: `${radius * 2 + 40}px` }}
              onMouseEnter={() => {
                isHoveredRef.current = true;
              }}
              onMouseLeave={() => {
                isHoveredRef.current = false;
              }}
            />

            {/* Scaled Central Hub Core with Logo */}
            <div
              className="absolute rounded-full bg-gradient-to-br from-white via-slate-50 to-slate-200 shadow-2xl flex items-center justify-center z-10 border border-slate-300 p-4"
              style={{ width: `${hubDiameter}px`, height: `${hubDiameter}px` }}
            >
              <div
                className="absolute rounded-full border border-slate-300/60 animate-ping opacity-60"
                style={{ width: `${hubDiameter + 16}px`, height: `${hubDiameter + 16}px` }}
              />
              <Image
                src="/justlogo.png"
                alt="Alayn Logo"
                width={80}
                height={80}
                className="object-contain filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.1)] transition-transform duration-300 hover:scale-105"
                priority
              />
            </div>

            {/* Orbit Line */}
            <div
              className="absolute rounded-full border border-slate-300/80 shadow-sm pointer-events-none"
              style={{ width: `${radius * 2}px`, height: `${radius * 2}px` }}
            />

            {timelineData.map((item) => {
              const isExpanded = expandedItems[item.id];
              const isRelated = isRelatedToActive(item.id);
              const isPulsing = pulseEffect[item.id];
              const Icon = item.icon;
              const energyVal = item.energy || 90;

              return (
                <div
                  key={item.id}
                  ref={(el) => {
                    nodeRefs.current[item.id] = el;
                  }}
                  title={`Click to inspect ${item.title} module details`}
                  className="absolute transition-colors duration-300 cursor-pointer group pointer-events-auto"
                  onMouseEnter={() => {
                    isHoveredRef.current = true;
                  }}
                  onMouseLeave={() => {
                    isHoveredRef.current = false;
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleItem(item.id);
                  }}
                >
                  {/* Energy Aura behind Node */}
                  <div
                    className={`absolute rounded-full -inset-1 transition-opacity duration-300 ${
                      isPulsing ? "animate-pulse duration-1000" : ""
                    }`}
                    style={{
                      background: isExpanded
                        ? `radial-gradient(circle, rgba(196,30,42,0.2) 0%, rgba(196,30,42,0) 70%)`
                        : isRelated
                        ? `radial-gradient(circle, rgba(217,119,6,0.25) 0%, rgba(217,119,6,0) 70%)`
                        : `radial-gradient(circle, rgba(27,42,74,0.08) 0%, rgba(27,42,74,0) 70%)`,
                      width: `${energyVal * 0.5 + 44}px`,
                      height: `${energyVal * 0.5 + 44}px`,
                      left: `-${(energyVal * 0.5 + 44 - 44) / 2}px`,
                      top: `-${(energyVal * 0.5 + 44 - 44) / 2}px`,
                    }}
                  />

                  {/* Node Pill Icon */}
                  <div
                    className={`
                    w-11 h-11 rounded-full flex items-center justify-center
                    group-hover:ring-4 group-hover:ring-[#C41E2A]/25 group-hover:scale-110
                    ${
                      isExpanded
                        ? "bg-[#C41E2A] text-white"
                        : isRelated
                        ? "bg-amber-500 text-white"
                        : "bg-white text-[#1B2A4A] hover:bg-slate-50"
                    }
                    border-2 
                    ${
                      isExpanded
                        ? "border-[#C41E2A] shadow-lg shadow-rose-900/20"
                        : isRelated
                        ? "border-amber-400 animate-pulse"
                        : "border-slate-200/90 shadow-sm"
                    }
                    transition-all duration-300
                  `}
                  >
                    <Icon size={18} />
                  </div>

                  {/* Node Title Label */}
                  <div
                    className={`
                    absolute top-13 left-1/2 -translate-x-1/2 whitespace-nowrap
                    text-xs font-bold tracking-wide
                    transition-colors duration-300
                    ${isExpanded ? "text-[#C41E2A]" : "text-[#1B2A4A]"}
                  `}
                  >
                    {item.title}
                  </div>

                  {/* Expanded Card Details */}
                  {isExpanded && (
                    <Card className="absolute top-20 left-1/2 -translate-x-1/2 w-72 bg-white/95 backdrop-blur-md border-slate-200 shadow-2xl shadow-slate-900/10 overflow-visible text-slate-800">
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-px h-3 bg-slate-300"></div>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-center">
                          <span className="text-[11px] font-bold text-[#C41E2A] uppercase tracking-wider">
                            {item.category}
                          </span>
                          <span className="text-xs font-medium text-slate-400">
                            {item.date}
                          </span>
                        </div>
                        <CardTitle className="text-base font-bold mt-1 text-[#1B2A4A]">
                          {item.title} Module
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="text-xs text-slate-600">
                        <p className="leading-relaxed">{item.content}</p>

                        {/* Connected Nodes */}
                        {item.relatedIds.length > 0 && (
                          <div className="mt-4 pt-3 border-t border-slate-100">
                            <div className="flex items-center mb-2">
                              <Link size={11} className="text-slate-400 mr-1" />
                              <h4 className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                                Connected Operational Nodes
                              </h4>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {item.relatedIds.map((relatedId) => {
                                const relatedItem = timelineData.find(
                                  (i) => i.id === relatedId
                                );
                                return (
                                  <Button
                                    key={relatedId}
                                    variant="outline"
                                    size="sm"
                                    className="flex items-center h-6 px-2 text-[11px] rounded-md border-slate-200 bg-slate-50 text-slate-700 hover:bg-[#1B2A4A] hover:text-white hover:border-[#1B2A4A] transition-all"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleItem(relatedId);
                                    }}
                                  >
                                    {relatedItem?.title}
                                    <ArrowRight
                                      size={10}
                                      className="ml-1 opacity-70"
                                    />
                                  </Button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

