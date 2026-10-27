"use client";

import { TModal } from "@/components/ui/TModal";
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
  ChefHat,
  Printer,
  User,
  Tag,
  ChevronLeft,
  PanelRightClose,
  PanelRightOpen,
  StickyNote,
  Banknote,
  SlidersHorizontal,
} from "lucide-react";
import {
  useValidateRestaurantCouponMutation,
  ValidateCouponResponse,
} from "@/redux/slices/restaurantCouponApiSlice";
import {
  autoPrintKOT as dispatchHardwareAutoPrintKOT,
} from "@/lib/bluetoothAutoPrinter";
import ThermalReceipt from "./ThermalReceipt";
import DashboardLayout from "../layout/DashboardLayout";
import { getImageUrl } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useBranch } from "@/lib/BranchContext";
import { useAppSelector } from "@/redux/store/hooks";
import { getKitchenModeCapabilities } from "@/lib/kitchenMode";
import { fetchTables, TableItem } from "@/lib/api";
import { useGetEmployeesQuery } from "@/redux/slices/employeeApiSlice";
import { useGetOutletsQuery } from "@/redux/slices/outletApiSlice";
import { estimateBill, GstRegistrationType } from "@/lib/billing";
import OfflineBadge from "./OfflineBadge";
import { showToast } from "@/lib/toast";
import {
  offlineBillingExpired,
  reportNetworkFailure,
  startConnectivityMonitor,
  useOfflineStatus,
} from "@/lib/offline/offlineStatus";
import { loadOfflinePack, saveOfflinePack, type OfflinePack } from "@/lib/offline/offlinePack";
import { createOfflineOrder } from "@/lib/offline/offlineOrders";
import { onSyncOutcome, startSyncWorker } from "@/lib/offline/syncQueue";
import { registerPosServiceWorker } from "@/lib/offline/serviceWorker";

/** No answer from the server at all (as opposed to the server saying no). */
const isNetworkError = (err: unknown) => {
  const status = (err as { status?: unknown } | null)?.status;
  return status === "FETCH_ERROR" || status === "TIMEOUT_ERROR" || err instanceof TypeError;
};

export interface CartModifierItem {
  id?: string;
  name: string;
  price: number;
  isVariant?: boolean;
}

export interface CartItem {
  cartItemId: string;
  menuItem: MenuItem;
  quantity: number;
  notes?: string;
  selectedModifiers?: CartModifierItem[];
  unitPrice: number;
}

type DietaryType = "VEG" | "NON_VEG" | "VEGAN";

const formatMoney = (amount: number) => `₹${Number(amount).toFixed(2)}`;

const getDietaryType = (item: MenuItem): DietaryType =>
  (item.dietaryType as DietaryType) || (item.isVeg !== false ? "VEG" : "NON_VEG");

const DIET_STYLES: Record<DietaryType, { border: string; dot: string; label: string }> = {
  VEG: { border: "border-emerald-600", dot: "bg-emerald-600", label: "Vegetarian" },
  NON_VEG: { border: "border-rose-600", dot: "bg-rose-600", label: "Non-vegetarian" },
  VEGAN: { border: "border-teal-600", dot: "bg-teal-600", label: "Vegan" },
};

// Standard veg / non-veg square mark
function DietMark({ type, className = "" }: { type: DietaryType; className?: string }) {
  const style = DIET_STYLES[type] || DIET_STYLES.VEG;
  return (
    <span
      title={style.label}
      className={`inline-flex items-center justify-center w-3.5 h-3.5 shrink-0 rounded-[3px] border bg-white ${style.border} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
    </span>
  );
}

// Flags items that open the options pop-up (sizes / add-ons)
function CustomisableBadge() {
  return (
    <span className="inline-flex items-center gap-1 h-[18px] px-1.5 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-semibold shrink-0">
      <SlidersHorizontal className="w-2.5 h-2.5" />
      Customisable
    </span>
  );
}

function SummaryRow({ label, value, tone }: { label: string; value: string; tone?: "positive" }) {
  return (
    <div className={`flex justify-between ${tone === "positive" ? "text-emerald-700" : "text-slate-500"}`}>
      <span>{label}</span>
      <span className={`tabular-nums ${tone === "positive" ? "" : "text-slate-800"}`}>{value}</span>
    </div>
  );
}

const inputClass =
  "w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-[13px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100 transition";

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-semibold text-slate-700">{children}</p>;
}

function ModalHeader({
  icon,
  title,
  subtitle,
  onClose,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  onClose: () => void;
}) {
  return (
    <div className="flex items-start gap-3 px-5 py-4 border-b border-slate-100 shrink-0">
      <span className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="font-heading text-[15px] font-bold text-slate-900 leading-tight">{title}</h3>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5 truncate">{subtitle}</p>}
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="w-8 h-8 -mr-1.5 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer shrink-0"
      >
        <X className="w-[18px] h-[18px]" />
      </button>
    </div>
  );
}

export default function PosTerminalComponent() {
  const user = useAppSelector((state) => state.auth.user);
  const isStaffRole = user?.role === "STAFF";

  const { activeBranch, setActiveBranch, branches } = useBranch();
  const offlineStatus = useOfflineStatus();

  // The menu, outlet and tables saved for offline billing. Only read back when the POS is reloaded with
  // no internet: an open POS keeps what it loaded in memory.
  const [offlinePack, setOfflinePack] = useState<OfflinePack | null>(null);
  useEffect(() => {
    startConnectivityMonitor();
    startSyncWorker();
    void registerPosServiceWorker();
    void loadOfflinePack().then(setOfflinePack);
    return onSyncOutcome((o) => {
      if (o.synced > 0) {
        showToast.success("Offline bills synced", `${o.synced} ${o.synced === 1 ? "bill" : "bills"} saved to the server.`);
      }
      if (o.rejected > 0) {
        showToast.error("Some offline bills were refused", "Open the connection badge at the top of the POS to see them.");
      }
      o.warnings.forEach((w) => showToast.warning("Offline bill left open", w));
    });
  }, []);
  const offlineOutletId = !offlineStatus.online && offlinePack ? offlinePack.outletId : null;

  const currentOutletId =
    activeBranch?.id && activeBranch.id !== "all" ? activeBranch.id : offlineOutletId;
  const isAllOutletsSelected = !currentOutletId;

  // List of specific outlets excluding "all"
  const specificOutlets = useMemo(() => {
    return branches.filter((b) => b.id !== "all");
  }, [branches]);

  // Employee data for staff matching (only fetched for STAFF role)
  const { data: employeesRaw } = useGetEmployeesQuery(
    currentOutletId ? { outletId: currentOutletId, limit: 200, offset: 0 } : undefined,
    { skip: !currentOutletId || !isStaffRole }
  );

  const allEmployees: any[] = useMemo(() => {
    if (!employeesRaw) return [];
    return Array.isArray(employeesRaw) ? employeesRaw : (employeesRaw as any)?.data || [];
  }, [employeesRaw]);

  const myEmployee = useMemo(() => {
    return allEmployees.find((e: any) => e.userId === user?.id);
  }, [allEmployees, user?.id]);

  const [assignedTables, setAssignedTables] = useState<TableItem[]>([]);
  const [outletTables, setOutletTables] = useState<TableItem[]>([]);
  const [selectedTableNo, setSelectedTableNo] = useState<string>("");

  useEffect(() => {
    async function loadTables() {
      if (!currentOutletId) {
        setAssignedTables([]);
        setSelectedTableNo("");
        return;
      }
      const res = await fetchTables(currentOutletId);
      // Offline: the outlet's tables as they were when the offline copy was saved
      const tables =
        res.ok && res.tables
          ? res.tables
          : offlinePack?.outletId === currentOutletId
            ? (offlinePack.tables as TableItem[])
            : null;
      if (res.ok && res.tables) setOutletTables(res.tables);
      if (tables) {
        if (isStaffRole) {
          const userId = user?.id;
          const empId = myEmployee?.id;
          const assigned = tables.filter(
            (t) =>
              (t.assignedStaffId && (t.assignedStaffId === userId || t.assignedStaffId === empId)) ||
              ((t as any).staffId && ((t as any).staffId === userId || (t as any).staffId === empId))
          );
          setAssignedTables(assigned);
          if (assigned.length > 0) {
            setSelectedTableNo(String(assigned[0].tableNumber));
          } else {
            setSelectedTableNo("");
          }
        } else {
          // For Manager, Business Owner, Super Admin: allow selecting ANY table in the outlet
          setAssignedTables(tables);
        }
      }
    }
    loadTables();
  }, [currentOutletId, myEmployee?.id, user?.id, isStaffRole, offlinePack]);

  // Filtering & Display States
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [dietaryFilter, setDietaryFilter] = useState<"ALL" | "VEG" | "NON_VEG" | "VEGAN">("ALL");
  const [viewMode, setViewMode] = useState<"GRID" | "LIST">("GRID");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 24;

  // Cart & Order Configuration States
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "CARD" | "UPI">("UPI");
  const [editingNoteCartItemId, setEditingNoteCartItemId] = useState<string | null>(null);

  // Petpooja-Style Customization Modal State
  const [customizingItem, setCustomizingItem] = useState<MenuItem | null>(null);
  const [selectedModifiersState, setSelectedModifiersState] = useState<Record<string, CartModifierItem[]>>({});
  const [customizationQty, setCustomizationQty] = useState<number>(1);

  // Coupon States & Handlers
  const [validateCoupon, { isLoading: isValidatingCoupon }] = useValidateRestaurantCouponMutation();
  const [couponInput, setCouponInput] = useState<string>("");
  const [couponError, setCouponError] = useState<string | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<ValidateCouponResponse | null>(null);

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    if (!offlineStatus.online) {
      setCouponError("Coupons need an internet connection to be checked.");
      return;
    }
    setCouponError(null);
    try {
      const res = await validateCoupon({
        code: couponInput.trim().toUpperCase(),
        subtotalAmount: subtotal,
        outletId: currentOutletId || undefined,
      }).unwrap();

      setAppliedCoupon(res);
      setDiscount(res.discountAmount);
      setCouponError(null);
    } catch (err: any) {
      setCouponError(err?.data?.message || err?.message || "Coupon code does not exist");
      setAppliedCoupon(null);
      setDiscount(0);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput("");
    setCouponError(null);
    setDiscount(0);
  };

  // Customer & Receipt Printing States
  const [customerName, setCustomerName] = useState<string>("");
  const [customerPhone, setCustomerPhone] = useState<string>("");
  const [printingOrder, setPrintingOrder] = useState<any>(null);

  const [autoPrintKOT, setAutoPrintKOT] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("alayn_auto_print_kot");
      return saved === null ? true : saved === "true";
    }
    return true;
  });
  // Mobile & Modal UI States
  const [isMobileCartOpen, setIsMobileCartOpen] = useState<boolean>(false);
  const [isCartMinimized, setIsCartMinimized] = useState<boolean>(false);

  // Restore cart panel preference after mount to avoid hydration mismatch
  useEffect(() => {
    setIsCartMinimized(localStorage.getItem("alayn_pos_cart_minimized") === "true");
  }, []);
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
  const { data: liveOutlets } = useGetOutletsQuery();
  const { data: liveCategories } = useGetCategoriesQuery();
  const { data: liveMenuItems, isLoading: isLoadingLiveMenu } = useGetMenuItemsQuery({ isAvailable: true });
  const [createOrder, { isLoading: isSubmitting }] = useCreateOrderMutation();

  // Reloaded with no internet: fall back to the saved offline copy until the server answers again
  const savedPack = !liveMenuItems && !offlineStatus.online ? offlinePack : null;
  const outletsData = useMemo(
    () => (liveOutlets ?? savedPack?.outlets ?? []) as NonNullable<typeof liveOutlets>,
    [liveOutlets, savedPack]
  );
  const categories = useMemo(
    () => (liveCategories ?? savedPack?.categories ?? []) as NonNullable<typeof liveCategories>,
    [liveCategories, savedPack]
  );
  const menuItems = useMemo(
    () => (liveMenuItems ?? savedPack?.menuItems ?? []) as NonNullable<typeof liveMenuItems>,
    [liveMenuItems, savedPack]
  );
  const isLoadingMenu = isLoadingLiveMenu && !savedPack;

  const currentOutlet = outletsData.find((o) => o.id === currentOutletId);

  // Keep the offline copy fresh whenever the POS has everything from the server
  useEffect(() => {
    if (!liveMenuItems || !liveCategories || !liveOutlets || !currentOutletId || !user) return;
    // Only written to storage: the screen keeps using the live data it already has
    void saveOfflinePack({
      user,
      outletId: currentOutletId,
      outlets: liveOutlets,
      categories: liveCategories,
      menuItems: liveMenuItems,
      tables: outletTables,
    });
  }, [liveMenuItems, liveCategories, liveOutlets, currentOutletId, user, outletTables]);

  const kitchenCaps = useMemo(() => {
    const rawMode = (currentOutlet as any)?.kitchenMode || activeBranch?.kitchenMode;
    return getKitchenModeCapabilities(rawMode);
  }, [currentOutlet, activeBranch?.kitchenMode]);

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

  // Dynamically detect available dietary types in current outlet menu
  const { hasVegItems, hasNonVegItems, hasVeganItems } = useMemo(() => {
    let veg = false;
    let nonVeg = false;
    let vegan = false;
    (menuItems || []).forEach((item) => {
      const dType = item.dietaryType || (item.isVeg !== false ? "VEG" : "NON_VEG");
      if (dType === "VEGAN") vegan = true;
      else if (dType === "NON_VEG") nonVeg = true;
      else veg = true;
    });
    return { hasVegItems: veg, hasNonVegItems: nonVeg, hasVeganItems: vegan };
  }, [menuItems]);

  // Filter menu items by category, search term, and dietary choice
  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      const matchesCategory =
        selectedCategoryId === "ALL" || item.categoryId === selectedCategoryId;
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.category?.name &&
          item.category.name.toLowerCase().includes(searchQuery.toLowerCase()));
      const itemDietary = item.dietaryType || (item.isVeg !== false ? "VEG" : "NON_VEG");
      const matchesDietary =
        dietaryFilter === "ALL" ||
        (dietaryFilter === "VEG" && itemDietary === "VEG") ||
        (dietaryFilter === "NON_VEG" && itemDietary === "NON_VEG") ||
        (dietaryFilter === "VEGAN" && itemDietary === "VEGAN");

      return matchesCategory && matchesSearch && matchesDietary && item.isAvailable;
    });
  }, [menuItems, selectedCategoryId, searchQuery, dietaryFilter]);

  // Cart Operations — Blocked if 'All Outlets' is active
  const addToCart = (
    item: MenuItem,
    modifiers: CartModifierItem[] = [],
    qty: number = 1,
    computedUnitPrice?: number
  ) => {
    if (isAllOutletsSelected) {
      setIsOutletSelectModalOpen(true);
      return;
    }

    let unitPrice = computedUnitPrice;
    if (unitPrice === undefined) {
      const variantMod = modifiers.find((m) => m.isVariant && Number(m.price) > 0);
      const basePrice = variantMod ? Number(variantMod.price) : (Number(item.price) || 0);
      const extraPrice = modifiers
        .filter((m) => !m.isVariant)
        .reduce((acc, m) => acc + (Number(m.price) || 0), 0);
      unitPrice = basePrice + extraPrice;
    }

    const sortedModIds = [...modifiers].map((m) => m.id || m.name).sort().join(":");
    const cartItemId = sortedModIds ? `${item.id}-${sortedModIds}` : `${item.id}-base`;

    setCart((prev) => {
      const existing = prev.find((ci) => ci.cartItemId === cartItemId);
      if (existing) {
        return prev.map((ci) =>
          ci.cartItemId === cartItemId ? { ...ci, quantity: ci.quantity + qty } : ci
        );
      }
      return [
        ...prev,
        {
          cartItemId,
          menuItem: item,
          quantity: qty,
          selectedModifiers: modifiers,
          unitPrice,
        },
      ];
    });
  };

  const handleItemCardClick = (item: MenuItem) => {
    if (isAllOutletsSelected) {
      setIsOutletSelectModalOpen(true);
      return;
    }

    if (item.modifierGroups && item.modifierGroups.length > 0) {
      // Pre-select mandatory single options
      const initialSelected: Record<string, CartModifierItem[]> = {};
      item.modifierGroups.forEach((mg) => {
        if (mg.minSelection === 1 && mg.maxSelection === 1 && mg.modifiers && mg.modifiers.length > 0) {
          const firstMod = mg.modifiers[0];
          const isVariant = mg.modifiers.some((m: any) => Number(m.price || m.pricePaise) > 0);
          initialSelected[mg.id] = [
            {
              id: firstMod.id,
              name: firstMod.name,
              price: Number(firstMod.price) || 0,
              isVariant,
            },
          ];
        } else {
          initialSelected[mg.id] = [];
        }
      });
      setSelectedModifiersState(initialSelected);
      setCustomizationQty(1);
      setCustomizingItem(item);
    } else {
      addToCart(item);
    }
  };

  const handleItemDecrement = (item: MenuItem) => {
    const matching = cart.filter((ci) => ci.menuItem.id === item.id);
    if (matching.length > 0) {
      const last = matching[matching.length - 1];
      updateQuantity(last.cartItemId, -1);
    }
  };

  const updateQuantity = (cartItemId: string, delta: number) => {
    if (isAllOutletsSelected) {
      setIsOutletSelectModalOpen(true);
      return;
    }

    setCart((prev) =>
      prev
        .map((ci) => {
          if (ci.cartItemId === cartItemId) {
            const newQty = ci.quantity + delta;
            return newQty > 0 ? { ...ci, quantity: newQty } : null;
          }
          return ci;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const updateItemNote = (cartItemId: string, notes: string) => {
    setCart((prev) =>
      prev.map((ci) => (ci.cartItemId === cartItemId ? { ...ci, notes } : ci))
    );
  };

  const removeFromCart = (cartItemId: string) => {
    setCart((prev) => prev.filter((ci) => ci.cartItemId !== cartItemId));
  };

  const clearCart = () => {
    setCart([]);
    setDiscount(0);
    setAppliedCoupon(null);
    setCouponInput("");
    setCouponError(null);
  };

  // Bill Rates & Registration Type
  const billRates = useMemo(() => ({
    cgstRate: Number(currentOutlet?.cgstRateDecimal ?? 2.5),
    sgstRate: Number(currentOutlet?.sgstRateDecimal ?? 2.5),
    serviceChargeRate: Number(currentOutlet?.serviceTaxRateDecimal ?? 0),
  }), [currentOutlet]);

  const gstRegistrationType = (currentOutlet?.gstRegistrationType || "REGULAR") as GstRegistrationType;
  const isDineIn = Boolean(selectedTableNo);

  // Financial Calculations — Single source of truth mirrored from billing.ts
  const billEstimate = useMemo(() => {
    return estimateBill(
      cart.map((ci) => ({ price: ci.unitPrice, quantity: ci.quantity })),
      billRates,
      {
        dineIn: isDineIn,
        discount,
        gstRegistrationType,
      }
    );
  }, [cart, billRates, isDineIn, discount, gstRegistrationType]);

  const subtotal = billEstimate.subtotal;
  const grandTotal = billEstimate.total;
  const taxAmount = billEstimate.cgst + billEstimate.sgst;

  const totalItemCount = useMemo(() => {
    return cart.reduce((acc, ci) => acc + ci.quantity, 0);
  }, [cart]);

  // No internet: save the bill on this device, print as normal, and let the sync queue send it later
  const placeOffline = async (flow: "KITCHEN" | "CHECKOUT", clientOrderId: string) => {
    if (offlineBillingExpired(offlineStatus)) {
      alert("This POS has been offline for 7 days. Connect to the internet to keep billing.");
      return;
    }
    if (!currentOutlet) {
      alert("This outlet's details aren't saved on this device yet. Open the POS once with internet to bill offline.");
      return;
    }
    if (appliedCoupon) {
      alert("Coupons need an internet connection. Remove the coupon to bill offline.");
      return;
    }
    const finalOrderSource = selectedTableNo ? "TABLE" : "COUNTER";
    try {
      const { order, addedToOpenBill } = await createOfflineOrder({
        clientOrderId,
        outlet: currentOutlet as unknown as Parameters<typeof createOfflineOrder>[0]["outlet"],
        cart,
        source: finalOrderSource,
        tableNo: finalOrderSource === "TABLE" ? selectedTableNo : undefined,
        discount,
        customerName: customerName.trim() || undefined,
        customerPhone: customerPhone.trim() || undefined,
        placedByName: user?.name || "Staff",
        payment: flow === "CHECKOUT" ? paymentMethod : undefined,
      });
      setCompletedOrder({ ...order, _flow: flow });
      const printKot = flow === "KITCHEN" ? kitchenCaps.supportsKotPrint : kitchenCaps.supportsKotPrint && (autoPrintKOT || kitchenCaps.isKotOnly);
      if (printKot) {
        // Only this round goes on the kitchen ticket, even when it joins a table's open bill
        dispatchHardwareAutoPrintKOT({ ...order, items: order.kotItems, orderItems: order.kotItems }, false, "80mm").catch((err: unknown) =>
          console.warn("Offline KOT print:", err)
        );
      }
      showToast.info(
        "Saved offline",
        addedToOpenBill
          ? `Added to table ${selectedTableNo}'s bill. It will sync when the internet is back.`
          : `Bill ${order.orderNumber} is saved on this device and will sync when the internet is back.`
      );
      setCart([]);
      setCustomerName("");
      setCustomerPhone("");
      setIsCheckoutOpen(false);
      setIsMobileCartOpen(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not save the bill on this device.");
    }
  };

  // Send to Kitchen Handler — Directly dispatches order ticket to Kitchen (KDS)
  const handleSendToKitchen = async () => {
    if (cart.length === 0) return;

    if (isAllOutletsSelected) {
      setIsOutletSelectModalOpen(true);
      return;
    }

    const finalOrderSource = selectedTableNo ? "TABLE" : "COUNTER";
    if (isStaffRole && finalOrderSource === "TABLE" && !selectedTableNo) {
      alert("No assigned table selected. Please select an assigned table.");
      return;
    }

    const payload: CreateOrderPayload = {
      orderSource: finalOrderSource,
      tableNo: finalOrderSource === "TABLE" ? selectedTableNo : undefined,
      outletId: currentOutletId || undefined,
      customerName: customerName.trim() || undefined,
      customerPhone: customerPhone.trim() || undefined,
      items: cart.map((ci) => ({
        menuItemId: ci.menuItem.id,
        quantity: ci.quantity,
        notes: ci.notes,
        modifiers: ci.selectedModifiers?.map((m) => ({
          id: m.id,
          name: m.name,
          price: m.price,
          pricePaise: Math.round(m.price * 100),
          isVariant: m.isVariant,
        })),
      })),
      discountAmount: discount,
      taxAmount: taxAmount,
      paymentMethod,
      clientOrderId: crypto.randomUUID(),
    };

    if (!offlineStatus.online) return placeOffline("KITCHEN", payload.clientOrderId!);

    try {
      const result = await createOrder(payload).unwrap();
      setCompletedOrder({ ...result, _flow: "KITCHEN" });
      
      // Directly shoot KOT to connected printer device in the background!
      if (kitchenCaps.supportsKotPrint) {
        dispatchHardwareAutoPrintKOT(result, false, "80mm").catch((err: any) =>
          console.warn("Direct KOT hardware dispatch:", err)
        );
      }

      setCart([]);
      setCustomerName("");
      setCustomerPhone("");
      setIsCheckoutOpen(false);
      setIsMobileCartOpen(false);
    } catch (err: any) {
      if (isNetworkError(err)) {
        reportNetworkFailure();
        return placeOffline("KITCHEN", payload.clientOrderId!);
      }
      console.error("Sending to kitchen failed:", err);
      alert(err?.data?.message || "Failed to send order to kitchen. Please try again.");
    }
  };

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

    const finalOrderSource = selectedTableNo ? "TABLE" : "COUNTER";
    if (isStaffRole && finalOrderSource === "TABLE" && !selectedTableNo) {
      alert("No assigned table selected. You are only allowed to take orders for your assigned tables.");
      return;
    }

    const payload: CreateOrderPayload = {
      orderSource: finalOrderSource,
      tableNo: finalOrderSource === "TABLE" ? selectedTableNo : undefined,
      outletId: currentOutletId || undefined,
      customerName: customerName.trim() || undefined,
      customerPhone: customerPhone.trim() || undefined,
      items: cart.map((ci) => ({
        menuItemId: ci.menuItem.id,
        quantity: ci.quantity,
        notes: ci.notes,
        modifiers: ci.selectedModifiers?.map((m) => ({
          id: m.id,
          name: m.name,
          price: m.price,
          pricePaise: Math.round(m.price * 100),
          isVariant: m.isVariant,
        })),
      })),
      paymentMethod,
      discountAmount: discount,
      couponCode: appliedCoupon?.code,
      couponId: appliedCoupon?.couponId,
      taxAmount: taxAmount,
      clientOrderId: crypto.randomUUID(),
    };

    if (!offlineStatus.online) return placeOffline("CHECKOUT", payload.clientOrderId!);

    try {
      const result = await createOrder(payload).unwrap();
      setCompletedOrder({ ...result, _flow: "CHECKOUT" });
      if (kitchenCaps.supportsKotPrint && (autoPrintKOT || kitchenCaps.isKotOnly)) {
        dispatchHardwareAutoPrintKOT(result, false, "80mm").catch((err) =>
          console.error("Auto print KOT on checkout error:", err)
        );
      }
      setCart([]);
      setCustomerName("");
      setCustomerPhone("");
      setIsCheckoutOpen(false);
      setIsMobileCartOpen(false);
    } catch (err: any) {
      if (isNetworkError(err)) {
        reportNetworkFailure();
        return placeOffline("CHECKOUT", payload.clientOrderId!);
      }
      console.error("Order creation failed:", err);
      alert(err?.data?.message || "Failed to create order. Please try again.");
    }
  };

  const completedOrderObj = completedOrder?.data || completedOrder;
  const isKitchenDispatch = completedOrderObj?._flow === "KITCHEN";
  const displayCompletedOrderId =
    completedOrderObj?.orderNo ||
    completedOrderObj?.orderNumber ||
    (completedOrderObj?.id ? `#${completedOrderObj.id.slice(0, 8)}` : "ORD-SUCCESS");

  const customizationCalculations = useMemo(() => {
    if (!customizingItem) {
      return {
        allSelectedMods: [] as CartModifierItem[],
        extraPerUnit: 0,
        finalUnitPrice: 0,
        finalTotal: 0,
        isValid: false,
        effectiveBasePrice: 0,
        hasVariantGroup: false,
      };
    }

    // Identify variant groups (Mandatory Single Choice where options have standalone prices)
    const variantGroups = (customizingItem.modifierGroups || []).filter(
      (g) => g.minSelection === 1 && g.maxSelection === 1 && (g.modifiers || []).some((m) => Number(m.price || (m as any).pricePaise) > 0)
    );

    let selectedVariantPrice: number | null = null;
    let extraPerUnit = 0;
    const allSelectedMods: CartModifierItem[] = [];

    (customizingItem.modifierGroups || []).forEach((group) => {
      const isVariantGroup = variantGroups.some((vg) => vg.id === group.id);
      const sel = selectedModifiersState[group.id] || [];

      if (isVariantGroup) {
        if (sel.length > 0) {
          const v = sel[0];
          const vPrice = Number(v.price) || 0;
          if (vPrice > 0) {
            selectedVariantPrice = vPrice;
          }
          allSelectedMods.push({
            id: v.id,
            name: v.name,
            price: vPrice,
            isVariant: true,
          });
        }
      } else {
        // Add-ons / extras
        sel.forEach((m) => {
          const mPrice = Number(m.price) || 0;
          extraPerUnit += mPrice;
          allSelectedMods.push({
            id: m.id,
            name: m.name,
            price: mPrice,
            isVariant: false,
          });
        });
      }
    });

    const effectiveBasePrice = selectedVariantPrice !== null
      ? selectedVariantPrice
      : (Number(customizingItem.price) || 0);

    const finalUnitPrice = effectiveBasePrice + extraPerUnit;
    const finalTotal = finalUnitPrice * customizationQty;

    const isValid = (customizingItem.modifierGroups || []).every((g) => {
      const sel = selectedModifiersState[g.id] || [];
      return sel.length >= g.minSelection;
    });

    return {
      allSelectedMods,
      extraPerUnit,
      finalUnitPrice,
      finalTotal,
      isValid,
      effectiveBasePrice,
      hasVariantGroup: variantGroups.length > 0,
    };
  }, [customizingItem, selectedModifiersState, customizationQty]);

  const customizingDietaryType = customizingItem
    ? customizingItem.dietaryType || (customizingItem.isVeg !== false ? "VEG" : "NON_VEG")
    : null;

  const canSendToKitchen =
    !isAllOutletsSelected && cart.length > 0 && !isSubmitting && !(isStaffRole && !selectedTableNo);

  const orderContextLabel = isAllOutletsSelected
    ? "No outlet selected"
    : selectedTableNo
      ? `Dine-in · Table ${selectedTableNo}`
      : isStaffRole
        ? "Assigned table required"
        : "Counter · Takeaway";

  const pagedItems = filteredItems.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const getCartQty = (itemId: string) =>
    cart.filter((ci) => ci.menuItem.id === itemId).reduce((sum, ci) => sum + ci.quantity, 0);

  const toggleAutoPrintKOT = () => {
    const next = !autoPrintKOT;
    setAutoPrintKOT(next);
    if (typeof window !== "undefined") {
      localStorage.setItem("alayn_auto_print_kot", String(next));
    }
  };

  const toggleCartMinimized = () => {
    const next = !isCartMinimized;
    setIsCartMinimized(next);
    if (typeof window !== "undefined") {
      localStorage.setItem("alayn_pos_cart_minimized", String(next));
    }
  };

  // Shared ticket line items (desktop panel + mobile drawer)
  const renderCartLines = () =>
    cart.map((ci) => {
      const isEditingNote = editingNoteCartItemId === ci.cartItemId;
      return (
        <li key={ci.cartItemId} className="py-3 first:pt-1">
          <div className="flex items-start gap-3">
            <DietMark type={getDietaryType(ci.menuItem)} className="mt-0.5" />
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <p className="text-[13px] font-semibold text-slate-900 leading-snug line-clamp-2">
                  {ci.menuItem.name}
                </p>
                <span className="text-[13px] font-semibold text-slate-900 tabular-nums shrink-0">
                  {formatMoney(ci.unitPrice * ci.quantity)}
                </span>
              </div>

              {ci.selectedModifiers && ci.selectedModifiers.length > 0 && (
                <p className="text-[11px] text-amber-700 mt-0.5 leading-relaxed">
                  {ci.selectedModifiers
                    .map((mod) =>
                      mod.isVariant
                        ? mod.name
                        : `+ ${mod.name}${mod.price > 0 ? ` (${formatMoney(mod.price)})` : ""}`
                    )
                    .join(" · ")}
                </p>
              )}

              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-slate-400 tabular-nums">
                    {formatMoney(ci.unitPrice)} each
                  </span>
                  <button
                    type="button"
                    onClick={() => setEditingNoteCartItemId(isEditingNote ? null : ci.cartItemId)}
                    className={`text-[11px] font-medium flex items-center gap-1 transition cursor-pointer ${
                      ci.notes ? "text-[#D3232A]" : "text-slate-400 hover:text-slate-700"
                    }`}
                  >
                    <StickyNote className="w-3 h-3" />
                    {ci.notes ? "Note" : "Add note"}
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  <div className="flex items-center rounded-lg border border-slate-200 bg-white">
                    <button
                      type="button"
                      onClick={() => updateQuantity(ci.cartItemId, -1)}
                      aria-label="Decrease quantity"
                      className="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-l-lg transition cursor-pointer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-7 text-center text-xs font-semibold text-slate-900 tabular-nums">
                      {ci.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(ci.cartItemId, 1)}
                      aria-label="Increase quantity"
                      className="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-r-lg transition cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFromCart(ci.cartItemId)}
                    aria-label="Remove item"
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {(isEditingNote || ci.notes) && (
                <input
                  type="text"
                  autoFocus={isEditingNote && !ci.notes}
                  placeholder="Special instructions (e.g. less spicy)"
                  value={ci.notes || ""}
                  onChange={(e) => updateItemNote(ci.cartItemId, e.target.value)}
                  className="mt-2 w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-slate-400 transition"
                />
              )}
            </div>
          </div>
        </li>
      );
    });

  // Shared bill breakdown (desktop panel + mobile drawer)
  const renderBillSummary = () => (
    <div className="space-y-1.5 text-xs">
      <SummaryRow label="Subtotal" value={formatMoney(billEstimate.subtotal)} />
      {billEstimate.discount > 0 && (
        <SummaryRow label="Discount" value={`-${formatMoney(billEstimate.discount)}`} tone="positive" />
      )}
      {billEstimate.serviceCharge > 0 && (
        <SummaryRow
          label={`Service charge (${billRates.serviceChargeRate}%)`}
          value={formatMoney(billEstimate.serviceCharge)}
        />
      )}
      {gstRegistrationType === "REGULAR" ? (
        <>
          {billEstimate.cgst > 0 && (
            <SummaryRow label={`CGST (${billRates.cgstRate}%)`} value={formatMoney(billEstimate.cgst)} />
          )}
          {billEstimate.sgst > 0 && (
            <SummaryRow label={`SGST (${billRates.sgstRate}%)`} value={formatMoney(billEstimate.sgst)} />
          )}
        </>
      ) : (
        <SummaryRow
          label={gstRegistrationType === "COMPOSITION" ? "Composition scheme" : "Unregistered"}
          value="No GST"
        />
      )}
      {billEstimate.roundOff !== 0 && (
        <SummaryRow
          label="Round off"
          value={`${billEstimate.roundOff > 0 ? "+" : "-"}${formatMoney(Math.abs(billEstimate.roundOff))}`}
        />
      )}
      <div className="flex items-end justify-between pt-3 mt-1 border-t border-dashed border-slate-200">
        <div>
          <p className="text-[13px] font-semibold text-slate-900">Total payable</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Estimated · final bill at settlement</p>
        </div>
        <span className="font-heading text-xl font-bold text-slate-900 tabular-nums">
          {formatMoney(billEstimate.total)}
        </span>
      </div>
    </div>
  );

  const renderSendToKitchenButton = (onClick: () => void) => (
    <button
      type="button"
      disabled={!canSendToKitchen}
      onClick={onClick}
      className="w-full h-11 rounded-xl text-[13px] font-semibold transition flex items-center justify-center gap-2 cursor-pointer bg-[#1B2A4A] hover:bg-[#24375f] text-white shadow-sm disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none disabled:cursor-not-allowed"
    >
      <ChefHat className="w-4 h-4" />
      {isAllOutletsSelected
        ? "Select an outlet to proceed"
        : cart.length === 0
          ? "Add items to start"
          : isSubmitting
            ? "Sending…"
            : `Send to kitchen · ${totalItemCount} ${totalItemCount === 1 ? "item" : "items"}`}
    </button>
  );

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-4.5rem)] flex overflow-hidden bg-slate-50 text-slate-900 relative md:p-3 lg:p-4 gap-3 lg:gap-4">

        {/* -- LEFT: Menu Catalog -- */}
        <section className="flex-1 flex flex-col min-w-0 h-full overflow-hidden gap-3 p-3 md:p-0">

          {/* Toolbar Card: title, table, KOT, search, filters, categories */}
          <div className="shrink-0 bg-white border border-slate-200/80 rounded-2xl shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 pt-3.5 pb-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-[#1B2A4A] text-white flex items-center justify-center shrink-0">
                  <Store className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h1 className="font-heading text-[15px] font-bold text-slate-900 leading-tight">
                    {isStaffRole ? "Table Order POS" : "Point of Sale"}
                  </h1>
                  <p className="text-xs text-slate-500 truncate">
                    {isAllOutletsSelected ? "Select an outlet to begin" : activeBranch?.name}
                    {!isAllOutletsSelected && (
                      <span className="text-slate-300"> · </span>
                    )}
                    {!isAllOutletsSelected && orderContextLabel}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <OfflineBadge />
                {!isAllOutletsSelected &&
                  (isStaffRole && assignedTables.length === 0 ? (
                    <div className="h-9 flex items-center gap-1.5 px-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-xs font-medium">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      No tables assigned to you
                    </div>
                  ) : (
                    <label className="h-9 flex items-center gap-2 pl-3 pr-1 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition">
                      <Utensils className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="text-xs text-slate-500">Table</span>
                      <select
                        value={selectedTableNo}
                        onChange={(e) => setSelectedTableNo(e.target.value)}
                        className="h-7 bg-transparent text-xs font-semibold text-slate-900 pr-1 focus:outline-none cursor-pointer max-w-[180px]"
                      >
                        {!isStaffRole && <option value="">Counter (no table)</option>}
                        {assignedTables.map((t) => (
                          <option key={t.id} value={String(t.tableNumber)}>
                            Table {t.tableNumber} · {t.tableType}
                            {!isStaffRole && t.status ? ` · ${t.status}` : ""}
                          </option>
                        ))}
                      </select>
                    </label>
                  ))}

                {kitchenCaps.supportsKotPrint && (
                  <button
                    type="button"
                    role="switch"
                    aria-checked={autoPrintKOT}
                    onClick={toggleAutoPrintKOT}
                    title={autoPrintKOT ? "KOT prints automatically when an order is sent" : "Enable automatic KOT printing"}
                    className="h-9 flex items-center gap-2 px-3 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-xs text-slate-600">Auto KOT</span>
                    <span
                      className={`relative w-7 h-4 rounded-full transition-colors ${
                        autoPrintKOT ? "bg-emerald-500" : "bg-slate-300"
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white shadow-sm transition-transform ${
                          autoPrintKOT ? "translate-x-3" : ""
                        }`}
                      />
                    </span>
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-2 px-4 pb-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search dishes or categories"
                  value={searchQuery}
                  disabled={isAllOutletsSelected}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full h-9 pl-9 pr-8 bg-slate-50 border border-slate-200 rounded-xl text-[13px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-slate-400 focus:ring-4 focus:ring-slate-100 transition disabled:opacity-50"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    aria-label="Clear search"
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {!isAllOutletsSelected && (hasNonVegItems || hasVeganItems) && (
                  <div className="flex h-9 items-center p-0.5 bg-slate-100 rounded-xl">
                    {(
                      [
                        { key: "ALL", label: "All", show: true, dot: "" },
                        { key: "VEG", label: "Veg", show: hasVegItems, dot: "bg-emerald-500" },
                        { key: "NON_VEG", label: "Non-veg", show: hasNonVegItems, dot: "bg-rose-500" },
                        { key: "VEGAN", label: "Vegan", show: hasVeganItems, dot: "bg-teal-500" },
                      ] as const
                    )
                      .filter((opt) => opt.show)
                      .map((opt) => (
                        <button
                          key={opt.key}
                          type="button"
                          onClick={() => {
                            setDietaryFilter(opt.key);
                            setCurrentPage(1);
                          }}
                          className={`h-8 px-3 rounded-[10px] text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
                            dietaryFilter === opt.key
                              ? "bg-white text-slate-900 shadow-[0_1px_2px_rgba(15,23,42,0.08)]"
                              : "text-slate-500 hover:text-slate-800"
                          }`}
                        >
                          {opt.dot && <span className={`w-1.5 h-1.5 rounded-full ${opt.dot}`} />}
                          {opt.label}
                        </button>
                      ))}
                  </div>
                )}

                <div className="flex h-9 items-center p-0.5 bg-slate-100 rounded-xl">
                  {(
                    [
                      { key: "GRID", icon: LayoutGrid, label: "Grid view" },
                      { key: "LIST", icon: List, label: "List view" },
                    ] as const
                  ).map(({ key, icon: Icon, label }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setViewMode(key)}
                      title={label}
                      aria-label={label}
                      className={`h-8 w-8 rounded-[10px] flex items-center justify-center transition cursor-pointer ${
                        viewMode === key
                          ? "bg-white text-slate-900 shadow-[0_1px_2px_rgba(15,23,42,0.08)]"
                          : "text-slate-400 hover:text-slate-700"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {!isAllOutletsSelected && (
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none px-4 py-2.5 border-t border-slate-100">
                {[{ id: "ALL", name: "All items", count: menuItems.length }, ...categoriesDeduplicated.map((cat) => {
                  const catNameKey = cat.name.trim().toLowerCase();
                  return {
                    id: cat.id,
                    name: cat.name,
                    count: menuItems.filter(
                      (item) =>
                        item.isAvailable !== false &&
                        (item.categoryId === cat.id ||
                          (item.category?.name && item.category.name.trim().toLowerCase() === catNameKey))
                    ).length,
                  };
                })].map((cat) => {
                  const isSelected = selectedCategoryId === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setSelectedCategoryId(cat.id);
                        setCurrentPage(1);
                      }}
                      className={`h-8 px-3 rounded-lg text-xs whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? "bg-[#1B2A4A] text-white font-semibold"
                          : "text-slate-600 font-medium hover:bg-slate-100 hover:text-slate-900"
                      }`}
                    >
                      {cat.name}
                      <span className={`tabular-nums text-[11px] ${isSelected ? "text-white/60" : "text-slate-400"}`}>
                        {cat.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Menu Items */}
          <div className="flex-1 overflow-y-auto flex flex-col pb-24 md:pb-0 -mx-1 px-1">
            {isAllOutletsSelected ? (
              <div className="my-auto mx-auto max-w-sm text-center flex flex-col items-center py-12">
                <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 text-slate-700 flex items-center justify-center shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
                  <Store className="w-6 h-6" />
                </div>
                <h3 className="font-heading mt-5 text-base font-bold text-slate-900">
                  Choose an outlet to start billing
                </h3>
                <p className="mt-1.5 text-[13px] text-slate-500 leading-relaxed">
                  Pick an outlet from the header or below to load its menu and take orders.
                </p>
                {specificOutlets.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setIsOutletSelectModalOpen(true)}
                    className="mt-5 h-10 px-5 bg-[#1B2A4A] hover:bg-[#24375f] text-white text-[13px] font-semibold rounded-xl shadow-sm transition cursor-pointer flex items-center gap-2"
                  >
                    Select outlet
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            ) : isLoadingMenu ? (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(168px,1fr))] gap-3">
                {Array.from({ length: 12 }).map((_, n) => (
                  <div key={n} className="h-[212px] bg-white animate-pulse rounded-xl border border-slate-200/80" />
                ))}
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="my-auto mx-auto max-w-xs text-center flex flex-col items-center py-12">
                <div className="w-12 h-12 rounded-full bg-white border border-slate-200 flex items-center justify-center">
                  <Search className="w-5 h-5 text-slate-400" />
                </div>
                <p className="mt-4 text-sm font-semibold text-slate-800">No dishes found</p>
                <p className="mt-1 text-xs text-slate-500">
                  Try a different search term, category or filter.
                </p>
              </div>
            ) : viewMode === "GRID" ? (
              <motion.div
                layout
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: { opacity: 0 },
                  visible: { opacity: 1, transition: { staggerChildren: 0.025 } },
                }}
                className="grid grid-cols-[repeat(auto-fill,minmax(168px,1fr))] gap-3 p-px"
              >
                <AnimatePresence mode="popLayout">
                  {pagedItems.map((item) => {
                    const cartQty = getCartQty(item.id);
                    const isSelected = cartQty > 0;
                    const hasModifiers = item.modifierGroups && item.modifierGroups.length > 0;

                    return (
                      <motion.div
                        layout
                        key={item.id}
                        variants={{
                          hidden: { opacity: 0, y: 8 },
                          visible: {
                            opacity: 1,
                            y: 0,
                            transition: { type: "spring", stiffness: 420, damping: 34 },
                          },
                          exit: { opacity: 0, scale: 0.96 },
                        }}
                        role="button"
                        tabIndex={0}
                        onClick={() => handleItemCardClick(item)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            handleItemCardClick(item);
                          }
                        }}
                        className={`group relative bg-white rounded-xl border flex flex-col overflow-hidden select-none cursor-pointer transition-[border-color,box-shadow] duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1B2A4A]/30 ${
                          isSelected
                            ? "border-[#D3232A]/50 shadow-[0_0_0_3px_rgba(211,35,42,0.08)]"
                            : "border-slate-200/80 hover:border-slate-300 hover:shadow-[0_6px_20px_-6px_rgba(15,23,42,0.12)]"
                        }`}
                      >
                        <div className="relative h-24 bg-slate-50 border-b border-slate-100 flex items-center justify-center overflow-hidden">
                          {item.imageUrl ? (
                            <img
                              src={getImageUrl(item.imageUrl)}
                              alt={item.name}
                              className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500 ease-out"
                              onError={(e) => {
                                (e.currentTarget as HTMLElement).style.display = "none";
                              }}
                            />
                          ) : (
                            <Utensils className="w-5 h-5 text-slate-300" />
                          )}
                          <DietMark type={getDietaryType(item)} className="absolute top-2 left-2" />
                          {isSelected && (
                            <motion.span
                              key={cartQty}
                              initial={{ scale: 0.7, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              className="absolute top-2 right-2 min-w-[22px] h-[22px] px-1.5 rounded-full bg-[#D3232A] text-white text-[11px] font-semibold flex items-center justify-center tabular-nums shadow-sm"
                            >
                              {cartQty}
                            </motion.span>
                          )}
                        </div>

                        <div className="flex flex-col flex-1 p-3">
                          <h4 className="text-[13px] font-semibold text-slate-900 leading-snug line-clamp-2 min-h-[2.25rem]">
                            {item.name}
                          </h4>
                          <div className="flex items-center gap-1.5 mt-1 min-w-0">
                            {hasModifiers && <CustomisableBadge />}
                            <span className="text-[11px] text-slate-400 truncate">
                              {item.category?.name || "General"}
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-2 mt-3">
                            <span className="text-sm font-semibold text-slate-900 tabular-nums truncate">
                              {formatMoney(Number(item.price))}
                            </span>

                            <div className="relative h-8 w-[84px] shrink-0" onClick={(e) => e.stopPropagation()}>
                              <AnimatePresence mode="wait" initial={false}>
                                {cartQty === 0 ? (
                                  <motion.button
                                    key="add"
                                    type="button"
                                    initial={{ opacity: 0, scale: 0.92 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.92 }}
                                    transition={{ duration: 0.12 }}
                                    onClick={() => handleItemCardClick(item)}
                                    className={`absolute inset-0 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1 active:scale-[0.97] transition-colors cursor-pointer ${
                                      hasModifiers
                                        ? "border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 hover:border-amber-400"
                                        : "border-slate-200 bg-white text-slate-800 hover:border-[#D3232A] hover:text-[#D3232A]"
                                    }`}
                                  >
                                    {hasModifiers ? <SlidersHorizontal className="w-3 h-3" /> : <Plus className="w-3.5 h-3.5" />}
                                    {hasModifiers ? "Customise" : "Add"}
                                  </motion.button>
                                ) : (
                                  <motion.div
                                    key="stepper"
                                    initial={{ opacity: 0, scale: 0.92 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.92 }}
                                    transition={{ duration: 0.12 }}
                                    className="absolute inset-0 flex items-center justify-between rounded-lg bg-[#D3232A] text-white"
                                  >
                                    <button
                                      type="button"
                                      onClick={() => handleItemDecrement(item)}
                                      aria-label="Decrease quantity"
                                      className="w-7 h-full flex items-center justify-center rounded-l-lg hover:bg-black/10 transition cursor-pointer"
                                    >
                                      <Minus className="w-3 h-3" />
                                    </button>
                                    <span className="text-xs font-semibold tabular-nums">{cartQty}</span>
                                    <button
                                      type="button"
                                      onClick={() => handleItemCardClick(item)}
                                      aria-label={hasModifiers ? "Add another variation" : "Increase quantity"}
                                      title={hasModifiers ? "Add another variation" : "Increase quantity"}
                                      className="w-7 h-full flex items-center justify-center rounded-r-lg hover:bg-black/10 transition cursor-pointer"
                                    >
                                      <Plus className="w-3 h-3" />
                                    </button>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </motion.div>
            ) : (
              <div className="bg-white border border-slate-200/80 rounded-2xl divide-y divide-slate-100 overflow-hidden">
                {pagedItems.map((item) => {
                  const cartQty = getCartQty(item.id);
                  const isSelected = cartQty > 0;
                  const hasModifiers = item.modifierGroups && item.modifierGroups.length > 0;

                  return (
                    <div
                      key={item.id}
                      className={`flex items-center justify-between gap-3 px-4 py-3 transition ${
                        isSelected ? "bg-rose-50/40" : "hover:bg-slate-50/70"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <DietMark type={getDietaryType(item)} />
                        <div className="min-w-0">
                          <p className="text-[13px] font-semibold text-slate-900 truncate">{item.name}</p>
                          <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
                            {hasModifiers && <CustomisableBadge />}
                            <span className="text-[11px] text-slate-400 truncate">
                              {item.category?.name || "General"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 shrink-0">
                        <span className="text-[13px] font-semibold text-slate-900 tabular-nums">
                          {formatMoney(Number(item.price))}
                        </span>
                        {cartQty === 0 ? (
                          <button
                            type="button"
                            onClick={() => handleItemCardClick(item)}
                            className={`h-8 w-[84px] rounded-lg border text-xs font-semibold flex items-center justify-center gap-1 transition cursor-pointer ${
                              hasModifiers
                                ? "border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 hover:border-amber-400"
                                : "border-slate-200 bg-white text-slate-800 hover:border-[#D3232A] hover:text-[#D3232A]"
                            }`}
                          >
                            {hasModifiers ? <SlidersHorizontal className="w-3 h-3" /> : <Plus className="w-3.5 h-3.5" />}
                            {hasModifiers ? "Customise" : "Add"}
                          </button>
                        ) : (
                          <div className="h-8 w-[84px] flex items-center justify-between rounded-lg bg-[#D3232A] text-white">
                            <button
                              type="button"
                              onClick={() => handleItemDecrement(item)}
                              aria-label="Decrease quantity"
                              className="w-7 h-full flex items-center justify-center rounded-l-lg hover:bg-black/10 transition cursor-pointer"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-xs font-semibold tabular-nums">{cartQty}</span>
                            <button
                              type="button"
                              onClick={() => handleItemCardClick(item)}
                              aria-label={hasModifiers ? "Add another variation" : "Increase quantity"}
                              className="w-7 h-full flex items-center justify-center rounded-r-lg hover:bg-black/10 transition cursor-pointer"
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
            )}
          </div>

          {/* Pagination */}
          {!isAllOutletsSelected && filteredItems.length > pageSize && (
            <div className="shrink-0 flex items-center justify-between text-xs text-slate-500 px-1 mb-20 md:mb-0">
              <span className="tabular-nums">
                {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filteredItems.length)} of{" "}
                {filteredItems.length} items
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                  aria-label="Previous page"
                  className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-2 font-medium text-slate-700 tabular-nums">
                  {currentPage} / {Math.ceil(filteredItems.length / pageSize)}
                </span>
                <button
                  type="button"
                  disabled={currentPage >= Math.ceil(filteredItems.length / pageSize)}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  aria-label="Next page"
                  className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </section>

        {/* -- RIGHT: Order Ticket box (tablet & desktop), minimizable -- */}
        <aside
          className={`hidden md:flex shrink-0 h-full flex-col bg-white border border-slate-200/80 rounded-2xl shadow-[0_1px_3px_rgba(15,23,42,0.05)] overflow-hidden transition-[width] duration-300 ease-out ${
            isCartMinimized ? "w-[72px]" : "w-[340px] lg:w-[380px]"
          }`}
        >
          {isCartMinimized ? (
            /* Minimized rail */
            <div className="flex flex-col items-center h-full py-3 gap-3">
              <button
                type="button"
                onClick={toggleCartMinimized}
                title="Expand order"
                aria-label="Expand order"
                className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
              >
                <PanelRightOpen className="w-[18px] h-[18px]" />
              </button>

              <button
                type="button"
                onClick={toggleCartMinimized}
                className="flex-1 w-full flex flex-col items-center gap-4 pt-2 cursor-pointer group"
                aria-label="Expand order"
              >
                <span className="relative w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center group-hover:bg-slate-200 transition">
                  <ShoppingCart className="w-[18px] h-[18px]" />
                  {totalItemCount > 0 && (
                    <motion.span
                      key={totalItemCount}
                      initial={{ scale: 0.6 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 rounded-full bg-[#D3232A] text-white text-[10px] font-semibold flex items-center justify-center tabular-nums ring-2 ring-white"
                    >
                      {totalItemCount}
                    </motion.span>
                  )}
                </span>
                <span className="[writing-mode:vertical-rl] rotate-180 text-xs font-semibold text-slate-700 tabular-nums tracking-wide">
                  {cart.length > 0 ? formatMoney(billEstimate.total) : "Current order"}
                </span>
              </button>

              <button
                type="button"
                disabled={!canSendToKitchen}
                onClick={handleSendToKitchen}
                title="Send to kitchen"
                aria-label="Send to kitchen"
                className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#1B2A4A] text-white hover:bg-[#24375f] transition cursor-pointer disabled:bg-slate-100 disabled:text-slate-300 disabled:cursor-not-allowed"
              >
                <ChefHat className="w-[18px] h-[18px]" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col h-full min-w-[340px]">
              {/* Header */}
              <div className="flex items-center justify-between gap-2 px-4 py-3.5 border-b border-slate-100 shrink-0">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="font-heading text-[15px] font-bold text-slate-900">Current order</h2>
                    {totalItemCount > 0 && (
                      <span className="h-5 px-2 rounded-full bg-slate-100 text-slate-600 text-[11px] font-semibold flex items-center tabular-nums">
                        {totalItemCount}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">{orderContextLabel}</p>
                </div>
                <div className="flex items-center gap-0.5 shrink-0">
                  {cart.length > 0 && (
                    <button
                      type="button"
                      onClick={clearCart}
                      title="Clear order"
                      aria-label="Clear order"
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={toggleCartMinimized}
                    title="Minimize order panel"
                    aria-label="Minimize order panel"
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
                  >
                    <PanelRightClose className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Line items */}
              <div className="flex-1 overflow-y-auto px-4 py-2">
                {isAllOutletsSelected ? (
                  <div className="h-full flex flex-col items-center justify-center text-center px-6">
                    <Store className="w-7 h-7 text-slate-300" />
                    <p className="mt-3 text-[13px] font-semibold text-slate-700">No outlet selected</p>
                    <p className="mt-1 text-xs text-slate-400">Select an outlet to start an order.</p>
                  </div>
                ) : cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center px-6">
                    <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center">
                      <ShoppingCart className="w-5 h-5 text-slate-300" />
                    </div>
                    <p className="mt-3 text-[13px] font-semibold text-slate-700">No items yet</p>
                    <p className="mt-1 text-xs text-slate-400 max-w-[220px]">
                      Tap a dish from the menu to add it to this order.
                    </p>
                  </div>
                ) : (
                  <ul className="divide-y divide-slate-100">{renderCartLines()}</ul>
                )}
              </div>

              {/* Summary & action */}
              <div className="px-4 pt-3.5 pb-4 border-t border-slate-100 bg-slate-50/60 space-y-3.5 shrink-0">
                {renderBillSummary()}
                {renderSendToKitchenButton(handleSendToKitchen)}
              </div>
            </div>
          )}
        </aside>

        {/* -- MOBILE: floating order bar (< md) -- */}
        <AnimatePresence>
          {cart.length > 0 && (
            <motion.div
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 80, opacity: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 34 }}
              className="md:hidden fixed bottom-3 left-3 right-3 z-40 bg-[#1B2A4A] text-white rounded-2xl shadow-[0_12px_32px_-8px_rgba(15,23,42,0.45)] flex items-center gap-2 p-2 pl-4"
            >
              <button
                type="button"
                onClick={() => setIsMobileCartOpen(true)}
                className="flex-1 min-w-0 text-left cursor-pointer"
              >
                <p className="text-[13px] font-semibold tabular-nums">
                  {totalItemCount} {totalItemCount === 1 ? "item" : "items"} · {formatMoney(billEstimate.total)}
                </p>
                <p className="text-[11px] text-white/60 truncate flex items-center gap-1">
                  {orderContextLabel} · View order <ChevronRight className="w-3 h-3" />
                </p>
              </button>
              <button
                type="button"
                disabled={!canSendToKitchen}
                onClick={handleSendToKitchen}
                className="h-10 px-4 bg-white text-[#1B2A4A] text-xs font-semibold rounded-xl transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <ChefHat className="w-4 h-4" />
                Send
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* -- MOBILE: order drawer (< md) -- */}
        <AnimatePresence>
          {isMobileCartOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 z-50 flex flex-col bg-slate-900/50 backdrop-blur-[2px]"
              onClick={() => setIsMobileCartOpen(false)}
            >
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", stiffness: 380, damping: 38 }}
                onClick={(e) => e.stopPropagation()}
                className="mt-auto bg-white rounded-t-3xl max-h-[88vh] flex flex-col overflow-hidden shadow-2xl"
              >
                <div className="pt-2.5 flex justify-center">
                  <span className="w-10 h-1 rounded-full bg-slate-200" />
                </div>
                <div className="flex items-center justify-between px-4 pt-2 pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="font-heading text-[15px] font-bold text-slate-900">Current order</h3>
                    <p className="text-xs text-slate-500">{orderContextLabel}</p>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <button
                      type="button"
                      onClick={clearCart}
                      aria-label="Clear order"
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsMobileCartOpen(false)}
                      aria-label="Close"
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto px-4 py-2">
                  {cart.length === 0 ? (
                    <p className="py-10 text-center text-[13px] text-slate-400">No items in this order.</p>
                  ) : (
                    <ul className="divide-y divide-slate-100">{renderCartLines()}</ul>
                  )}
                </div>

                <div className="px-4 pt-3.5 pb-5 border-t border-slate-100 bg-slate-50/60 space-y-3.5">
                  {renderBillSummary()}
                  {renderSendToKitchenButton(() => {
                    setIsMobileCartOpen(false);
                    handleSendToKitchen();
                  })}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>


        {/* -- SELECT OUTLET REQUIRED MODAL -- */}
        <TModal
          open={isOutletSelectModalOpen}
          onClose={() => setIsOutletSelectModalOpen(false)}
          className="p-4 bg-slate-900/50 backdrop-blur-[2px]"
        >
          {isOutletSelectModalOpen && (
            <div className="bg-white rounded-2xl max-w-md w-full shadow-[0_24px_64px_-16px_rgba(15,23,42,0.35)] overflow-hidden">
              <ModalHeader
                icon={<Store className="w-[18px] h-[18px]" />}
                title="Select outlet"
                subtitle="Choose where this order will be fulfilled."
                onClose={() => setIsOutletSelectModalOpen(false)}
              />

              <div className="px-5 py-4">
                {specificOutlets.length === 0 ? (
                  <div className="py-8 text-center">
                    <p className="text-[13px] font-semibold text-slate-700">No outlets yet</p>
                    <p className="mt-1 text-xs text-slate-500">Add an outlet in Location Manager to start billing.</p>
                  </div>
                ) : (
                  <ul className="max-h-72 overflow-y-auto -mx-1 px-1 space-y-1.5">
                    {specificOutlets.map((outlet) => (
                      <li key={outlet.id}>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveBranch(outlet);
                            setIsOutletSelectModalOpen(false);
                          }}
                          className="group w-full flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-left transition cursor-pointer"
                        >
                          <span className="w-9 h-9 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center shrink-0 group-hover:bg-white transition">
                            <Store className="w-4 h-4" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-[13px] font-semibold text-slate-900 truncate">{outlet.name}</span>
                            {outlet.address && (
                              <span className="block text-xs text-slate-500 truncate">{outlet.address}</span>
                            )}
                          </span>
                          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 transition shrink-0" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="px-5 pb-5">
                <button
                  type="button"
                  onClick={() => setIsOutletSelectModalOpen(false)}
                  className="w-full h-10 rounded-xl border border-slate-200 text-[13px] font-medium text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </TModal>

        {/* -- CHECKOUT PAYMENT MODAL -- */}
        <TModal
          open={isCheckoutOpen}
          onClose={() => !isSubmitting && setIsCheckoutOpen(false)}
          className="p-4 bg-slate-900/50 backdrop-blur-[2px]"
        >
          {isCheckoutOpen && (
            <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] flex flex-col shadow-[0_24px_64px_-16px_rgba(15,23,42,0.35)] overflow-hidden">
              <ModalHeader
                icon={<Receipt className="w-[18px] h-[18px]" />}
                title="Checkout"
                subtitle={
                  activeBranch
                    ? `${activeBranch.name} · ${orderContextLabel}`
                    : orderContextLabel
                }
                onClose={() => setIsCheckoutOpen(false)}
              />

              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
                {/* Customer details */}
                <section className="space-y-2">
                  <FieldLabel>
                    Customer <span className="font-normal text-slate-400">· optional</span>
                  </FieldLabel>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Name"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className={`${inputClass} pl-8`}
                      />
                    </div>
                    <input
                      type="tel"
                      inputMode="numeric"
                      placeholder="Mobile number"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </section>

                {/* Coupon */}
                <section className="space-y-2">
                  <FieldLabel>Coupon</FieldLabel>
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between gap-2 h-10 pl-3 pr-1.5 rounded-xl bg-emerald-50 border border-emerald-200">
                      <div className="flex items-center gap-2 min-w-0">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="font-mono text-xs font-semibold text-emerald-900 tracking-wider">
                          {appliedCoupon.code}
                        </span>
                        <span className="text-xs text-emerald-700 truncate">
                          {formatMoney(appliedCoupon.discountAmount)} off
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveCoupon}
                        className="h-7 px-2.5 rounded-lg text-xs font-medium text-emerald-800 hover:bg-emerald-100 transition cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                        <input
                          type="text"
                          placeholder="Enter code"
                          value={couponInput}
                          onChange={(e) => {
                            setCouponInput(e.target.value.toUpperCase());
                            setCouponError(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleApplyCoupon();
                            }
                          }}
                          className={`${inputClass} pl-8 font-mono uppercase tracking-wider ${
                            couponError ? "border-rose-300 focus:border-rose-400 focus:ring-rose-50" : ""
                          }`}
                        />
                      </div>
                      <button
                        type="button"
                        disabled={isValidatingCoupon || !couponInput.trim()}
                        onClick={handleApplyCoupon}
                        className="h-10 px-4 rounded-xl border border-slate-200 bg-white text-[13px] font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer shrink-0"
                      >
                        {isValidatingCoupon ? "Checking…" : "Apply"}
                      </button>
                    </div>
                  )}
                  {couponError && (
                    <p className="flex items-center gap-1.5 text-xs text-rose-600">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {couponError}
                    </p>
                  )}
                </section>

                {/* Payment method */}
                <section className="space-y-2">
                  <FieldLabel>Payment method</FieldLabel>
                  <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Payment method">
                    {(
                      [
                        { key: "UPI", label: "UPI", icon: QrCode },
                        { key: "CARD", label: "Card", icon: CreditCard },
                        { key: "CASH", label: "Cash", icon: Banknote },
                      ] as const
                    ).map(({ key, label, icon: Icon }) => {
                      const isActive = paymentMethod === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          role="radio"
                          aria-checked={isActive}
                          onClick={() => setPaymentMethod(key)}
                          className={`h-16 rounded-xl border flex flex-col items-center justify-center gap-1.5 text-xs font-semibold transition cursor-pointer ${
                            isActive
                              ? "border-[#1B2A4A] bg-[#1B2A4A]/[0.04] text-slate-900 ring-1 ring-[#1B2A4A]"
                              : "border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-800"
                          }`}
                        >
                          <Icon className="w-[18px] h-[18px]" />
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </section>

                {/* Summary */}
                <section className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                  {renderBillSummary()}
                </section>
              </div>

              <div className="flex gap-2 px-5 py-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCheckoutOpen(false)}
                  className="h-11 px-4 rounded-xl border border-slate-200 text-[13px] font-medium text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleProcessCheckout}
                  disabled={isSubmitting}
                  className="flex-1 h-11 px-4 rounded-xl bg-[#D3232A] hover:bg-[#b91c23] text-white text-[13px] font-semibold shadow-sm transition flex items-center justify-between cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>{isSubmitting ? "Processing…" : "Confirm & pay"}</span>
                  <span className="tabular-nums">{formatMoney(grandTotal)}</span>
                </button>
              </div>
            </div>
          )}
        </TModal>

        {/* -- ORDER COMPLETE CONFIRMATION MODAL -- */}
        <TModal
          open={!!completedOrder}
          onClose={() => setCompletedOrder(null)}
          className="p-4 bg-slate-900/50 backdrop-blur-[2px]"
        >
          {completedOrder && (
            <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-[0_24px_64px_-16px_rgba(15,23,42,0.35)] text-center">
              <motion.div
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 420, damping: 22, delay: 0.05 }}
                className="w-14 h-14 rounded-full bg-emerald-50 ring-8 ring-emerald-50/50 text-emerald-600 flex items-center justify-center mx-auto"
              >
                <CheckCircle2 className="w-7 h-7" />
              </motion.div>

              <h3 className="font-heading mt-5 text-lg font-bold text-slate-900">
                {isKitchenDispatch ? "Sent to kitchen" : "Order placed"}
              </h3>
              <p className="mt-1 text-[13px] text-slate-500">
                {isKitchenDispatch
                  ? "KOT dispatched to the kitchen and connected printer."
                  : kitchenCaps.isKotOnly
                    ? "KOT is ready for the thermal printer."
                    : kitchenCaps.isKdsOnly
                      ? "Sent to the Kitchen Display System."
                      : "Sent live to KDS · KOT ready to print."}
              </p>

              <div className="mt-5 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left">
                <div>
                  <p className="text-[11px] text-slate-500">
                    {isKitchenDispatch ? "Kitchen ticket" : "Bill / ticket"}
                  </p>
                  <p className="font-mono text-sm font-semibold text-slate-900">{displayCompletedOrderId}</p>
                </div>
                <span className="h-6 px-2 rounded-md bg-white border border-slate-200 text-[10px] font-semibold uppercase tracking-wider text-slate-600 flex items-center">
                  {isKitchenDispatch ? "Kitchen" : kitchenCaps.mode}
                </span>
              </div>

              <div className="mt-5 space-y-2">
                <button
                  type="button"
                  onClick={() => setCompletedOrder(null)}
                  className="w-full h-11 rounded-xl bg-[#1B2A4A] hover:bg-[#24375f] text-white text-[13px] font-semibold shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  Start next order
                  <ChevronRight className="w-4 h-4" />
                </button>
                {!isKitchenDispatch && (
                  <button
                    type="button"
                    onClick={() => setPrintingOrder(completedOrderObj)}
                    className="w-full h-11 rounded-xl border border-slate-200 text-[13px] font-medium text-slate-700 hover:bg-slate-50 transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Printer className="w-4 h-4 text-slate-400" />
                    Print customer bill
                  </button>
                )}
              </div>
            </div>
          )}
        </TModal>

        {/* -- STYLE CUSTOMIZATION MODAL -- */}
        <TModal
          open={!!customizingItem}
          onClose={() => setCustomizingItem(null)}
          className="p-4 bg-slate-900/50 backdrop-blur-[2px]"
        >
          {customizingItem && (
            <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden shadow-[0_24px_64px_-16px_rgba(15,23,42,0.35)]">
              {/* Header */}
              <div className="flex items-start gap-3 px-5 py-4 border-b border-slate-100">
                {customizingItem.imageUrl ? (
                  <img
                    src={getImageUrl(customizingItem.imageUrl)}
                    alt={customizingItem.name}
                    className="w-14 h-14 rounded-xl object-cover border border-slate-100 shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 shrink-0">
                    <Utensils className="w-5 h-5" />
                  </div>
                )}
                <div className="min-w-0 flex-1 pt-0.5">
                  <div className="flex items-center gap-2">
                    {customizingDietaryType && <DietMark type={customizingDietaryType as DietaryType} />}
                    <h3 className="font-heading text-[15px] font-bold text-slate-900 leading-snug truncate">
                      {customizingItem.name}
                    </h3>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {customizationCalculations.hasVariantGroup
                      ? "Price depends on the size you choose"
                      : `Base price ${formatMoney(Number(customizingItem.price))}`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCustomizingItem(null)}
                  aria-label="Close"
                  className="w-8 h-8 -mr-1.5 -mt-0.5 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer shrink-0"
                >
                  <X className="w-[18px] h-[18px]" />
                </button>
              </div>

              {/* Modifier groups */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
                {(customizingItem.modifierGroups || []).map((group) => {
                  const isSingleSelect = group.minSelection === 1 && group.maxSelection === 1;
                  const isVariantGroup = isSingleSelect && (group.modifiers || []).some((m) => Number(m.price || (m as any).pricePaise) > 0);
                  const currentSelected = selectedModifiersState[group.id] || [];
                  const isSatisfied = currentSelected.length >= group.minSelection;
                  const isRequired = group.minSelection > 0;
                  const isAtMax = !isSingleSelect && !!group.maxSelection && currentSelected.length >= group.maxSelection;

                  return (
                    <section key={group.id}>
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="min-w-0">
                          <p className="text-[13px] font-semibold text-slate-900">{group.name}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {isSingleSelect
                              ? "Choose 1"
                              : isRequired
                                ? `Choose at least ${group.minSelection}${group.maxSelection ? `, up to ${group.maxSelection}` : ""}`
                                : group.maxSelection
                                  ? `Optional · up to ${group.maxSelection}`
                                  : "Optional"}
                            {group.description && ` · ${group.description}`}
                          </p>
                        </div>
                        {isRequired && (
                          <span
                            className={`h-5 px-2 rounded-md text-[10px] font-semibold flex items-center gap-1 shrink-0 ${
                              isSatisfied ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {isSatisfied && <Check className="w-3 h-3" />}
                            Required
                          </span>
                        )}
                      </div>

                      <div className="rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
                        {(group.modifiers || []).map((mod) => {
                          const isSelected = currentSelected.some((m) => (mod.id ? m.id === mod.id : m.name === mod.name));
                          const modPrice = Number(mod.price) || 0;
                          const isDisabled = isAtMax && !isSelected;

                          const handleToggle = () => {
                            if (isSingleSelect) {
                              setSelectedModifiersState((prev) => ({
                                ...prev,
                                [group.id]: [{ id: mod.id, name: mod.name, price: modPrice, isVariant: isVariantGroup }],
                              }));
                            } else {
                              if (isSelected) {
                                setSelectedModifiersState((prev) => ({
                                  ...prev,
                                  [group.id]: (prev[group.id] || []).filter(
                                    (m) => (mod.id ? m.id !== mod.id : m.name !== mod.name)
                                  ),
                                }));
                              } else {
                                if (group.maxSelection && currentSelected.length >= group.maxSelection) {
                                  return; // Exceeded max selection
                                }
                                setSelectedModifiersState((prev) => ({
                                  ...prev,
                                  [group.id]: [
                                    ...(prev[group.id] || []),
                                    { id: mod.id, name: mod.name, price: modPrice, isVariant: false },
                                  ],
                                }));
                              }
                            }
                          };

                          return (
                            <button
                              key={mod.id || mod.name}
                              type="button"
                              role={isSingleSelect ? "radio" : "checkbox"}
                              aria-checked={isSelected}
                              disabled={isDisabled}
                              onClick={handleToggle}
                              className={`w-full flex items-center justify-between gap-3 px-3.5 py-3 text-left transition select-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-45 ${
                                isSelected ? "bg-slate-50" : "hover:bg-slate-50/70"
                              }`}
                            >
                              <span className="flex items-center gap-3 min-w-0">
                                <span
                                  className={`w-[18px] h-[18px] border flex items-center justify-center transition shrink-0 ${
                                    isSingleSelect ? "rounded-full" : "rounded-[5px]"
                                  } ${
                                    isSelected
                                      ? "bg-[#1B2A4A] border-[#1B2A4A] text-white"
                                      : "border-slate-300 bg-white"
                                  }`}
                                >
                                  {isSelected &&
                                    (isSingleSelect ? (
                                      <span className="w-1.5 h-1.5 rounded-full bg-white" />
                                    ) : (
                                      <Check className="w-3 h-3 stroke-[3]" />
                                    ))}
                                </span>
                                <span className={`text-[13px] truncate ${isSelected ? "font-semibold text-slate-900" : "text-slate-700"}`}>
                                  {mod.name}
                                </span>
                              </span>
                              <span className={`text-xs tabular-nums shrink-0 ${modPrice > 0 ? "font-semibold text-slate-800" : "text-slate-400"}`}>
                                {isVariantGroup
                                  ? formatMoney(modPrice)
                                  : modPrice > 0
                                    ? `+${formatMoney(modPrice)}`
                                    : "Free"}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </section>
                  );
                })}
              </div>

              {/* Footer: quantity + add */}
              <div className="flex items-center gap-3 px-5 py-4 border-t border-slate-100 bg-slate-50/60">
                <div className="flex items-center h-11 rounded-xl border border-slate-200 bg-white">
                  <button
                    type="button"
                    onClick={() => setCustomizationQty((q) => Math.max(1, q - 1))}
                    disabled={customizationQty <= 1}
                    aria-label="Decrease quantity"
                    className="w-10 h-full flex items-center justify-center text-slate-500 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-7 text-center text-[13px] font-semibold text-slate-900 tabular-nums">
                    {customizationQty}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCustomizationQty((q) => q + 1)}
                    aria-label="Increase quantity"
                    className="w-10 h-full flex items-center justify-center text-slate-500 hover:text-slate-900 transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  type="button"
                  disabled={!customizationCalculations.isValid}
                  onClick={() => {
                    if (!customizationCalculations.isValid) return;
                    addToCart(
                      customizingItem,
                      customizationCalculations.allSelectedMods,
                      customizationQty,
                      customizationCalculations.finalUnitPrice
                    );
                    setCustomizingItem(null);
                  }}
                  className="flex-1 h-11 px-4 rounded-xl bg-[#D3232A] hover:bg-[#b01e23] text-white text-[13px] font-semibold shadow-sm transition flex items-center justify-between cursor-pointer disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none disabled:cursor-not-allowed"
                >
                  <span>{customizationCalculations.isValid ? "Add to order" : "Make required choices"}</span>
                  <span className="tabular-nums">{formatMoney(customizationCalculations.finalTotal)}</span>
                </button>
              </div>
            </div>
          )}
        </TModal>

        {/* -- Printable Thermal Receipt Modal -- */}
        {printingOrder && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-[2px] animate-in fade-in duration-200"
            onClick={() => setPrintingOrder(null)}
          >
            <div
              className="bg-white rounded-2xl overflow-hidden shadow-[0_24px_64px_-16px_rgba(15,23,42,0.35)] max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <ThermalReceipt
                order={printingOrder}
                autoPrint={false}
                onClose={() => setPrintingOrder(null)}
              />
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
