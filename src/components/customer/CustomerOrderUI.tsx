"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Utensils,
  Search,
  AlertCircle,
  Leaf,
  X,
  ChevronRight,
  Info
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  fetchTableMenu,
  CustomerMenuCategory,
  resolveUploadUrl,
} from "@/lib/api";

export default function CustomerOrderUI({ token }: { token: string }) {
  const [categories, setCategories] = useState<CustomerMenuCategory[]>([]);
  const [businessName, setBusinessName] = useState("Alayn Dining");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [dietaryFilter, setDietaryFilter] = useState<"ALL" | "VEG" | "NON_VEG" | "VEGAN">("ALL");
  
  // Mobile category overlay bottom sheet
  const [isCategorySheetOpen, setIsCategorySheetOpen] = useState(false);

  // Image lightbox
  const [lightboxImage, setLightboxImage] = useState<{ url: string; name: string } | null>(null);

  // Scroll spy refs
  const isScrollingRef = useRef(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadMenu() {
      if (!token) {
        setError("Invalid or missing table QR code token.");
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      const res = await fetchTableMenu(token);
      if (res.ok && res.categories) {
        setCategories(res.categories);
        if (res.businessName) setBusinessName(res.businessName);
        if (res.categories.length > 0) {
          setSelectedCategory(res.categories[0].id); // Select first category by default instead of ALL
        }
      } else {
        setError(res.error || "Failed to load table menu. Token may be invalid or expired.");
      }
      setLoading(false);
    }

    loadMenu();
  }, [token]);

  // Dynamically detect available dietary types in table categories
  const { hasVegItems, hasNonVegItems, hasVeganItems } = useMemo(() => {
    let veg = false;
    let nonVeg = false;
    let vegan = false;
    categories.forEach((cat) => {
      cat.menuItems?.forEach((item) => {
        const dType = item.dietaryType || (item.isVeg ? "VEG" : "NON_VEG");
        if (dType === "VEGAN") vegan = true;
        else if (dType === "NON_VEG") nonVeg = true;
        else veg = true;
      });
    });
    return { hasVegItems: veg, hasNonVegItems: nonVeg, hasVeganItems: vegan };
  }, [categories]);

  // Flattened & filtered items
  const displayCategories = useMemo(() => {
    return categories
      .map((cat) => {
        const filteredItems = cat.menuItems.filter((item) => {
          const itemDietary = item.dietaryType || (item.isVeg ? "VEG" : "NON_VEG");
          if (dietaryFilter === "VEG" && itemDietary !== "VEG") return false;
          if (dietaryFilter === "NON_VEG" && itemDietary !== "NON_VEG") return false;
          if (dietaryFilter === "VEGAN" && itemDietary !== "VEGAN") return false;

          if (search.trim()) {
            const query = search.toLowerCase();
            return (
              item.name.toLowerCase().includes(query) ||
              item.description.toLowerCase().includes(query)
            );
          }
          return true;
        });
        return { ...cat, menuItems: filteredItems };
      })
      .filter((cat) => cat.menuItems.length > 0);
  }, [categories, search, dietaryFilter]);

  // If search is active, we show all matching categories
  const isSearchActive = search.trim().length > 0;
  
  const activeCategoryData = displayCategories;

  // Scroll to category function
  const scrollToCategory = (categoryId: string) => {
    setSelectedCategory(categoryId);
    isScrollingRef.current = true;
    const element = document.getElementById(`category-${categoryId}`);
    if (element) {
      // scroll-mt offset accounts for sticky headers
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      setTimeout(() => {
        isScrollingRef.current = false;
      }, 800);
    } else {
      isScrollingRef.current = false;
    }
  };

  // Scroll Spy Hook
  useEffect(() => {
    const handleScroll = () => {
      if (isScrollingRef.current || isSearchActive) return;
      const container = scrollContainerRef.current;
      if (!container) return;

      const containerTop = container.getBoundingClientRect().top;
      let activeId = selectedCategory;

      displayCategories.forEach((cat) => {
        const el = document.getElementById(`category-${cat.id}`);
        if (el) {
          const rect = el.getBoundingClientRect();
          // If the category header has crossed the top scroll offset (e.g. 100px)
          if (rect.top - containerTop < 100 && rect.bottom - containerTop > 10) {
            activeId = cat.id;
          }
        }
      });

      if (activeId !== selectedCategory) {
        setSelectedCategory(activeId);
      }
    };

    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
    }
    return () => {
      if (container) {
        container.removeEventListener("scroll", handleScroll);
      }
    };
  }, [displayCategories, selectedCategory, isSearchActive]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col pt-12 items-center px-6">
        <div className="w-full max-w-md space-y-4">
          <div className="h-12 bg-gray-200 rounded-xl animate-pulse" />
          <div className="flex gap-4">
             <div className="w-1/3 space-y-3 pt-4">
                <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
                <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse" />
                <div className="h-4 bg-gray-200 rounded w-4/6 animate-pulse" />
             </div>
             <div className="w-2/3 space-y-4 pt-4">
                <div className="h-24 bg-gray-200 rounded-2xl animate-pulse" />
                <div className="h-24 bg-gray-200 rounded-2xl animate-pulse" />
                <div className="h-24 bg-gray-200 rounded-2xl animate-pulse" />
             </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="p-4 rounded-full bg-red-50 text-red-500 mb-4 shadow-sm border border-red-100">
          <AlertCircle className="h-10 w-10" />
        </div>
        <h2 className="text-2xl font-bold text-zinc-900 mb-2 tracking-tight">Oops!</h2>
        <p className="text-gray-500 text-sm max-w-sm mb-6">{error}</p>
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
          Please ask restaurant staff for assistance.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] h-[100dvh] bg-zinc-50 flex flex-col overflow-hidden text-zinc-900 font-sans antialiased selection:bg-zinc-200">
      
      {/* ── Unified Sticky Header Wrapper ── */}
      <div className="sticky top-0 z-40 w-full shrink-0 flex flex-col">
        {/* ── Premium Header ── */}
        <header className="bg-white/70 backdrop-blur-xl border-b border-zinc-200/50 px-4 py-3">
          <div className="flex items-center justify-between max-w-4xl mx-auto w-full">
            <div className="flex items-center gap-2.5">
              <img src="/justlogo.png" alt="Alayn Logo" className="h-7 w-7 object-contain drop-shadow-sm" />
              <div>
                <h1 className="text-lg font-bold text-zinc-900 leading-none tracking-tight">
                  {businessName} <span className="font-medium text-zinc-500">Dining</span>
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-1.5 bg-zinc-100/80 px-2.5 py-1 rounded-full border border-zinc-200">
               <Info className="w-3.5 h-3.5 text-zinc-500" />
               <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider">View Only</span>
            </div>
          </div>
        </header>

        {/* ── Search & Filters Bar ── */}
        <div className="bg-white/70 backdrop-blur-xl border-b border-zinc-200/50 px-3 py-3 shadow-sm">
          <div className="max-w-4xl mx-auto w-full flex flex-col gap-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search dishes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2 text-sm font-medium text-[#1B2A4A] placeholder-gray-400 focus:outline-none focus:border-[#1B2A4A] focus:ring-1 focus:ring-[#1B2A4A] transition-all"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {(hasNonVegItems || hasVeganItems) && (
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-0.5">
              <button
                onClick={() => setDietaryFilter("ALL")}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap active:scale-[0.98]",
                  dietaryFilter === "ALL"
                    ? "bg-zinc-900 text-white shadow-sm"
                    : "bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50"
                )}
              >
                All
              </button>
              {hasVegItems && (
                <button
                  onClick={() => setDietaryFilter("VEG")}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap active:scale-[0.98]",
                    dietaryFilter === "VEG"
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50"
                  )}
                >
                  <span className={cn("w-1.5 h-1.5 rounded-full", dietaryFilter === "VEG" ? "bg-white" : "bg-emerald-500")} />
                  Veg
                </button>
              )}
              {hasNonVegItems && (
                <button
                  onClick={() => setDietaryFilter("NON_VEG")}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap active:scale-[0.98]",
                    dietaryFilter === "NON_VEG"
                      ? "bg-rose-600 text-white shadow-sm"
                      : "bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50"
                  )}
                >
                  <span className={cn("w-1.5 h-1.5 rounded-full", dietaryFilter === "NON_VEG" ? "bg-white" : "bg-rose-500")} />
                  Non-Veg
                </button>
              )}
              {hasVeganItems && (
                <button
                  onClick={() => setDietaryFilter("VEGAN")}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap active:scale-[0.98]",
                    dietaryFilter === "VEGAN"
                      ? "bg-teal-600 text-white shadow-sm"
                      : "bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50"
                  )}
                >
                  <Leaf className="w-3 h-3" />
                  Vegan
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>

      {/* ── Dual-Scroll Main Area ── */}
      <main className="flex flex-1 overflow-hidden max-w-4xl mx-auto w-full">
        
        {/* Left Sidebar: Categories (Desktop/Tablet Only, Hidden if searching) */}
        {!isSearchActive && (
          <aside className="hidden md:flex md:w-[130px] shrink-0 bg-gray-50/50 border-r border-gray-100 flex-col overflow-y-auto scrollbar-none py-3">
            {displayCategories.map((cat) => {
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => scrollToCategory(cat.id)}
                  className={cn(
                    "w-full flex flex-col items-center justify-center py-4.5 px-3 gap-1.5 transition-colors text-center relative",
                    isActive ? "bg-white" : "hover:bg-zinc-100"
                  )}
                >
                  {isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-zinc-900 rounded-r-md" />
                  )}
                  <span className={cn(
                    "text-xs leading-tight transition-all",
                    isActive ? "font-bold text-zinc-900" : "font-semibold text-zinc-500"
                  )}>
                    {cat.name}
                  </span>
                </button>
              );
            })}
          </aside>
        )}

        {/* Right Content Area: Items */}
        <section 
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto bg-gray-50/30 px-3 py-4 sm:p-5 scrollbar-none scroll-smooth"
        >
          {activeCategoryData.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-4">
              <Utensils className="h-10 w-10 text-gray-200 mb-3" />
              <p className="text-sm font-bold text-gray-400">No items found</p>
            </div>
          ) : (
            <div className="space-y-10 pb-24">
              {activeCategoryData.map((cat) => (
                <div key={cat.id} id={`category-${cat.id}`} className="scroll-mt-32 md:scroll-mt-12">
                  <div className="sticky top-0 z-20 bg-zinc-50/95 backdrop-blur-md py-2 mb-2 border-b border-zinc-200/50 flex items-center gap-2">
                    <h2 className="text-sm font-bold text-zinc-900 tracking-wide uppercase">
                      {cat.name}
                    </h2>
                    <span className="text-[10px] font-bold text-zinc-400 bg-zinc-200/50 px-1.5 py-0.5 rounded">
                      {cat.menuItems.length}
                    </span>
                  </div>

                  <div className="flex flex-col">
                    {cat.menuItems.map((item) => {
                      const priceRupees = (item.pricePaise / 100).toFixed(2);
                      const imgUrl = resolveUploadUrl(item.imageUrl);
                      const dType = item.dietaryType || (item.isVeg ? "VEG" : "NON_VEG");

                      return (
                        <div
                          key={item.id}
                          className="group relative bg-transparent py-4 border-b border-zinc-200/60 last:border-0 flex gap-4 active:scale-[0.99] transition-transform cursor-pointer"
                          onClick={() => imgUrl && setLightboxImage({ url: imgUrl, name: item.name })}
                        >
                          {/* Info Side */}
                          <div className="flex-1 flex flex-col min-w-0 justify-between">
                            <div>
                              <div className="flex items-start gap-1.5 mb-1">
                                  <span
                                    className={cn(
                                      "mt-[3px] shrink-0 h-3 w-3 rounded-sm border-[1.5px] flex items-center justify-center",
                                      dType === "VEGAN" ? "border-teal-600" : dType === "VEG" ? "border-emerald-500" : "border-rose-500"
                                    )}
                                  >
                                    <span
                                      className={cn(
                                        "h-1.5 w-1.5 rounded-full",
                                        dType === "VEGAN" ? "bg-teal-600" : dType === "VEG" ? "bg-emerald-500" : "bg-rose-500"
                                      )}
                                    />
                                  </span>
                                <h3 className="text-sm sm:text-base font-bold text-zinc-900 leading-snug pr-2">
                                  {item.name}
                                </h3>
                              </div>
                              
                              <p className="text-sm font-semibold text-zinc-900 tracking-tight mb-1.5">
                                ₹{priceRupees}
                              </p>
                            </div>

                            {item.description && (
                              <p className="text-xs text-zinc-500 leading-relaxed pr-2">
                                {item.description}
                              </p>
                            )}
                          </div>

                          {/* Image Side */}
                          {imgUrl && (
                            <div 
                              className="shrink-0 w-[100px] h-[100px] sm:w-[110px] sm:h-[110px] rounded-xl overflow-hidden relative bg-zinc-100 shadow-sm border border-zinc-200/50"
                            >
                              <img
                                src={imgUrl}
                                alt={item.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* ── Minimal Brand Footer ── */}
              <div className="pt-8 pb-12 flex justify-center">
                <p className="text-[10px] font-medium text-zinc-400 tracking-[0.2em] uppercase">
                  Powered by <span className="font-bold text-zinc-800">Alayn AI</span>
                </p>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Floating Category Selector (Mobile Only) */}
      {!isSearchActive && displayCategories.length > 0 && (
        <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
          <button
            onClick={() => setIsCategorySheetOpen(true)}
            className="bg-black/80 backdrop-blur-md text-white px-5 py-2.5 rounded-full shadow-lg font-bold text-sm flex items-center gap-1.5 active:scale-[0.95] transition-transform border border-white/10 cursor-pointer"
          >
            <Utensils className="w-3.5 h-3.5 opacity-80" />
            Categories
          </button>
        </div>
      )}

      {/* Mobile Category Overlay Bottom Sheet */}
      <AnimatePresence>
        {isCategorySheetOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs md:hidden flex items-end justify-center"
            onClick={() => setIsCategorySheetOpen(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              className="bg-white w-full rounded-t-[2rem] p-6 max-h-[70vh] overflow-y-auto space-y-4 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                <h3 className="text-base font-bold text-zinc-900">Select Category</h3>
                <button
                  onClick={() => setIsCategorySheetOpen(false)}
                  className="p-1 rounded-full bg-zinc-100 text-zinc-500 hover:bg-zinc-200 transition active:scale-[0.95]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3 py-2">
                {displayCategories.map((cat) => {
                  const isActive = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => {
                        scrollToCategory(cat.id);
                        setIsCategorySheetOpen(false);
                      }}
                      className={cn(
                        "py-3.5 px-4 rounded-2xl text-xs font-bold text-center transition-all cursor-pointer active:scale-[0.98]",
                        isActive
                          ? "bg-zinc-900 text-white shadow-md"
                          : "bg-zinc-50 text-zinc-600 border border-zinc-100 hover:bg-zinc-100"
                      )}
                    >
                      {cat.name}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Image Lightbox ── */}
      <AnimatePresence>
        {lightboxImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setLightboxImage(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", bounce: 0.3, duration: 0.5 }}
              className="relative max-w-sm w-full bg-white rounded-3xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative">
                <img
                  src={lightboxImage.url}
                  alt={lightboxImage.name}
                  className="w-full object-cover max-h-[60vh]"
                />
                <button
                  onClick={() => setLightboxImage(null)}
                  className="absolute top-3 right-3 p-2 rounded-full bg-black/50 text-white backdrop-blur-md hover:bg-black/70 transition active:scale-[0.95]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="px-5 py-4 bg-white">
                <p className="text-base font-bold text-zinc-900">{lightboxImage.name}</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
