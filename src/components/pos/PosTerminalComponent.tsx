"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  useGetMenuItemsQuery,
  useGetCategoriesQuery,
  MenuItem,
  MenuCategory,
} from "@/redux/slices/menuApiSlice";
import {
  useCreateOrderMutation,
  CreateOrderPayload,
} from "@/redux/slices/orderApiSlice";
import {
  ShoppingCart,
  Search,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  QrCode,
  DollarSign,
  Receipt,
  CheckCircle2,
  Utensils,
  LayoutGrid,
  List,
  X,
  Store,
  Check,
  ChevronRight,
  AlertCircle,
  FileText,
} from "lucide-react";
import DashboardLayout from "../layout/DashboardLayout";
import { getImageUrl } from "@/lib/utils";
import { useBranch } from "@/lib/BranchContext";

interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  notes?: string;
}

export default function PosTerminalComponent() {
  const { activeBranch, setActiveBranch, branches } = useBranch();
  const currentOutletId =
    activeBranch?.id && activeBranch.id !== "all" ? activeBranch.id : null;
  const isAllOutletsSelected = !activeBranch || activeBranch.id === "all";

  // List of specific outlets excluding "all"
  const specificOutlets = useMemo(() => {
    return branches.filter((b) => b.id !== "all");
  }, [branches]);

  // Filtering & Display States
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"GRID" | "LIST">("GRID");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 24;

  // Cart & Order Configuration States — Fixed to Counter Direct
  const [cart, setCart] = useState<CartItem[]>([]);
  const orderSource = "COUNTER" as const;
  const [discount, setDiscount] = useState<number>(0);
  const [taxPercent, setTaxPercent] = useState<number>(5);
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "CARD" | "UPI">("UPI");
  const [editingNoteItemId, setEditingNoteItemId] = useState<string | null>(null);

  // Mobile & Modal UI States
  const [isMobileCartOpen, setIsMobileCartOpen] = useState<boolean>(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  const [isOutletSelectModalOpen, setIsOutletSelectModalOpen] = useState<boolean>(false);
  const [completedOrder, setCompletedOrder] = useState<any>(null);

  // Clear cart if 'All Outlets' is selected
  useEffect(() => {
    if (isAllOutletsSelected) {
      setCart([]);
    }
  }, [isAllOutletsSelected]);

  // Fetch API Queries
  const { data: categories = [] } = useGetCategoriesQuery();
  const { data: menuItems = [], isLoading: isLoadingMenu } = useGetMenuItemsQuery();
  const [createOrder, { isLoading: isSubmitting }] = useCreateOrderMutation();

  // Deduplicate categories by name / ID
  const categoriesDeduplicated = useMemo(() => {
    const raw = categories || [];
    const map = new Map<string, MenuCategory>();
    raw.forEach((cat) => {
      if (cat && cat.name) {
        const key = cat.name.trim().toLowerCase();
        if (!map.has(key)) {
          map.set(key, cat);
        }
      }
    });
    return Array.from(map.values());
  }, [categories]);

  // Filter menu items by category and search term
  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      const matchesCategory =
        selectedCategoryId === "ALL" || item.categoryId === selectedCategoryId;
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.category?.name &&
          item.category.name.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch && item.isAvailable;
    });
  }, [menuItems, selectedCategoryId, searchQuery]);

  // Cart Operations — Blocked if 'All Outlets' is active
  const addToCart = (item: MenuItem) => {
    if (isAllOutletsSelected) {
      setIsOutletSelectModalOpen(true);
      return;
    }

    setCart((prev) => {
      const existing = prev.find((ci) => ci.menuItem.id === item.id);
      if (existing) {
        return prev.map((ci) =>
          ci.menuItem.id === item.id ? { ...ci, quantity: ci.quantity + 1 } : ci
        );
      }
      return [...prev, { menuItem: item, quantity: 1 }];
    });
  };

  const updateQuantity = (itemId: string, delta: number) => {
    if (isAllOutletsSelected) {
      setIsOutletSelectModalOpen(true);
      return;
    }

    setCart((prev) =>
      prev
        .map((ci) => {
          if (ci.menuItem.id === itemId) {
            const newQty = ci.quantity + delta;
            return newQty > 0 ? { ...ci, quantity: newQty } : null;
          }
          return ci;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const updateItemNote = (itemId: string, notes: string) => {
    setCart((prev) =>
      prev.map((ci) => (ci.menuItem.id === itemId ? { ...ci, notes } : ci))
    );
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => prev.filter((ci) => ci.menuItem.id !== itemId));
  };

  const clearCart = () => {
    setCart([]);
    setDiscount(0);
  };

  // Financial Calculations
  const subtotal = useMemo(() => {
    return cart.reduce((acc, ci) => acc + ci.menuItem.price * ci.quantity, 0);
  }, [cart]);

  const totalItemCount = useMemo(() => {
    return cart.reduce((acc, ci) => acc + ci.quantity, 0);
  }, [cart]);

  const taxAmount = useMemo(() => {
    return (subtotal * taxPercent) / 100;
  }, [subtotal, taxPercent]);

  const grandTotal = useMemo(() => {
    return Math.max(0, subtotal + taxAmount - discount);
  }, [subtotal, taxAmount, discount]);

  // Checkout Initiation Handler — Checks if 'All Outlets' is selected
  const handleInitiateCheckout = () => {
    if (isAllOutletsSelected) {
      setIsOutletSelectModalOpen(true);
      return;
    }

    if (cart.length === 0) return;

    setIsCheckoutOpen(true);
  };

  // Order Submission Handler
  const handleProcessCheckout = async () => {
    if (cart.length === 0) return;

    // Strict validation: Require explicit outlet selection
    if (isAllOutletsSelected) {
      setIsCheckoutOpen(false);
      setIsOutletSelectModalOpen(true);
      return;
    }

    const payload: CreateOrderPayload = {
      orderSource: "COUNTER",
      outletId: currentOutletId || undefined,
      items: cart.map((ci) => ({
        menuItemId: ci.menuItem.id,
        quantity: ci.quantity,
        notes: ci.notes,
      })),
      paymentMethod,
      discountAmount: discount,
      taxAmount: taxAmount,
    };

    try {
      const result = await createOrder(payload).unwrap();
      setCompletedOrder(result);
      setCart([]);
      setIsCheckoutOpen(false);
      setIsMobileCartOpen(false);
    } catch (err: any) {
      console.error("Order creation failed:", err);
      alert(err?.data?.message || "Failed to create order. Please try again.");
    }
  };

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-4.5rem)] flex flex-col lg:flex-row overflow-hidden bg-slate-100 text-[#1B2A4A] relative">
        
        {/* ── LEFT CONTAINER: Menu Catalog & Controls ───────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden p-3 lg:p-4 gap-3">
          
          {/* Top Bar: Counter Direct Mode Badge + Search & Controls */}
          <div className="bg-white rounded-xl border border-gray-200 p-3 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
            
            {/* Mode Badge — Counter Direct Only */}
            <div className="flex items-center gap-2 bg-[#1B2A4A] text-white px-3.5 py-1.5 rounded-xl font-black text-xs shadow-xs shrink-0">
              <CreditCard className="w-4 h-4 text-rose-400" />
              <span>Counter Direct POS</span>
            </div>

            {/* Search & Layout View Toggle */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search item or category..."
                  value={searchQuery}
                  disabled={isAllOutletsSelected}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-9 pr-8 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:outline-none focus:border-[#1B2A4A] focus:bg-white transition disabled:opacity-50"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200 shrink-0">
                <button
                  onClick={() => setViewMode("GRID")}
                  title="Grid View"
                  className={`p-1.5 rounded-lg transition ${
                    viewMode === "GRID"
                      ? "bg-white text-[#1B2A4A] shadow-xs font-bold"
                      : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("LIST")}
                  title="Fast List View"
                  className={`p-1.5 rounded-lg transition ${
                    viewMode === "LIST"
                      ? "bg-white text-[#1B2A4A] shadow-xs font-bold"
                      : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Category Tabs Bar */}
          {!isAllOutletsSelected && (
            <div className="bg-white rounded-xl border border-gray-200 p-2 shadow-xs flex items-center gap-2 overflow-x-auto scrollbar-none shrink-0">
              <button
                onClick={() => {
                  setSelectedCategoryId("ALL");
                  setCurrentPage(1);
                }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold whitespace-nowrap transition cursor-pointer border ${
                  selectedCategoryId === "ALL"
                    ? "bg-[#1B2A4A] text-white border-[#1B2A4A] shadow-xs"
                    : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                }`}
              >
                All Items ({menuItems.length})
              </button>
              {categoriesDeduplicated.map((cat) => {
                const isSelected = selectedCategoryId === cat.id;
                const count = menuItems.filter(
                  (item) => item.categoryId === cat.id
                ).length;
                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setSelectedCategoryId(cat.id);
                      setCurrentPage(1);
                    }}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold whitespace-nowrap transition cursor-pointer border flex items-center gap-1.5 ${
                      isSelected
                        ? "bg-[#1B2A4A] text-white border-[#1B2A4A] shadow-xs"
                        : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                    }`}
                  >
                    {cat.imageUrl && (
                      <img
                        src={getImageUrl(cat.imageUrl)}
                        alt=""
                        className="w-3.5 h-3.5 rounded-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLElement).style.display = "none";
                        }}
                      />
                    )}
                    {cat.name}
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded font-black ${
                        isSelected
                          ? "bg-white/20 text-white"
                          : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Menu Product Display Grid / List / Clean Unified Outlet Prompt */}
          <div className="flex-1 overflow-y-auto pr-1 flex flex-col">
            {isAllOutletsSelected ? (
              /* CLEAN UNIFIED PROMPT: Require Outlet Selection */
              <div className="my-auto bg-white rounded-2xl border border-gray-200 p-8 sm:p-12 text-center space-y-4 shadow-sm flex flex-col items-center justify-center max-w-lg mx-auto">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 text-[#1B2A4A] border border-gray-200 flex items-center justify-center shadow-xs">
                  <Store className="w-8 h-8" />
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-base font-black text-[#1B2A4A]">
                    Select an Outlet to View Menu & Take Orders
                  </h3>
                  <p className="text-xs text-gray-500 font-medium leading-relaxed">
                    Choose an outlet location from the header filter or click below to view its menu items and take orders.
                  </p>
                </div>

                {specificOutlets.length > 0 && (
                  <button
                    onClick={() => setIsOutletSelectModalOpen(true)}
                    className="px-5 py-2.5 bg-[#1B2A4A] hover:bg-[#2d4272] text-white text-xs font-black rounded-xl shadow-md transition cursor-pointer flex items-center gap-2"
                  >
                    <Store className="w-4 h-4 text-rose-400" />
                    Select Outlet Location
                  </button>
                )}
              </div>
            ) : isLoadingMenu ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-3">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => (
                  <div
                    key={n}
                    className="h-28 bg-white animate-pulse rounded-xl border border-gray-200"
                  />
                ))}
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center space-y-3 shadow-xs my-auto">
                <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto">
                  <Utensils className="w-7 h-7 text-gray-400" />
                </div>
                <p className="text-sm font-bold text-gray-700">No dishes match filter</p>
                <p className="text-xs text-gray-400 max-w-xs mx-auto">
                  Try clearing your search query or selecting a different category.
                </p>
              </div>
            ) : viewMode === "GRID" ? (
              /* GRID VIEW */
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-3 pb-20 lg:pb-0">
                {filteredItems
                  .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                  .map((item) => {
                    const cartEntry = cart.find(
                      (ci) => ci.menuItem.id === item.id
                    );
                    const cartQty = cartEntry ? cartEntry.quantity : 0;
                    const isSelected = cartQty > 0;

                    return (
                      <div
                        key={item.id}
                        className={`bg-white border rounded-2xl p-3 flex flex-col justify-between transition-all select-none shadow-2xs hover:shadow-md relative group ${
                          isSelected
                            ? "border-[#D3232A] bg-rose-50/20 ring-1 ring-[#D3232A]/30"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        {/* Top Badge: Category & Quantity Indicator */}
                        <div className="flex items-center justify-between gap-1 mb-1.5">
                          <span className="text-[9px] uppercase tracking-wider font-extrabold text-gray-400 truncate">
                            {item.category?.name || "General"}
                          </span>
                          <span
                            className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                              item.isVeg ? "bg-emerald-500" : "bg-rose-500"
                            }`}
                            title={item.isVeg ? "Veg" : "Non-Veg"}
                          />
                        </div>

                        {/* Title */}
                        <h4 className="text-xs font-bold text-[#1B2A4A] group-hover:text-[#D3232A] transition line-clamp-2 leading-snug mb-2">
                          {item.name}
                        </h4>

                        {/* Quantity Badge if in cart */}
                        {isSelected && (
                          <div className="mb-2">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-[#D3232A] text-white shadow-xs">
                              <Check className="w-2.5 h-2.5" />
                              {cartQty} in Ticket
                            </span>
                          </div>
                        )}

                        {/* Footer: Price & Stepper Button */}
                        <div className="flex justify-between items-center pt-2 border-t border-gray-100 mt-auto">
                          <span className="text-xs font-black text-[#1B2A4A]">
                            ₹{Number(item.price).toFixed(2)}
                          </span>

                          {cartQty === 0 ? (
                            <button
                              onClick={() => addToCart(item)}
                              type="button"
                              className="w-7 h-7 rounded-lg bg-[#D3232A]/10 border border-[#D3232A]/20 flex items-center justify-center text-[#D3232A] hover:bg-[#D3232A] hover:text-white transition cursor-pointer"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          ) : (
                            <div className="flex items-center gap-1 bg-white border border-[#D3232A]/40 rounded-lg p-0.5 shadow-2xs">
                              <button
                                onClick={() => updateQuantity(item.id, -1)}
                                type="button"
                                className="w-5 h-5 rounded bg-gray-100 hover:bg-rose-100 hover:text-rose-700 flex items-center justify-center text-gray-700 font-bold transition"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="text-xs font-black text-[#1B2A4A] px-1">
                                {cartQty}
                              </span>
                              <button
                                onClick={() => updateQuantity(item.id, 1)}
                                type="button"
                                className="w-5 h-5 rounded bg-[#D3232A] text-white hover:bg-[#b91c23] flex items-center justify-center font-bold transition"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              /* FAST BILLING LIST VIEW */
              <div className="space-y-2 pb-20 lg:pb-0">
                {filteredItems
                  .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                  .map((item) => {
                    const cartEntry = cart.find(
                      (ci) => ci.menuItem.id === item.id
                    );
                    const cartQty = cartEntry ? cartEntry.quantity : 0;
                    const isSelected = cartQty > 0;

                    return (
                      <div
                        key={item.id}
                        className={`bg-white border rounded-xl p-3 flex items-center justify-between gap-3 transition shadow-2xs ${
                          isSelected
                            ? "border-[#D3232A] bg-rose-50/20"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span
                            className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                              item.isVeg ? "bg-emerald-500" : "bg-rose-500"
                            }`}
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs font-bold text-[#1B2A4A]">
                                {item.name}
                              </h4>
                              {isSelected && (
                                <span className="text-[10px] font-black px-1.5 py-0.2 rounded bg-[#D3232A] text-white">
                                  {cartQty}×
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-gray-400 font-medium">
                              {item.category?.name || "General"}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-xs font-black text-[#1B2A4A]">
                            ₹{Number(item.price).toFixed(2)}
                          </span>

                          {cartQty === 0 ? (
                            <button
                              onClick={() => addToCart(item)}
                              className="px-3 py-1 rounded-lg bg-[#D3232A]/10 border border-[#D3232A]/20 text-[#D3232A] hover:bg-[#D3232A] hover:text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Add</span>
                            </button>
                          ) : (
                            <div className="flex items-center gap-1 bg-white border border-[#D3232A]/40 rounded-lg p-1 shadow-2xs">
                              <button
                                onClick={() => updateQuantity(item.id, -1)}
                                className="w-6 h-6 rounded bg-gray-100 hover:bg-rose-100 hover:text-rose-700 flex items-center justify-center text-gray-700 font-bold transition"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="text-xs font-black text-[#1B2A4A] px-2">
                                {cartQty}
                              </span>
                              <button
                                onClick={() => updateQuantity(item.id, 1)}
                                className="w-6 h-6 rounded bg-[#D3232A] text-white hover:bg-[#b91c23] flex items-center justify-center font-bold transition"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>

          {/* Pagination Controls */}
          {!isAllOutletsSelected && filteredItems.length > pageSize && (
            <div className="bg-white rounded-xl border border-gray-200 p-2.5 flex items-center justify-between text-xs text-gray-500 shrink-0">
              <span>
                Showing {(currentPage - 1) * pageSize + 1} -{" "}
                {Math.min(currentPage * pageSize, filteredItems.length)} of{" "}
                {filteredItems.length} items
              </span>
              <div className="flex items-center gap-1">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                  className="px-3 py-1 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 disabled:opacity-40 font-bold cursor-pointer"
                >
                  Prev
                </button>
                <span className="px-2 font-black text-[#1B2A4A]">
                  {currentPage} / {Math.ceil(filteredItems.length / pageSize)}
                </span>
                <button
                  disabled={
                    currentPage >= Math.ceil(filteredItems.length / pageSize)
                  }
                  onClick={() => setCurrentPage((p) => p + 1)}
                  className="px-3 py-1 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 disabled:opacity-40 font-bold cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT SIDEBAR: POS Order Ticket / Cart (ALWAYS Visible on Desktop) ── */}
        <div className="hidden lg:flex w-full lg:w-[380px] xl:w-[420px] shrink-0 h-full flex-col bg-white border-l border-gray-200 shadow-xl z-20 overflow-hidden">
          
          {/* Cart Ticket Header */}
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-[#D3232A]/10 text-[#D3232A]">
                <ShoppingCart className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-black text-[#1B2A4A] leading-tight">
                  Current Ticket
                </h2>
                <p className="text-[10px] text-gray-500 font-medium">
                  {isAllOutletsSelected
                    ? "Select an outlet location"
                    : "Counter Direct Order"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs px-2.5 py-1 rounded-full bg-[#1B2A4A] text-white font-black">
                {totalItemCount} items
              </span>
              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  title="Clear Ticket"
                  className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Ticket Cart Items Scrollable Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
            {isAllOutletsSelected ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 py-16 text-center space-y-2">
                <Store className="w-8 h-8 text-gray-300 opacity-60" />
                <p className="text-xs font-black text-gray-700">
                  No Outlet Selected
                </p>
                <p className="text-[11px] text-gray-400 max-w-[200px]">
                  Select an outlet location to build order tickets.
                </p>
              </div>
            ) : cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 py-16 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                  <ShoppingCart className="w-6 h-6 text-gray-300" />
                </div>
                <p className="text-xs font-extrabold text-gray-600">
                  Ticket is currently empty
                </p>
                <p className="text-[11px] text-gray-400 max-w-[200px]">
                  Click dishes on the left panel to build the order ticket.
                </p>
              </div>
            ) : (
              cart.map((ci) => {
                const itemTotal = ci.menuItem.price * ci.quantity;
                const isEditingNote = editingNoteItemId === ci.menuItem.id;

                return (
                  <div
                    key={ci.menuItem.id}
                    className="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-2 hover:border-gray-300 transition"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <h5 className="text-xs font-black text-[#1B2A4A] truncate">
                          {ci.menuItem.name}
                        </h5>
                        <p className="text-[11px] text-gray-500 font-semibold">
                          ₹{Number(ci.menuItem.price).toFixed(2)} × {ci.quantity}
                        </p>
                      </div>
                      <span className="text-xs font-black text-[#1B2A4A] shrink-0">
                        ₹{itemTotal.toFixed(2)}
                      </span>
                    </div>

                    {/* Controls & Notes */}
                    <div className="flex items-center justify-between pt-1 border-t border-gray-200/60">
                      <button
                        type="button"
                        onClick={() =>
                          setEditingNoteItemId(isEditingNote ? null : ci.menuItem.id)
                        }
                        className={`text-[10px] font-bold flex items-center gap-1 ${
                          ci.notes
                            ? "text-[#D3232A]"
                            : "text-gray-400 hover:text-gray-600"
                        }`}
                      >
                        <FileText className="w-3 h-3" />
                        {ci.notes ? "Edit Note" : "+ Note"}
                      </button>

                      <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg p-0.5 shadow-2xs">
                        <button
                          onClick={() => updateQuantity(ci.menuItem.id, -1)}
                          className="w-5 h-5 rounded bg-gray-100 hover:bg-rose-100 hover:text-rose-700 flex items-center justify-center text-gray-700 font-bold transition"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-black text-[#1B2A4A] px-1">
                          {ci.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(ci.menuItem.id, 1)}
                          className="w-5 h-5 rounded bg-[#1B2A4A] text-white hover:bg-[#2d4272] flex items-center justify-center font-bold transition"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => removeFromCart(ci.menuItem.id)}
                          className="w-5 h-5 rounded hover:bg-rose-100 hover:text-rose-700 flex items-center justify-center text-gray-400 transition ml-1"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Note input toggle */}
                    {(isEditingNote || ci.notes) && (
                      <input
                        type="text"
                        placeholder="Special instructions (e.g. less spice)..."
                        value={ci.notes || ""}
                        onChange={(e) => updateItemNote(ci.menuItem.id, e.target.value)}
                        className="w-full px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-[11px] font-medium text-gray-900 focus:outline-none focus:border-[#1B2A4A]"
                      />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Payment & Summary Footer */}
          <div className="p-4 border-t border-gray-200 bg-gray-50 space-y-3 shrink-0">
            {/* Financial breakdown */}
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-gray-600 font-medium">
                <span>Subtotal</span>
                <span className="font-bold text-gray-900">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600 font-medium">
                <span>GST Tax ({taxPercent}%)</span>
                <span className="font-bold text-gray-900">₹{taxAmount.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-rose-600 font-bold">
                  <span>Discount</span>
                  <span>-₹{discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-black text-[#1B2A4A] pt-2 border-t border-gray-200">
                <span>Total Amount</span>
                <span className="text-[#D3232A] text-base">₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Primary Order Action Button */}
            <button
              disabled={isAllOutletsSelected || cart.length === 0 || isSubmitting}
              onClick={handleInitiateCheckout}
              className="w-full py-3 bg-[#D3232A] hover:bg-[#b91c23] text-white text-xs font-black rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Receipt className="w-4 h-4" />
              {isAllOutletsSelected
                ? "Select Outlet to Proceed"
                : `Proceed to Payment (₹${grandTotal.toFixed(2)})`}
            </button>
          </div>
        </div>

        {/* ── MOBILE / TABLET STICKY BOTTOM BAR (< lg screen) ────────────────── */}
        {cart.length > 0 && (
          <div className="lg:hidden fixed bottom-0 left-0 right-0 p-3 bg-[#1B2A4A] text-white flex items-center justify-between shadow-2xl z-40 border-t border-slate-700">
            <div>
              <p className="text-xs font-black flex items-center gap-1.5">
                <ShoppingCart className="w-4 h-4 text-[#D3232A]" />
                {totalItemCount} Items • ₹{grandTotal.toFixed(2)}
              </p>
              <p className="text-[10px] text-gray-300">
                {isAllOutletsSelected ? "⚠️ Select Outlet First" : "Counter Direct Order"}
              </p>
            </div>

            <button
              onClick={() => setIsMobileCartOpen(true)}
              className="px-4 py-2 bg-[#D3232A] hover:bg-[#b91c23] text-white text-xs font-black rounded-xl shadow-xs transition flex items-center gap-1 cursor-pointer"
            >
              <span>View Ticket & Pay</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ── MOBILE CART DRAWER OVERLAY (< lg screen) ────────────────────────── */}
        {isMobileCartOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex flex-col bg-gray-900/60 backdrop-blur-sm">
            <div className="mt-auto bg-white rounded-t-2xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
              <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-[#D3232A]" />
                  <h3 className="text-sm font-black text-[#1B2A4A]">Current Ticket</h3>
                </div>
                <button
                  onClick={() => setIsMobileCartOpen(false)}
                  className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Cart items */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {cart.map((ci) => (
                  <div
                    key={ci.menuItem.id}
                    className="p-3 bg-gray-50 border border-gray-200 rounded-xl flex justify-between items-center"
                  >
                    <div>
                      <p className="text-xs font-black text-[#1B2A4A]">
                        {ci.menuItem.name}
                      </p>
                      <p className="text-[10px] text-gray-500">
                        ₹{ci.menuItem.price} × {ci.quantity} = ₹
                        {(ci.menuItem.price * ci.quantity).toFixed(2)}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg p-0.5">
                      <button
                        onClick={() => updateQuantity(ci.menuItem.id, -1)}
                        className="w-6 h-6 rounded bg-gray-100 flex items-center justify-center font-bold"
                      >
                        -
                      </button>
                      <span className="text-xs font-black px-1">{ci.quantity}</span>
                      <button
                        onClick={() => updateQuantity(ci.menuItem.id, 1)}
                        className="w-6 h-6 rounded bg-[#1B2A4A] text-white flex items-center justify-center font-bold"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-gray-200 bg-gray-50 space-y-3">
                <div className="flex justify-between text-sm font-black">
                  <span>Total Payable</span>
                  <span className="text-[#D3232A]">₹{grandTotal.toFixed(2)}</span>
                </div>

                <button
                  disabled={cart.length === 0 || isSubmitting || isAllOutletsSelected}
                  onClick={() => {
                    setIsMobileCartOpen(false);
                    handleInitiateCheckout();
                  }}
                  className="w-full py-3 bg-[#D3232A] text-white text-xs font-black rounded-xl shadow-md cursor-pointer disabled:opacity-50"
                >
                  Proceed to Payment
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── SELECT OUTLET REQUIRED MODAL ────────────────────────────────────── */}
        {isOutletSelectModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
            <div className="bg-white border border-gray-200 rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 rounded-xl bg-slate-100 text-[#1B2A4A]">
                    <Store className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-[#1B2A4A]">
                      Select Outlet Location
                    </h3>
                    <p className="text-xs text-gray-500 font-medium">
                      Choose an outlet to load menu & place orders.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOutletSelectModalOpen(false)}
                  className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pt-1">
                <label className="block text-xs font-black text-gray-700">
                  Available Outlets ({specificOutlets.length})
                </label>
                {specificOutlets.length === 0 ? (
                  <p className="text-xs text-gray-500 italic p-3 text-center bg-gray-50 rounded-xl">
                    No specific outlets found. Please configure an outlet in Location Manager.
                  </p>
                ) : (
                  specificOutlets.map((outlet) => (
                    <button
                      key={outlet.id}
                      type="button"
                      onClick={() => {
                        setActiveBranch(outlet);
                        setIsOutletSelectModalOpen(false);
                      }}
                      className="w-full p-3 rounded-xl border border-gray-200 hover:border-[#1B2A4A] hover:bg-gray-50 text-left transition flex items-center justify-between group cursor-pointer"
                    >
                      <div>
                        <p className="text-xs font-black text-[#1B2A4A] group-hover:text-[#D3232A]">
                          {outlet.name}
                        </p>
                        {outlet.address && (
                          <p className="text-[11px] text-gray-400 font-medium">
                            {outlet.address}
                          </p>
                        )}
                      </div>
                      <span className="px-3 py-1 rounded-lg bg-[#1B2A4A] text-white text-[11px] font-bold group-hover:bg-[#D3232A] transition">
                        Select & Load Menu
                      </span>
                    </button>
                  ))
                )}
              </div>

              <div className="pt-2 border-t border-gray-100 text-center">
                <button
                  type="button"
                  onClick={() => setIsOutletSelectModalOpen(false)}
                  className="w-full py-2.5 border border-gray-300 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── CHECKOUT PAYMENT MODAL ─────────────────────────────────────────── */}
        {isCheckoutOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
            <div className="bg-white border border-gray-200 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-5 shadow-2xl space-y-5">
              <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-[#D3232A]" />
                  <h3 className="text-base font-black text-[#1B2A4A]">
                    Payment Checkout
                  </h3>
                </div>
                <button
                  onClick={() => setIsCheckoutOpen(false)}
                  className="p-1 rounded-lg text-gray-400 hover:bg-gray-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Selected Outlet Summary */}
              {activeBranch && (
                <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between text-xs">
                  <span className="text-gray-500 font-medium flex items-center gap-1">
                    <Store className="w-3.5 h-3.5 text-gray-400" /> Fulfilling Outlet:
                  </span>
                  <span className="font-black text-[#1B2A4A]">{activeBranch.name}</span>
                </div>
              )}

              {/* Payment Method Selector */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">
                  Select Payment Method
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["UPI", "CARD", "CASH"] as const).map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className={`py-3 rounded-xl border text-xs font-black transition flex flex-col items-center gap-1 cursor-pointer ${
                        paymentMethod === method
                          ? "bg-[#1B2A4A] text-white border-[#1B2A4A] shadow-md"
                          : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                      }`}
                    >
                      {method === "UPI" && <QrCode className="w-4 h-4" />}
                      {method === "CARD" && <CreditCard className="w-4 h-4" />}
                      {method === "CASH" && <DollarSign className="w-4 h-4" />}
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="bg-[#1B2A4A]/5 p-4 rounded-xl border border-gray-200 space-y-2 text-xs">
                <div className="flex justify-between text-gray-600 font-medium">
                  <span>Subtotal</span>
                  <span className="font-bold text-gray-900">₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600 font-medium">
                  <span>Tax ({taxPercent}% GST)</span>
                  <span className="font-bold text-gray-900">₹{taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-black text-[#1B2A4A] pt-2 border-t border-gray-200">
                  <span>Grand Total</span>
                  <span className="text-[#D3232A]">₹{grandTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCheckoutOpen(false)}
                  className="flex-1 py-2.5 border border-gray-300 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50"
                >
                  Back to Ticket
                </button>
                <button
                  type="button"
                  onClick={handleProcessCheckout}
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 bg-[#D3232A] hover:bg-[#b91c23] text-white text-xs font-black rounded-xl shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? "Processing..." : "Confirm & Pay"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── ORDER COMPLETE CONFIRMATION MODAL ──────────────────────────────── */}
        {completedOrder && (() => {
          const orderObj = completedOrder?.data || completedOrder;
          const displayOrderId =
            orderObj?.orderNo ||
            orderObj?.orderNumber ||
            (orderObj?.id ? `#${orderObj.id.slice(0, 8)}` : "ORD-SUCCESS");

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
              <div className="bg-white border border-gray-200 rounded-2xl max-w-sm w-full p-6 shadow-2xl text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 className="w-8 h-8" />
                </div>

                <div>
                  <h3 className="text-lg font-black text-[#1B2A4A]">
                    Order Placed Successfully!
                  </h3>
                  <p className="text-xs text-gray-500 font-medium mt-1">
                    Ticket ID:{" "}
                    <span className="font-mono text-[#D3232A] font-extrabold">
                      {displayOrderId}
                    </span>
                  </p>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold p-3 rounded-xl">
                  Order dispatched live to Kitchen Dispatch (KDS).
                </div>

                <button
                  onClick={() => setCompletedOrder(null)}
                  className="w-full py-3 bg-[#1B2A4A] hover:bg-[#2d4272] text-white text-xs font-black rounded-xl shadow-md transition cursor-pointer"
                >
                  Start Next Order Ticket
                </button>
              </div>
            </div>
          );
        })()}

      </div>
    </DashboardLayout>
  );
}
