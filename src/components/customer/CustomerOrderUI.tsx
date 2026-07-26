"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Utensils,
  Search,
  AlertCircle,
  // Bell, // Call Waiter — commented out for now
  Leaf,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  fetchTableMenu,
  CustomerMenuCategory,
  CustomerMenuItem,
  resolveUploadUrl,
} from "@/lib/api";

export default function CustomerOrderUI({ token }: { token: string }) {
  const [categories, setCategories] = useState<CustomerMenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [vegOnly, setVegOnly] = useState(false);
  // const [callWaiterNotified, setCallWaiterNotified] = useState(false); // Call Waiter — commented out for now

  // Image lightbox
  const [lightboxImage, setLightboxImage] = useState<{ url: string; name: string } | null>(null);

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
      } else {
        setError(res.error || "Failed to load table menu. Token may be invalid or expired.");
      }
      setLoading(false);
    }

    loadMenu();
  }, [token]);

  // const handleCallWaiter = () => {
  //   setCallWaiterNotified(true);
  //   setTimeout(() => setCallWaiterNotified(false), 4000);
  // };

  // Flattened & filtered items
  const displayCategories = useMemo(() => {
    return categories
      .map((cat) => {
        const filteredItems = cat.menuItems.filter((item) => {
          if (vegOnly && !item.isVeg) return false;
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
      .filter((cat) =>
        selectedCategory === "ALL" ? cat.menuItems.length > 0 : cat.id === selectedCategory
      );
  }, [categories, selectedCategory, search, vegOnly]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
        <div className="p-4 rounded-full bg-red-50 text-[#D3232A] animate-bounce mb-4">
          <Utensils className="h-8 w-8" />
        </div>
        <p className="text-[#D3232A] font-bold text-lg animate-pulse">Loading Digital Menu...</p>
        <p className="text-gray-400 text-xs mt-1">Setting up your dining experience</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
        <div className="p-4 rounded-full bg-red-50 text-red-500 mb-4">
          <AlertCircle className="h-10 w-10" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">QR Code Issue</h2>
        <p className="text-gray-500 text-sm max-w-sm mb-6">{error}</p>
        <p className="text-xs text-gray-400">
          Please ask restaurant staff to check your table QR code sticker.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-[#1B2A4A] pb-28" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Google Font */}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');`}</style>

      {/* ── Top Header ──────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-white shadow-sm border-b border-gray-100 px-4 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-[#D3232A] flex items-center justify-center text-white font-black text-lg shadow-md shadow-red-100">
            A
          </div>
          <div>
            <h1 className="text-base font-black text-[#1B2A4A] leading-none tracking-tight">Alayn Dining</h1>
            <p className="text-[11px] text-emerald-600 font-semibold leading-none mt-1 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
              Digital Menu • View Only
            </p>
          </div>
        </div>

        {/* Call Waiter button — commented out for now */}
        {/* <button
          onClick={handleCallWaiter}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#D3232A] hover:bg-red-700 text-white text-xs font-bold shadow-md shadow-red-200 transition-all active:scale-95"
        >
          <Bell className="h-3.5 w-3.5" />
          <span>Call Waiter</span>
        </button> */}
      </header>

      {/* Call Waiter notification toast — commented out for now */}
      {/* {callWaiterNotified && (
        <div className="fixed top-[72px] inset-x-4 z-50 max-w-md mx-auto bg-emerald-500 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-sm font-semibold animate-in fade-in slide-in-from-top-2">
          <span>🔔 Waiter notified! They&apos;ll be with you shortly.</span>
        </div>
      )} */}

      {/* ── Banner ─────────────────────────────────────────────────────── */}
      <div className="bg-[#1B2A4A]/5 border-b border-[#1B2A4A]/10 px-4 py-2.5 text-center">
        <p className="text-xs font-semibold text-[#1B2A4A]">
          📖 Browse the menu &amp; ask your waiter to place an order
        </p>
      </div>

      {/* ── Main Content ───────────────────────────────────────────────── */}
      <main className="max-w-3xl mx-auto px-4 pt-4 space-y-4">

        {/* Search & Veg Filter */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search dishes or drinks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#1B2A4A] placeholder-gray-400 focus:outline-none focus:border-[#D3232A] focus:ring-2 focus:ring-[#D3232A]/10 transition"
            />
          </div>

          <button
            onClick={() => setVegOnly(!vegOnly)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold border transition-all shrink-0",
              vegOnly
                ? "bg-emerald-50 text-emerald-700 border-emerald-300 shadow-sm"
                : "bg-white text-gray-500 border-gray-200 hover:border-emerald-300 hover:text-emerald-600"
            )}
          >
            <Leaf className={cn("h-3.5 w-3.5", vegOnly ? "text-emerald-600" : "text-gray-400")} />
            <span>Veg</span>
          </button>
        </div>

        {/* Category horizontal scrolling bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none -mx-4 px-4">
          <button
            onClick={() => setSelectedCategory("ALL")}
            className={cn(
              "px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap shrink-0 border",
              selectedCategory === "ALL"
                ? "bg-[#D3232A] text-white border-[#D3232A] shadow-md shadow-red-200"
                : "bg-white text-gray-500 border-gray-200 hover:border-[#D3232A] hover:text-[#D3232A]"
            )}
          >
            All Items
          </button>

          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={cn(
                "px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap shrink-0 border",
                selectedCategory === cat.id
                  ? "bg-[#D3232A] text-white border-[#D3232A] shadow-md shadow-red-200"
                  : "bg-white text-gray-500 border-gray-200 hover:border-[#D3232A] hover:text-[#D3232A]"
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Menu Categories & Items List */}
        {displayCategories.length === 0 ? (
          <div className="py-20 text-center text-gray-400">
            <Utensils className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-semibold text-gray-500">No menu items found</p>
            <p className="text-xs text-gray-400 mt-1">Try resetting your search or veg filter</p>
          </div>
        ) : (
          displayCategories.map((cat) => (
            <section key={cat.id} className="space-y-3 pt-2">
              {/* Category Header */}
              <div className="flex items-center justify-between pb-2 border-b-2 border-[#1B2A4A]/10">
                <h2 className="text-sm font-black text-[#1B2A4A] uppercase tracking-wider">
                  {cat.name}
                </h2>
                <span className="text-xs text-[#1B2A4A]/50 font-semibold bg-[#1B2A4A]/5 px-2 py-0.5 rounded-full">
                  {cat.menuItems.length} items
                </span>
              </div>

              {/* Items Grid */}
              <div className="grid grid-cols-1 gap-3">
                {cat.menuItems.map((item) => {
                  const priceRupees = (item.pricePaise / 100).toFixed(2);

                  return (
                    <div
                      key={item.id}
                      className="flex items-stretch bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all overflow-hidden"
                    >
                      {/* Dish Image — shown only if imageUrl exists */}
                      {(() => {
                        const imgUrl = resolveUploadUrl(item.imageUrl);
                        return imgUrl ? (
                          <div className="shrink-0 w-[100px] h-[100px] overflow-hidden relative bg-gray-100 group">
                            <img
                              src={imgUrl}
                              alt={item.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 cursor-pointer"
                              onClick={() => setLightboxImage({ url: imgUrl, name: item.name })}
                              title="Tap to view full image"
                              onError={(e) => {
                                const img = e.target as HTMLImageElement;
                                img.style.display = "none";
                                const parent = img.parentElement;
                                if (parent) {
                                  parent.innerHTML = `<div class="w-full h-full flex items-center justify-center"><svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 24 24' fill='none' stroke='#e5e7eb' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'><path d='M3 6l3 3 4-4 4 4 3-3'/><rect x='2' y='3' width='20' height='18' rx='2'/><circle cx='8.5' cy='8.5' r='1.5'/></svg></div>`;
                                }
                              }}
                            />
                          </div>
                        ) : (
                          /* Placeholder when no image */
                          <div className="shrink-0 w-[100px] h-[100px] bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
                            <Utensils className="w-8 h-8 text-gray-200" />
                          </div>
                        );
                      })()}

                      {/* Item Info */}
                      <div className="flex flex-1 flex-col justify-between p-3 min-w-0">
                        <div className="flex items-start gap-2">
                          {/* Veg / Non-Veg dot */}
                          <span
                            className={cn(
                              "mt-0.5 shrink-0 h-4 w-4 rounded-sm border-2 flex items-center justify-center",
                              item.isVeg
                                ? "border-emerald-500"
                                : "border-[#D3232A]"
                            )}
                            title={item.isVeg ? "Vegetarian" : "Non-Vegetarian"}
                          >
                            <span
                              className={cn(
                                "h-2 w-2 rounded-full",
                                item.isVeg ? "bg-emerald-500" : "bg-[#D3232A]"
                              )}
                            />
                          </span>

                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-bold text-[#1B2A4A] leading-tight line-clamp-1">
                              {item.name}
                            </h3>
                            {item.description && (
                              <p className="text-xs text-gray-400 line-clamp-2 mt-0.5 leading-relaxed">
                                {item.description}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Price */}
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50">
                          <p className="text-base font-black text-[#D3232A] tracking-tight">
                            ₹{priceRupees}
                          </p>
                          <span
                            className={cn(
                              "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide",
                              item.isVeg
                                ? "bg-emerald-50 text-emerald-600"
                                : "bg-red-50 text-red-500"
                            )}
                          >
                            {item.isVeg ? "Veg" : "Non-Veg"}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))
        )}

        {/* Footer note */}
        <div className="pt-4 pb-4 text-center">
          <p className="text-[11px] text-[#1B2A4A]/40 font-medium">
            Prices are inclusive of all taxes. Please inform staff of any allergies.
          </p>
        </div>
      </main>

      {/* ── Image Lightbox ──────────────────────────────────────────────── */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <div
            className="relative max-w-sm w-full bg-white rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={lightboxImage.url}
              alt={lightboxImage.name}
              className="w-full object-cover max-h-72"
            />
            <div className="px-4 py-3 flex items-center justify-between">
              <p className="text-sm font-bold text-gray-800">{lightboxImage.name}</p>
              <button
                onClick={() => setLightboxImage(null)}
                className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
