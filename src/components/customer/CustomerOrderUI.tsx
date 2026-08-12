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
        <h2 className="text-2xl font-black text-[#1B2A4A] mb-2 tracking-tight">Oops!</h2>
        <p className="text-gray-500 text-sm max-w-sm mb-6">{error}</p>
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
          Please ask restaurant staff for assistance.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] h-[100dvh] bg-white flex flex-col overflow-hidden text-[#1B2A4A]" style={{ fontFamily: "'Inter', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');`}</style>

      {/* ── Premium Header ── */}
      <header className="z-30 bg-white/80 backdrop-blur-xl border-b border-gray-100 px-4 py-3 shrink-0">
        <div className="flex items-center justify-between max-w-4xl mx-auto w-full">
          <div className="flex items-center gap-2.5">
            <img src="/justlogo.png" alt="Alayn Logo" className="h-7 w-7 object-contain drop-shadow-sm" />
            <div>
              <h1 className="text-lg font-black text-[#1B2A4A] leading-none tracking-tight">
                {businessName} <span className="font-semibold text-gray-500">Dining</span>
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-1.5 bg-gray-100/80 px-2.5 py-1 rounded-full border border-gray-200">
             <Info className="w-3.5 h-3.5 text-gray-500" />
             <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">View Only</span>
          </div>
        </div>
      </header>

      {/* ── Minimal Brand Tagline ── */}
      <div className="bg-gray-50/50 border-b border-gray-100 px-4 py-1.5 flex justify-center shrink-0">
        <p className="text-[9px] font-medium text-gray-400 tracking-[0.2em] uppercase">
          Powered by <span className="font-extrabold text-[#1B2A4A]">Alayn AI</span>
        </p>
      </div>

      {/* ── Search & Filters Bar ── */}
      <div className="z-20 bg-white border-b border-gray-100 px-3 py-3 shrink-0 shadow-sm">
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
                  "px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap",
                  dietaryFilter === "ALL"
                    ? "bg-[#1B2A4A] text-white"
                    : "bg-gray-50 text-gray-600 border border-gray-200"
                )}
              >
                All
              </button>
              {hasVegItems && (
                <button
                  onClick={() => setDietaryFilter("VEG")}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap",
                    dietaryFilter === "VEG"
                      ? "bg-emerald-600 text-white"
                      : "bg-gray-50 text-gray-600 border border-gray-200"
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
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap",
                    dietaryFilter === "NON_VEG"
                      ? "bg-rose-600 text-white"
                      : "bg-gray-50 text-gray-600 border border-gray-200"
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
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap",
                    dietaryFilter === "VEGAN"
                      ? "bg-teal-600 text-white"
                      : "bg-gray-50 text-gray-600 border border-gray-200"
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
                    isActive ? "bg-white" : "hover:bg-gray-100"
                  )}
                >
                  {isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#D3232A] rounded-r-md" />
                  )}
                  <span className={cn(
                    "text-xs leading-tight transition-all",
                    isActive ? "font-black text-[#D3232A]" : "font-bold text-gray-500"
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
            <div className="space-y-8 pb-24">
              {activeCategoryData.map((cat) => (
                <div key={cat.id} id={`category-${cat.id}`} className="space-y-4 scroll-mt-28 md:scroll-mt-12">
                  <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                    <h2 className="text-sm font-black text-[#1B2A4A] tracking-wider uppercase">
                      {cat.name}
                    </h2>
                    <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                      {cat.menuItems.length}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {cat.menuItems.map((item) => {
                      const priceRupees = (item.pricePaise / 100).toFixed(2);
                      const imgUrl = resolveUploadUrl(item.imageUrl);
                      const dType = item.dietaryType || (item.isVeg ? "VEG" : "NON_VEG");

                      return (
                        <div
                          key={item.id}
                          className="group bg-white rounded-2xl border border-gray-100 p-3 shadow-xs hover:shadow-md hover:border-gray-200 transition-all flex gap-3 overflow-hidden"
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
                                <h3 className="text-[13px] sm:text-sm font-bold text-[#1B2A4A] leading-snug line-clamp-2">
                                  {item.name}
                                </h3>
                              </div>
                              
                              <p className="text-[15px] font-black text-[#1B2A4A] tracking-tight mb-1.5">
                                ₹{priceRupees}
                              </p>
                            </div>

                            {item.description && (
                              <p className="text-[11px] text-gray-500 leading-relaxed line-clamp-2">
                                {item.description}
                              </p>
                            )}
                          </div>

                          {/* Image Side (Compact Square) */}
                          {imgUrl && (
                            <div 
                              className="shrink-0 w-[90px] h-[90px] sm:w-[100px] sm:h-[100px] rounded-xl overflow-hidden relative bg-gray-50 cursor-pointer shadow-sm border border-gray-100"
                              onClick={() => setLightboxImage({ url: imgUrl, name: item.name })}
                            >
                              <img
                                src={imgUrl}
                                alt={item.name}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Floating Category Selector (Mobile Only) */}
      {!isSearchActive && displayCategories.length > 0 && (
        <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
          <button
            onClick={() => setIsCategorySheetOpen(true)}
            className="bg-[#1B2A4A] text-white px-5 py-2.5 rounded-full shadow-lg font-black text-xs flex items-center gap-1.5 hover:scale-105 transition-transform border border-slate-700 cursor-pointer"
          >
            <Utensils className="w-3.5 h-3.5" />
            Categories
          </button>
        </div>
      )}

      {/* Mobile Category Overlay Bottom Sheet */}
      {isCategorySheetOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs md:hidden flex items-end justify-center animate-in fade-in duration-200"
          onClick={() => setIsCategorySheetOpen(false)}
        >
          <div
            className="bg-white w-full rounded-t-[2rem] p-6 max-h-[70vh] overflow-y-auto space-y-4 shadow-2xl animate-in slide-in-from-bottom duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-black text-[#1B2A4A]">Select Category</h3>
              <button
                onClick={() => setIsCategorySheetOpen(false)}
                className="p-1 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition"
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
                      "py-3.5 px-4 rounded-2xl text-xs font-black text-center border transition-all cursor-pointer",
                      isActive
                        ? "bg-[#D3232A]/5 text-[#D3232A] border-[#D3232A] shadow-xs"
                        : "bg-gray-50 text-gray-600 border-gray-100 hover:bg-gray-100"
                    )}
                  >
                    {cat.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Image Lightbox ── */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setLightboxImage(null)}
        >
          <div
            className="relative max-w-sm w-full bg-white rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200"
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
                className="absolute top-3 right-3 p-2 rounded-full bg-black/50 text-white backdrop-blur-md hover:bg-black/70 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-5 py-4 bg-white">
              <p className="text-base font-black text-[#1B2A4A]">{lightboxImage.name}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
