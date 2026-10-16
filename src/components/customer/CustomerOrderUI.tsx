"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Utensils,
  Search,
  AlertCircle,
  Leaf,
  X,
  ChevronRight,
  Info,
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  Clock,
  Sparkles,
  QrCode,
  ArrowRight,
  CreditCard,
  ChefHat,
  BellRing,
  ExternalLink,
  MessageSquare,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  fetchTableMenu,
  fetchActiveTableOrder,
  createQROrder,
  CustomerMenuCategory,
  CustomerMenuItem,
  TableMenuResponse,
  resolveUploadUrl,
} from "@/lib/api";
import { QRCodeSVG } from "../common/QRCodeSVG";
import { showToast } from "@/lib/toast";

interface CartItem {
  item: CustomerMenuItem;
  quantity: number;
  notes?: string;
}

export default function CustomerOrderUI({ token }: { token: string }) {
  const [menuData, setMenuData] = useState<TableMenuResponse | null>(null);
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

  // Cart & Ordering State (Active when tableOrderMode === 'ORDER_AND_PAY')
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"UPI" | "CASH">("UPI");
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  // Active Order Live Tracking
  const [activeOrder, setActiveOrder] = useState<any | null>(null);
  const [isTrackerOpen, setIsTrackerOpen] = useState(false);
  const [isEditingNotesItemId, setIsEditingNotesItemId] = useState<string | null>(null);

  // Scroll spy refs
  const isScrollingRef = useRef(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const tableOrderMode = menuData?.tableOrderMode || "WAITER_SERVICE";
  const isSelfOrderMode = tableOrderMode === "ORDER_AND_PAY";
  const allowPayAtCounter = menuData?.allowPayAtCounter ?? true;
  const tableNumber = menuData?.tableNumber;
  const outletUpiId = menuData?.upiId || "";

  // 1. Initial Load of Menu and Active Table Order
  const loadMenuAndActiveOrder = async (isSilent = false) => {
    if (!token) {
      setError("Invalid or missing table QR code token.");
      setLoading(false);
      return;
    }
    if (!isSilent) {
      setLoading(true);
      setError(null);
    }
    try {
      const [menuRes, orderRes] = await Promise.all([
        fetchTableMenu(token),
        fetchActiveTableOrder(token),
      ]);

      if (menuRes.ok && menuRes.categories) {
        setMenuData(menuRes);
        setCategories(menuRes.categories);
        if (menuRes.businessName) setBusinessName(menuRes.businessName);
        if (menuRes.categories.length > 0 && selectedCategory === "ALL") {
          setSelectedCategory(menuRes.categories[0].id);
        }
      } else {
        setError(menuRes.error || "Failed to load table menu. Token may be invalid or expired.");
      }

      if (orderRes.ok && orderRes.order) {
        setActiveOrder(orderRes.order);
      } else {
        setActiveOrder(null);
      }
    } catch (err: any) {
      if (!isSilent) {
        setError(err?.message || "Error connecting to restaurant server.");
      }
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  useEffect(() => {
    loadMenuAndActiveOrder();
  }, [token]);

  // 2. Poll Active Order Status every 8 seconds if there's an ongoing order
  useEffect(() => {
    if (!token || !activeOrder) return;
    const terminalStatuses = ["COMPLETED", "CANCELLED"];
    if (terminalStatuses.includes(activeOrder.status)) return;

    const interval = setInterval(async () => {
      const res = await fetchActiveTableOrder(token);
      if (res.ok && res.order) {
        setActiveOrder(res.order);
      }
    }, 8000);

    return () => clearInterval(interval);
  }, [token, activeOrder?.status]);

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

  const isSearchActive = search.trim().length > 0;
  const activeCategoryData = displayCategories;

  // Cart operations
  const addToCart = (item: CustomerMenuItem) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.item.id === item.id);
      if (existing) {
        return prev.map((c) =>
          c.item.id === item.id ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [...prev, { item, quantity: 1 }];
    });
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) => {
          if (c.item.id === itemId) {
            const newQty = c.quantity + delta;
            return newQty > 0 ? { ...c, quantity: newQty } : null;
          }
          return c;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const setItemNotes = (itemId: string, notes: string) => {
    setCart((prev) =>
      prev.map((c) => (c.item.id === itemId ? { ...c, notes } : c))
    );
  };

  const clearCart = () => setCart([]);

  const totalCartCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  // Billing calculation
  const billSummary = useMemo(() => {
    const subtotalPaise = cart.reduce(
      (sum, c) => sum + c.item.pricePaise * c.quantity,
      0
    );
    const taxRates = menuData?.taxRates;
    const isComposition = taxRates?.gstRegistrationType === "COMPOSITION" || taxRates?.gstRegistrationType === "UNREGISTERED";
    
    let cgstPaise = 0;
    let sgstPaise = 0;
    let serviceChargePaise = 0;

    if (!isComposition && taxRates) {
      cgstPaise = Math.round((subtotalPaise * (taxRates.cgstRate || 2.5)) / 100);
      sgstPaise = Math.round((subtotalPaise * (taxRates.sgstRate || 2.5)) / 100);
    }

    if (taxRates?.serviceChargeRate && taxRates.serviceChargeRate > 0) {
      serviceChargePaise = Math.round((subtotalPaise * taxRates.serviceChargeRate) / 100);
    }

    const totalPaise = subtotalPaise + cgstPaise + sgstPaise + serviceChargePaise;

    return {
      subtotalPaise,
      cgstPaise,
      sgstPaise,
      serviceChargePaise,
      totalPaise,
      subtotalRupees: (subtotalPaise / 100).toFixed(2),
      cgstRupees: (cgstPaise / 100).toFixed(2),
      sgstRupees: (sgstPaise / 100).toFixed(2),
      serviceChargeRupees: (serviceChargePaise / 100).toFixed(2),
      totalRupees: (totalPaise / 100).toFixed(2),
    };
  }, [cart, menuData]);

  // Dynamic UPI URI
  const dynamicUpiUrl = useMemo(() => {
    if (!outletUpiId || billSummary.totalPaise <= 0) return "";
    const amountStr = (billSummary.totalPaise / 100).toFixed(2);
    const note = encodeURIComponent(`Table ${tableNumber || ""} Order - ${businessName}`);
    return `upi://pay?pa=${encodeURIComponent(outletUpiId)}&pn=${encodeURIComponent(businessName)}&am=${amountStr}&cu=INR&tn=${note}`;
  }, [outletUpiId, billSummary.totalPaise, tableNumber, businessName]);

  // Submit Order
  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;
    setIsPlacingOrder(true);

    try {
      const itemsPayload = cart.map((c) => ({
        menuItemId: c.item.id,
        quantity: c.quantity,
        notes: c.notes?.trim() || undefined,
      }));

      const res = await createQROrder({
        tableToken: token,
        items: itemsPayload,
        customerName: customerName.trim() || undefined,
        customerPhone: customerPhone.trim() || undefined,
        paymentMethod: paymentMethod,
        paymentStatus: paymentMethod === "UPI" ? "CONFIRMED" : "PENDING",
      });

      if (res.ok) {
        clearCart();
        setIsCartOpen(false);
        // Refresh active order and show live tracker
        await loadMenuAndActiveOrder(true);
        setIsTrackerOpen(true);
      }
    } catch (err: any) {
      showToast.error("Order Failed", err?.message || "Could not place order.");
    } finally {
      setIsPlacingOrder(false);
    }
  };

  // Scroll to category function
  const scrollToCategory = (categoryId: string) => {
    setSelectedCategory(categoryId);
    isScrollingRef.current = true;
    const element = document.getElementById(`category-${categoryId}`);
    if (element) {
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

  // Visual status step for active tracker
  const getStatusStep = (status: string) => {
    switch (status) {
      case "SENT_TO_KITCHEN":
        return 1;
      case "PREPARING":
        return 2;
      case "READY":
        return 3;
      case "SERVED":
      case "COMPLETED":
        return 4;
      default:
        return 1;
    }
  };

  return (
    <div className="min-h-[100dvh] h-[100dvh] bg-zinc-50 flex flex-col overflow-hidden text-zinc-900 font-sans antialiased selection:bg-zinc-200">
      
      {/* ── Unified Sticky Header Wrapper ── */}
      <div className="sticky top-0 z-40 w-full shrink-0 flex flex-col">
        {/* ── Premium Header ── */}
        <header className="bg-white/80 backdrop-blur-xl border-b border-zinc-200/50 px-4 py-3">
          <div className="flex items-center justify-between max-w-4xl mx-auto w-full">
            <div className="flex items-center gap-2.5">
              <img src="/justlogo.png" alt="Alayn Logo" className="h-7 w-7 object-contain drop-shadow-sm" />
              <div>
                <h1 className="text-lg font-bold text-zinc-900 leading-none tracking-tight flex items-center gap-1.5">
                  {businessName}
                  {tableNumber && (
                    <span className="text-xs font-black bg-zinc-900 text-white px-2 py-0.5 rounded-full">
                      T{tableNumber}
                    </span>
                  )}
                </h1>
                <p className="text-[11px] text-zinc-500 font-medium">
                  {menuData?.outletName || "Dine-In"}
                </p>
              </div>
            </div>

            {/* Mode & Live Status Indicators */}
            <div className="flex items-center gap-2">
              {activeOrder && activeOrder.status !== "COMPLETED" && (
                <button
                  onClick={() => setIsTrackerOpen(true)}
                  className="flex items-center gap-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95"
                >
                  <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
                  Live Order
                </button>
              )}

              {isSelfOrderMode ? (
                <div className="flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/80 text-emerald-800">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-[10px] font-black uppercase tracking-wider">Order & Pay</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 bg-zinc-100/90 px-2.5 py-1 rounded-full border border-zinc-200 text-zinc-600">
                  <Info className="w-3.5 h-3.5 text-zinc-500" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Waiter Service</span>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ── Active Order Tracker Strip (if order in kitchen) ── */}
        {activeOrder && activeOrder.status !== "COMPLETED" && activeOrder.status !== "CANCELLED" && (
          <div
            onClick={() => setIsTrackerOpen(true)}
            className="bg-[#1B2A4A] text-white px-4 py-2 cursor-pointer flex items-center justify-between shadow-xs transition hover:bg-[#253966]"
          >
            <div className="max-w-4xl mx-auto w-full flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <ChefHat className="w-4 h-4 text-amber-400 animate-bounce" />
                <span className="font-extrabold">Order #{activeOrder.orderNumber || activeOrder.id?.slice(0, 8)}</span>
                <span className="text-zinc-300">is currently</span>
                <span className="bg-amber-400 text-zinc-950 font-black px-2 py-0.5 rounded uppercase text-[10px]">
                  {activeOrder.status?.replace(/_/g, " ")}
                </span>
              </div>
              <div className="flex items-center gap-1 font-bold text-amber-300">
                Track Status <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        )}

        {/* ── Waiter Service Mode Notice Strip (when self-ordering disabled) ── */}
        {!isSelfOrderMode && (
          <div className="bg-amber-50 border-b border-amber-200/80 px-4 py-2">
            <div className="max-w-4xl mx-auto w-full flex items-center justify-between text-xs text-amber-900 font-medium">
              <div className="flex items-center gap-2">
                <BellRing className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Browse our menu below. Please place your order directly with your table server.</span>
              </div>
            </div>
          </div>
        )}

        {/* ── Search & Filters Bar ── */}
        <div className="bg-white/70 backdrop-blur-xl border-b border-zinc-200/50 px-3 py-3 shadow-xs">
          <div className="max-w-4xl mx-auto w-full flex flex-col gap-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search dishes, drinks, appetizers..."
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
        {/* Left Sidebar: Categories (Desktop/Tablet Only) */}
        {!isSearchActive && (
          <aside className="hidden md:flex md:w-[140px] shrink-0 bg-gray-50/50 border-r border-gray-100 flex-col overflow-y-auto scrollbar-none py-3">
            {displayCategories.map((cat) => {
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => scrollToCategory(cat.id)}
                  className={cn(
                    "w-full flex flex-col items-center justify-center py-4 px-3 gap-1.5 transition-colors text-center relative",
                    isActive ? "bg-white shadow-xs" : "hover:bg-zinc-100"
                  )}
                >
                  {isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-zinc-900 rounded-r-md" />
                  )}
                  <span
                    className={cn(
                      "text-xs leading-tight transition-all",
                      isActive ? "font-bold text-zinc-900" : "font-semibold text-zinc-500"
                    )}
                  >
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
            <div className="h-full flex flex-col items-center justify-center text-center px-4 py-16">
              <Utensils className="h-10 w-10 text-gray-200 mb-3" />
              <p className="text-sm font-bold text-gray-400">No items found</p>
            </div>
          ) : (
            <div className="space-y-10 pb-32">
              {activeCategoryData.map((cat) => (
                <div key={cat.id} id={`category-${cat.id}`} className="scroll-mt-36 md:scroll-mt-16">
                  <div className="sticky top-0 z-20 bg-zinc-50/95 backdrop-blur-md py-2 mb-2 border-b border-zinc-200/50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-bold text-zinc-900 tracking-wide uppercase">
                        {cat.name}
                      </h2>
                      <span className="text-[10px] font-bold text-zinc-400 bg-zinc-200/60 px-1.5 py-0.5 rounded">
                        {cat.menuItems.length}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col">
                    {cat.menuItems.map((item) => {
                      const priceRupees = (item.pricePaise / 100).toFixed(2);
                      const imgUrl = resolveUploadUrl(item.imageUrl);
                      const dType = item.dietaryType || (item.isVeg ? "VEG" : "NON_VEG");
                      const cartItem = cart.find((c) => c.item.id === item.id);

                      return (
                        <div
                          key={item.id}
                          className="group relative bg-transparent py-4 border-b border-zinc-200/60 last:border-0 flex gap-4 transition-all"
                        >
                          {/* Info Side */}
                          <div className="flex-1 flex flex-col min-w-0 justify-between">
                            <div>
                              <div className="flex items-start gap-1.5 mb-1">
                                <span
                                  className={cn(
                                    "mt-[3px] shrink-0 h-3 w-3 rounded-xs border-[1.5px] flex items-center justify-center",
                                    dType === "VEGAN"
                                      ? "border-teal-600"
                                      : dType === "VEG"
                                      ? "border-emerald-500"
                                      : "border-rose-500"
                                  )}
                                >
                                  <span
                                    className={cn(
                                      "h-1.5 w-1.5 rounded-full",
                                      dType === "VEGAN"
                                        ? "bg-teal-600"
                                        : dType === "VEG"
                                        ? "bg-emerald-500"
                                        : "bg-rose-500"
                                    )}
                                  />
                                </span>
                                <h3 className="text-sm sm:text-base font-bold text-zinc-900 leading-snug pr-2">
                                  {item.name}
                                </h3>
                              </div>

                              <p className="text-sm font-extrabold text-zinc-900 tracking-tight mb-1">
                                ₹{priceRupees}
                              </p>

                              {item.description && (
                                <p className="text-xs text-zinc-500 leading-relaxed pr-2 line-clamp-2">
                                  {item.description}
                                </p>
                              )}
                            </div>

                            {/* Ordering Controls (Only when ORDER_AND_PAY mode is active) */}
                            {isSelfOrderMode && (
                              <div className="mt-3 flex items-center gap-2">
                                {cartItem ? (
                                  <div className="flex items-center gap-2 bg-zinc-900 text-white rounded-xl px-2.5 py-1 shadow-sm">
                                    <button
                                      type="button"
                                      onClick={() => updateQuantity(item.id, -1)}
                                      className="p-1 hover:text-rose-300 active:scale-90 transition-transform cursor-pointer"
                                      title="Decrease quantity"
                                    >
                                      <Minus className="w-3.5 h-3.5" />
                                    </button>
                                    <span className="text-xs font-black w-5 text-center">
                                      {cartItem.quantity}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => updateQuantity(item.id, 1)}
                                      className="p-1 hover:text-emerald-300 active:scale-90 transition-transform cursor-pointer"
                                      title="Increase quantity"
                                    >
                                      <Plus className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => addToCart(item)}
                                    className="px-3.5 py-1.5 bg-[#D3232A] hover:bg-[#b51c22] text-white text-xs font-extrabold rounded-xl shadow-xs transition-transform active:scale-95 flex items-center gap-1 cursor-pointer"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                    Add
                                  </button>
                                )}

                                {cartItem && (
                                  <button
                                    type="button"
                                    onClick={() => setIsEditingNotesItemId(isEditingNotesItemId === item.id ? null : item.id)}
                                    className="text-[11px] font-bold text-zinc-500 hover:text-zinc-800 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-zinc-100 transition-colors"
                                  >
                                    <MessageSquare className="w-3 h-3" />
                                    {cartItem.notes ? "Edit Note" : "Add Note"}
                                  </button>
                                )}
                              </div>
                            )}

                            {/* Inline Note Input */}
                            {cartItem && isEditingNotesItemId === item.id && (
                              <div className="mt-2 flex items-center gap-2">
                                <input
                                  type="text"
                                  placeholder="e.g. less spicy, no onions..."
                                  value={cartItem.notes || ""}
                                  onChange={(e) => setItemNotes(item.id, e.target.value)}
                                  className="text-xs px-2.5 py-1 bg-white border border-zinc-200 rounded-lg flex-1 focus:outline-none focus:ring-1 focus:ring-zinc-800"
                                  autoFocus
                                />
                                <button
                                  type="button"
                                  onClick={() => setIsEditingNotesItemId(null)}
                                  className="text-xs font-bold text-zinc-700 hover:text-zinc-900 px-2 py-1"
                                >
                                  Done
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Image Side */}
                          {imgUrl && (
                            <div
                              onClick={() => setLightboxImage({ url: imgUrl, name: item.name })}
                              className="shrink-0 w-[95px] h-[95px] sm:w-[110px] sm:h-[110px] rounded-2xl overflow-hidden relative bg-zinc-100 shadow-xs border border-zinc-200/50 cursor-pointer"
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

              {/* Minimal Brand Footer */}
              <div className="pt-8 pb-12 flex justify-center">
                <p className="text-[10px] font-medium text-zinc-400 tracking-[0.2em] uppercase">
                  Powered by <span className="font-bold text-zinc-800">Alayn AI</span>
                </p>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Floating Category Selector (Mobile Only, when cart sheet not open) */}
      {!isSearchActive && displayCategories.length > 0 && totalCartCount === 0 && (
        <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-30">
          <button
            onClick={() => setIsCategorySheetOpen(true)}
            className="bg-black/85 backdrop-blur-md text-white px-5 py-2.5 rounded-full shadow-lg font-bold text-sm flex items-center gap-1.5 active:scale-95 transition-transform border border-white/10 cursor-pointer"
          >
            <Utensils className="w-3.5 h-3.5 opacity-80" />
            Categories
          </button>
        </div>
      )}

      {/* ── Floating Cart Bar (When Cart Has Items & In Order & Pay Mode) ── */}
      <AnimatePresence>
        {isSelfOrderMode && totalCartCount > 0 && !isCartOpen && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            className="fixed bottom-5 inset-x-4 max-w-md mx-auto z-40"
          >
            <button
              onClick={() => setIsCartOpen(true)}
              className="w-full bg-[#1B2A4A] text-white p-3.5 rounded-2xl shadow-xl flex items-center justify-between transition-transform active:scale-[0.98] border border-white/10 cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center font-black text-xs text-white">
                  {totalCartCount}
                </div>
                <div className="text-left">
                  <p className="text-xs text-zinc-300 font-medium">Your Table Order</p>
                  <p className="text-sm font-extrabold text-white">₹{billSummary.totalRupees}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 bg-[#D3232A] px-4 py-2 rounded-xl text-xs font-black tracking-wide uppercase shadow-sm">
                View & Pay <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Slide-up Cart & Checkout Drawer ── */}
      <AnimatePresence>
        {isCartOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end justify-center"
            onClick={() => setIsCartOpen(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.35 }}
              className="bg-white w-full max-w-lg rounded-t-[2.5rem] p-6 max-h-[85vh] flex flex-col shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-[#D3232A]" />
                    Review Table Order
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Table {tableNumber || "Direct"} · {businessName}
                  </p>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="p-1.5 rounded-full bg-zinc-100 text-zinc-500 hover:bg-zinc-200 transition active:scale-95"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Items List */}
              <div className="flex-1 overflow-y-auto py-4 space-y-3.5">
                {cart.map((c) => (
                  <div key={c.item.id} className="p-3 bg-zinc-50 rounded-2xl border border-zinc-100 flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-zinc-900 truncate">{c.item.name}</p>
                        <p className="text-xs text-zinc-500 font-semibold">
                          ₹{(c.item.pricePaise / 100).toFixed(2)} each
                        </p>
                      </div>

                      <div className="flex items-center gap-2 bg-white rounded-xl border border-zinc-200 px-2 py-1 shadow-2xs">
                        <button
                          onClick={() => updateQuantity(c.item.id, -1)}
                          className="p-0.5 text-zinc-500 hover:text-rose-600"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-xs font-black w-4 text-center">{c.quantity}</span>
                        <button
                          onClick={() => updateQuantity(c.item.id, 1)}
                          className="p-0.5 text-zinc-500 hover:text-emerald-600"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <span className="text-sm font-extrabold text-zinc-900 shrink-0 w-16 text-right">
                        ₹{((c.item.pricePaise * c.quantity) / 100).toFixed(2)}
                      </span>
                    </div>

                    {c.notes && (
                      <p className="text-[11px] text-amber-800 bg-amber-50 px-2 py-1 rounded-md italic">
                        Note: "{c.notes}"
                      </p>
                    )}
                  </div>
                ))}

                {/* Diner Information (Optional) */}
                <div className="pt-2 space-y-2.5">
                  <p className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
                    Guest Details (Optional)
                  </p>
                  <div className="grid grid-cols-2 gap-2.5">
                    <input
                      type="text"
                      placeholder="Your Name"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full text-xs font-medium px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-zinc-800"
                    />
                    <input
                      type="tel"
                      placeholder="Phone (for receipt)"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full text-xs font-medium px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-zinc-800"
                    />
                  </div>
                </div>

                {/* Payment Method Selector */}
                <div className="pt-3 space-y-2">
                  <p className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
                    Payment Method
                  </p>

                  <div className="grid grid-cols-2 gap-2.5">
                    {/* UPI Option */}
                    <div
                      onClick={() => setPaymentMethod("UPI")}
                      className={`p-3 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                        paymentMethod === "UPI"
                          ? "border-emerald-600 bg-emerald-50/50 shadow-xs ring-1 ring-emerald-600"
                          : "border-zinc-200 bg-zinc-50"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <QrCode className="w-4 h-4 text-emerald-600" />
                        {paymentMethod === "UPI" && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                      </div>
                      <p className="text-xs font-black text-zinc-900">UPI Instant Pay</p>
                      <p className="text-[10px] text-zinc-500">GPay, PhonePe, Paytm</p>
                    </div>

                    {/* Pay at Counter Option */}
                    {allowPayAtCounter ? (
                      <div
                        onClick={() => setPaymentMethod("CASH")}
                        className={`p-3 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                          paymentMethod === "CASH"
                            ? "border-[#1B2A4A] bg-[#1B2A4A]/5 shadow-xs ring-1 ring-[#1B2A4A]"
                            : "border-zinc-200 bg-zinc-50"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <CreditCard className="w-4 h-4 text-[#1B2A4A]" />
                          {paymentMethod === "CASH" && <CheckCircle2 className="w-4 h-4 text-[#1B2A4A]" />}
                        </div>
                        <p className="text-xs font-black text-zinc-900">Pay at Counter</p>
                        <p className="text-[10px] text-zinc-500">Cash / Card at counter</p>
                      </div>
                    ) : (
                      <div className="p-3 rounded-2xl border border-zinc-200 bg-zinc-100 opacity-60 flex flex-col justify-between">
                        <CreditCard className="w-4 h-4 text-zinc-400 mb-1.5" />
                        <p className="text-xs font-bold text-zinc-400">Counter Pay</p>
                        <p className="text-[10px] text-zinc-400">Disabled by store</p>
                      </div>
                    )}
                  </div>

                  {/* UPI QR Display if UPI is selected */}
                  {paymentMethod === "UPI" && dynamicUpiUrl && (
                    <div className="mt-3 p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl flex items-center justify-between gap-3">
                      <div className="bg-white p-1.5 rounded-xl border border-emerald-200 shrink-0">
                        <QRCodeSVG value={dynamicUpiUrl} size={64} fgColor="#064E3B" bgColor="#FFFFFF" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-emerald-950">Pay ₹{billSummary.totalRupees} via UPI</p>
                        <p className="text-[10px] text-emerald-700 truncate">VPA: {outletUpiId}</p>
                        <a
                          href={dynamicUpiUrl}
                          className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-black text-emerald-800 bg-emerald-200/80 px-2.5 py-1 rounded-lg hover:bg-emerald-300 transition"
                        >
                          Open in UPI App <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                {/* Bill Breakdown */}
                <div className="pt-3 border-t border-zinc-100 space-y-1.5 text-xs">
                  <div className="flex justify-between text-zinc-500 font-medium">
                    <span>Items Subtotal</span>
                    <span>₹{billSummary.subtotalRupees}</span>
                  </div>
                  {Number(billSummary.cgstRupees) > 0 && (
                    <div className="flex justify-between text-zinc-500 font-medium">
                      <span>CGST ({menuData?.taxRates?.cgstRate}%)</span>
                      <span>₹{billSummary.cgstRupees}</span>
                    </div>
                  )}
                  {Number(billSummary.sgstRupees) > 0 && (
                    <div className="flex justify-between text-zinc-500 font-medium">
                      <span>SGST ({menuData?.taxRates?.sgstRate}%)</span>
                      <span>₹{billSummary.sgstRupees}</span>
                    </div>
                  )}
                  {Number(billSummary.serviceChargeRupees) > 0 && (
                    <div className="flex justify-between text-zinc-500 font-medium">
                      <span>Service Charge</span>
                      <span>₹{billSummary.serviceChargeRupees}</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-zinc-200 flex justify-between text-sm font-black text-zinc-900">
                    <span>Grand Total</span>
                    <span>₹{billSummary.totalRupees}</span>
                  </div>
                </div>
              </div>

              {/* Submit CTA */}
              <div className="pt-4 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={handlePlaceOrder}
                  disabled={isPlacingOrder || cart.length === 0}
                  className="w-full bg-[#D3232A] hover:bg-[#b51c22] disabled:bg-zinc-400 text-white py-3.5 rounded-2xl font-black text-sm tracking-wide transition-all shadow-md active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isPlacingOrder ? (
                    <span>Sending to Kitchen...</span>
                  ) : (
                    <>
                      <span>Confirm & Send to Kitchen (₹{billSummary.totalRupees})</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Live Order Tracker Modal ── */}
      <AnimatePresence>
        {isTrackerOpen && activeOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => setIsTrackerOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white max-w-md w-full rounded-3xl p-6 shadow-2xl space-y-5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                <div>
                  <h3 className="text-base font-extrabold text-zinc-900 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-emerald-600" />
                    Order Status
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Order #{activeOrder.orderNumber || activeOrder.id?.slice(0, 8)} · Table {activeOrder.tableNumber}
                  </p>
                </div>
                <button
                  onClick={() => setIsTrackerOpen(false)}
                  className="p-1 rounded-full bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Stepper Progress */}
              <div className="py-2">
                <div className="flex items-center justify-between relative mb-2">
                  <div className="absolute top-1/2 left-0 right-0 h-1 bg-zinc-100 -translate-y-1/2 z-0" />
                  <div
                    className="absolute top-1/2 left-0 h-1 bg-emerald-600 -translate-y-1/2 z-0 transition-all duration-500"
                    style={{
                      width: `${((getStatusStep(activeOrder.status) - 1) / 3) * 100}%`,
                    }}
                  />

                  {["Placed", "Cooking", "Ready", "Served"].map((stepLabel, idx) => {
                    const stepNum = idx + 1;
                    const currentStep = getStatusStep(activeOrder.status);
                    const isDone = currentStep >= stepNum;
                    return (
                      <div key={stepLabel} className="relative z-10 flex flex-col items-center">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                            isDone
                              ? "bg-emerald-600 text-white shadow-sm ring-4 ring-emerald-50"
                              : "bg-white text-zinc-400 border-2 border-zinc-200"
                          }`}
                        >
                          {isDone ? <CheckCircle2 className="w-4 h-4" /> : stepNum}
                        </div>
                        <span className="text-[10px] font-bold text-zinc-500 mt-1.5">{stepLabel}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Active Items List */}
              <div className="bg-zinc-50 p-3.5 rounded-2xl border border-zinc-100 space-y-2 max-h-48 overflow-y-auto">
                <p className="text-xs font-bold text-zinc-700 uppercase tracking-wider mb-1">
                  Ordered Items ({activeOrder.items?.length || 0})
                </p>
                {activeOrder.items?.map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between text-xs">
                    <span className="font-bold text-zinc-800">
                      {item.quantity}x {item.menuItem?.name || "Dish"}
                    </span>
                    <span className="font-semibold text-zinc-600">
                      ₹{((item.subtotalPaise || item.unitPricePaise * item.quantity) / 100).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-zinc-100 flex items-center justify-between">
                <div>
                  <p className="text-xs text-zinc-500">Total Bill</p>
                  <p className="text-base font-black text-zinc-900">
                    ₹{((activeOrder.totalPaise || 0) / 100).toFixed(2)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsTrackerOpen(false)}
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Order More Items
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Category Overlay Bottom Sheet (Mobile) ── */}
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
                  className="p-1 rounded-full bg-zinc-100 text-zinc-500 hover:bg-zinc-200 transition active:scale-95"
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
                        "py-3.5 px-4 rounded-2xl text-xs font-bold text-center transition-all cursor-pointer active:scale-98",
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
                  className="absolute top-3 right-3 p-2 rounded-full bg-black/50 text-white backdrop-blur-md hover:bg-black/70 transition active:scale-95"
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
