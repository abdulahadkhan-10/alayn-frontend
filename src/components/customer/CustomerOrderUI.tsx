"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { BellRing, ChevronRight, RefreshCw, Search, UtensilsCrossed, X } from "lucide-react";
import {
  createQROrder,
  fetchActiveTableOrder,
  fetchTableMenu,
  requestTableBill,
  resolveUploadUrl,
  type CustomerMenuCategory,
  type CustomerMenuItem,
  type TableMenuResponse,
} from "@/lib/api";
import { buildUpiPayUrl, isValidUpiId } from "@/lib/upi";
import { showToast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import BottomSheet from "./BottomSheet";
import CartSheet, { type CartLine } from "./CartSheet";
import ItemOptionsSheet, { type CartModifierItem } from "./ItemOptionsSheet";
import { DietaryMark, QuantityStepper } from "./MenuBits";
import MenuItemCard from "./MenuItemCard";
import PayBillSheet from "./PayBillSheet";
import TableBillSheet from "./TableBillSheet";
import { ORDER_STEPS, dietaryTypeOf, formatRupees, orderStepIndex, tableBillStatus, type BillPaymentMethod, type DietaryType } from "./menuFormat";

export type { CartModifierItem };

type DietFilter = "ALL" | DietaryType;
const DIET_FILTER_LABEL: Record<DietFilter, string> = { ALL: "All", VEG: "Veg", NON_VEG: "Non-veg", VEGAN: "Vegan" };
const ORDER_POLL_MS = 8000;
const UI_EASE = [0.23, 1, 0.32, 1] as const;

/**
 * The page a diner sees after scanning the table QR: the menu, and (when the outlet allows it)
 * ordering from their phone, as many rounds as they like onto the table's one running bill.
 * When they're done they ask for the bill and say how they'll pay. Waiter-service outlets get a view-only menu.
 */
export default function CustomerOrderUI({ token }: { token: string }) {
  const [menu, setMenu] = useState<TableMenuResponse | null>(null);
  const [categories, setCategories] = useState<CustomerMenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [dietFilter, setDietFilter] = useState<DietFilter>("ALL");
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);

  const [cart, setCart] = useState<CartLine[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [optionsItem, setOptionsItem] = useState<CustomerMenuItem | null>(null);
  const [detailItem, setDetailItem] = useState<CustomerMenuItem | null>(null);
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [announcement, setAnnouncement] = useState("");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- the table's running order comes untyped from the public API
  const [activeOrder, setActiveOrder] = useState<any | null>(null);
  const [isBillOpen, setIsBillOpen] = useState(false);
  const [isPayOpen, setIsPayOpen] = useState(false);
  // A fresh payment form each time "Pay bill" is opened
  const [payKey, setPayKey] = useState(0);

  const stickyRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  // True while a tab tap is smooth-scrolling the page, so section tracking doesn't fight it
  const autoScrolling = useRef(false);
  const autoScrollTimer = useRef<number | undefined>(undefined);

  const businessName = menu?.businessName || "Menu";
  const tableNumber = menu?.tableNumber;
  const canOrder = menu?.tableOrderMode === "ORDER_AND_PAY";
  const upiId = menu?.upiId || "";
  const upiAvailable = isValidUpiId(upiId);
  const counterAvailable = (menu?.allowPayAtCounter ?? true) || !upiAvailable;
  const billStatus = tableBillStatus(activeOrder);
  const orderInProgress = !!activeOrder && !["COMPLETED", "CANCELLED"].includes(activeOrder.status);

  // ── Data ──
  // `silent` refreshes (after placing an order) keep what is on screen if the network hiccups
  const fetchMenu = useCallback(
    (silent = false, isCurrent: () => boolean = () => true) =>
      Promise.all([fetchTableMenu(token), fetchActiveTableOrder(token)])
        .then(([menuRes, orderRes]) => {
          if (!isCurrent()) return;
          if (menuRes.ok && menuRes.categories) {
            setMenu(menuRes);
            setCategories(menuRes.categories);
          } else if (!silent) {
            setError(menuRes.error || "The menu could not be loaded.");
          }
          setActiveOrder(orderRes.ok && orderRes.order ? orderRes.order : null);
        })
        .catch((err) => {
          if (isCurrent() && !silent) setError(err instanceof Error ? err.message : "The menu could not be loaded.");
        })
        .finally(() => {
          if (isCurrent() && !silent) setLoading(false);
        }),
    [token]
  );

  useEffect(() => {
    if (!token) return;
    let current = true;
    fetchMenu(false, () => current);
    return () => {
      current = false;
    };
  }, [token, fetchMenu]);

  const retry = () => {
    setLoading(true);
    setError(null);
    void fetchMenu();
  };

  // Keep the order status fresh while the kitchen is working on it, and as soon as the diner returns to the tab
  useEffect(() => {
    if (!token || !orderInProgress) return;
    const refresh = async () => {
      const res = await fetchActiveTableOrder(token);
      if (res.ok) setActiveOrder(res.order || null);
    };
    const interval = setInterval(refresh, ORDER_POLL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [token, orderInProgress]);

  // ── Menu filtering ──
  const availableDiets = useMemo(() => {
    const found = new Set<DietaryType>();
    categories.forEach((c) => c.menuItems?.forEach((i) => found.add(dietaryTypeOf(i))));
    return (["VEG", "NON_VEG", "VEGAN"] as const).filter((d) => found.has(d));
  }, [categories]);

  const query = search.trim().toLowerCase();
  const visibleCategories = useMemo(
    () =>
      categories
        .map((cat) => ({
          ...cat,
          menuItems: cat.menuItems.filter((item) => {
            if (dietFilter !== "ALL" && dietaryTypeOf(item) !== dietFilter) return false;
            if (!query) return true;
            return item.name.toLowerCase().includes(query) || (item.description || "").toLowerCase().includes(query);
          }),
        }))
        .filter((cat) => cat.menuItems.length > 0),
    [categories, dietFilter, query]
  );
  const resultCount = visibleCategories.reduce((sum, c) => sum + c.menuItems.length, 0);
  const currentCategoryId =
    activeCategoryId && visibleCategories.some((c) => c.id === activeCategoryId) ? activeCategoryId : visibleCategories[0]?.id || null;

  // ── Section tracking: highlight the tab for the section under the sticky bar ──
  useEffect(() => {
    if (query) return;
    const sections = visibleCategories
      .map((c) => document.getElementById(`menu-section-${c.id}`))
      .filter((el): el is HTMLElement => !!el);
    if (sections.length === 0) return;
    const offset = (stickyRef.current?.offsetHeight || 0) + 8;
    const observer = new IntersectionObserver(
      (entries) => {
        if (autoScrolling.current) return;
        const topmost = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (topmost) setActiveCategoryId(topmost.target.getAttribute("data-category-id"));
      },
      { rootMargin: `-${offset}px 0px -60% 0px` }
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [visibleCategories, query]);

  // Keep the highlighted tab in view inside the horizontal tab strip
  useEffect(() => {
    const strip = tabsRef.current;
    const tab = strip?.querySelector<HTMLElement>(`[data-tab-id="${currentCategoryId}"]`);
    if (!strip || !tab) return;
    strip.scrollTo({ left: tab.offsetLeft - strip.clientWidth / 2 + tab.offsetWidth / 2, behavior: "smooth" });
  }, [currentCategoryId]);

  const scrollToCategory = (categoryId: string) => {
    const section = document.getElementById(`menu-section-${categoryId}`);
    if (!section) return;
    setActiveCategoryId(categoryId);
    autoScrolling.current = true;
    window.clearTimeout(autoScrollTimer.current);
    autoScrollTimer.current = window.setTimeout(() => {
      autoScrolling.current = false;
    }, 900);
    const top = section.getBoundingClientRect().top + window.scrollY - (stickyRef.current?.offsetHeight || 0) - 4;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top, behavior: reduceMotion ? "auto" : "smooth" });
  };

  // ── Cart ──
  const addToCart = (item: CustomerMenuItem, modifiers: CartModifierItem[] = [], quantity = 1, unitPricePaise = item.pricePaise) => {
    const key = modifiers.map((m) => m.id || m.name).sort().join(":");
    const cartItemId = `${item.id}-${key || "base"}`;
    setCart((prev) =>
      prev.some((l) => l.cartItemId === cartItemId)
        ? prev.map((l) => (l.cartItemId === cartItemId ? { ...l, quantity: l.quantity + quantity } : l))
        : [...prev, { cartItemId, item, quantity, selectedModifiers: modifiers, unitPricePaise }]
    );
    setAnnouncement(`Added ${quantity} ${item.name} to your order`);
  };

  const changeQuantity = (cartItemId: string, delta: number) =>
    setCart((prev) =>
      prev.flatMap((l) => {
        if (l.cartItemId !== cartItemId) return [l];
        const quantity = l.quantity + delta;
        return quantity > 0 ? [{ ...l, quantity }] : [];
      })
    );

  const changeNote = (cartItemId: string, note: string) =>
    setCart((prev) => prev.map((l) => (l.cartItemId === cartItemId ? { ...l, notes: note } : l)));

  const quantityOf = (itemId: string) => cart.filter((l) => l.item.id === itemId).reduce((sum, l) => sum + l.quantity, 0);

  const handleAdd = (item: CustomerMenuItem) => {
    if ((item.modifierGroups?.length || 0) > 0) setOptionsItem(item);
    else addToCart(item);
  };

  // Removes the most recently added variation of a dish
  const handleRemove = (item: CustomerMenuItem) => {
    const lines = cart.filter((l) => l.item.id === item.id);
    const last = lines[lines.length - 1];
    if (last) changeQuantity(last.cartItemId, -1);
  };

  const itemCount = cart.reduce((sum, l) => sum + l.quantity, 0);

  // Taxes are worked out once on the table's whole bill, not on each round
  const itemTotalPaise = cart.reduce((sum, l) => sum + l.unitPricePaise * l.quantity, 0);

  const upiUrl = buildUpiPayUrl({
    upiId,
    payeeName: businessName,
    amountPaise: billStatus.duePaise,
    note: `Table ${tableNumber || ""} - ${businessName}`,
  });

  const placeOrder = async () => {
    if (cart.length === 0 || isPlacingOrder) return;
    setIsPlacingOrder(true);
    try {
      const res = await createQROrder({
        tableToken: token,
        items: cart.map((l) => ({
          menuItemId: l.item.id,
          quantity: l.quantity,
          notes: l.notes?.trim() || undefined,
          modifiers: l.selectedModifiers?.map((m) => ({ id: m.id, name: m.name, pricePaise: m.pricePaise, price: m.pricePaise / 100 })),
        })),
        customerName: guestName.trim() || undefined,
        customerPhone: guestPhone.trim() || undefined,
      });
      if (res.ok) {
        setCart([]);
        setIsCartOpen(false);
        await fetchMenu(true);
        setIsBillOpen(true);
      }
    } catch (err) {
      showToast.error("Order not placed", err instanceof Error ? err.message : "Please try again.");
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const openPayment = () => {
    setPayKey((k) => k + 1);
    setIsBillOpen(false);
    setIsPayOpen(true);
  };

  const requestBill = async (method: BillPaymentMethod, upiReference: string) => {
    const res = await requestTableBill(token, { paymentMethod: method, paymentRef: method === "UPI" && upiReference ? upiReference : undefined });
    if (!res.ok) {
      showToast.error("Couldn't reach the restaurant", res.error || "Please try again, or ask a member of staff.");
      return false;
    }
    if (res.order && typeof res.order === "object" && "id" in res.order) setActiveOrder(res.order);
    return true;
  };

  // ── States ──
  if (!token) return <MenuError message="This link is missing its table code." onRetry={retry} />;
  if (loading) return <MenuSkeleton />;
  if (error) return <MenuError message={error} onRetry={retry} />;

  const step = orderStepIndex(activeOrder?.status);
  const showCartBar = canOrder && itemCount > 0;
  const showTrackBar = !showCartBar && orderInProgress;

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-dvh bg-white text-(--espresso) antialiased">
        <p className="sr-only" aria-live="polite">
          {announcement}
        </p>

        {/* ── Restaurant ── */}
        <header className="mx-auto max-w-3xl px-4 pt-6 pb-4 sm:px-6 sm:pt-8">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="font-heading text-[26px] font-bold leading-tight tracking-tight sm:text-3xl">{businessName}</h1>
              <p className="mt-1 text-sm text-(--muted)">
                {[menu?.outletName && menu.outletName !== businessName ? menu.outletName : null, tableNumber ? `Table ${tableNumber}` : null, "Dine-in"]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
            {showCartBar && orderInProgress && (
              <button
                type="button"
                onClick={() => setIsBillOpen(true)}
                className="inline-flex h-10 shrink-0 items-center gap-2 rounded-full border border-zinc-200 px-3.5 text-[13px] font-semibold transition-colors hover:bg-zinc-50"
              >
                <span className="h-2 w-2 rounded-full bg-[#15803D] motion-safe:animate-pulse" aria-hidden="true" />
                Your bill
              </button>
            )}
          </div>

          {!canOrder && (
            <p className="mt-4 flex items-start gap-2.5 rounded-2xl bg-[#F4F5F8] px-4 py-3 text-sm leading-relaxed text-(--espresso)">
              <BellRing className="mt-0.5 h-4 w-4 shrink-0 text-(--muted)" aria-hidden="true" />
              Have a look through the menu. Your server will take your order at the table.
            </p>
          )}

          {availableDiets.length > 1 && (
            <div role="group" aria-label="Filter by diet" className="mt-4 flex flex-wrap gap-2">
              {(["ALL", ...availableDiets] as DietFilter[]).map((diet) => {
                const on = dietFilter === diet;
                return (
                  <button
                    key={diet}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setDietFilter(diet)}
                    className={cn(
                      "inline-flex h-9 items-center gap-2 rounded-full border px-3.5 text-[13px] font-medium transition-colors",
                      on ? "border-(--espresso) bg-(--espresso) text-white" : "border-zinc-200 text-(--espresso) hover:bg-zinc-50"
                    )}
                  >
                    {diet !== "ALL" && <DietaryMark type={diet} className={on ? "bg-white" : undefined} />}
                    {DIET_FILTER_LABEL[diet]}
                  </button>
                );
              })}
            </div>
          )}
        </header>

        {/* ── Search and sections, pinned while scrolling ── */}
        <div ref={stickyRef} className="sticky top-0 z-30 border-b border-zinc-100 bg-white/95 backdrop-blur-md supports-[backdrop-filter]:bg-white/85">
          <div className="mx-auto max-w-3xl px-4 pt-2 sm:px-6">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-zinc-400" aria-hidden="true" />
              <label htmlFor="menu-search" className="sr-only">
                Search the menu
              </label>
              <input
                id="menu-search"
                type="search"
                inputMode="search"
                autoComplete="off"
                placeholder="Search dishes"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-11 w-full rounded-xl bg-zinc-100 pl-11 pr-11 text-base text-(--espresso) placeholder:text-zinc-500 transition-[background-color,box-shadow] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1B2A4A]/20 [&::-webkit-search-cancel-button]:hidden"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                  className="absolute right-0 top-0 inline-flex h-11 w-11 items-center justify-center text-zinc-500 hover:text-zinc-800"
                >
                  <X className="h-[18px] w-[18px]" />
                </button>
              )}
            </div>
          </div>

          {!query && visibleCategories.length > 1 ? (
            <nav aria-label="Menu sections" className="mx-auto max-w-3xl">
              <div ref={tabsRef} className="flex gap-1.5 overflow-x-auto px-4 py-2.5 [scrollbar-width:none] sm:px-6 [&::-webkit-scrollbar]:hidden">
                {visibleCategories.map((cat) => {
                  const on = cat.id === currentCategoryId;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      data-tab-id={cat.id}
                      aria-current={on ? "true" : undefined}
                      onClick={() => scrollToCategory(cat.id)}
                      className={cn(
                        "h-9 shrink-0 whitespace-nowrap rounded-full px-4 text-[13px] font-medium transition-colors",
                        on ? "bg-(--espresso) text-white" : "text-(--muted) hover:bg-zinc-100 hover:text-(--espresso)"
                      )}
                    >
                      {cat.name}
                    </button>
                  );
                })}
              </div>
            </nav>
          ) : (
            <div className="h-2.5" />
          )}
        </div>

        {/* ── Menu ── */}
        <main className={cn("mx-auto max-w-3xl px-4 sm:px-6", showCartBar || showTrackBar ? "pb-32" : "pb-12")}>
          {query && resultCount > 0 && (
            <p className="pt-4 text-sm text-(--muted)" aria-live="polite">
              {resultCount} {resultCount === 1 ? "dish" : "dishes"} for “{search.trim()}”
            </p>
          )}

          {visibleCategories.length === 0 ? (
            <EmptyMenu
              searching={!!query}
              filtered={dietFilter !== "ALL"}
              hasAnyItems={categories.some((c) => c.menuItems.length > 0)}
              onReset={() => {
                setSearch("");
                setDietFilter("ALL");
              }}
            />
          ) : (
            visibleCategories.map((cat) => (
              <section
                key={cat.id}
                id={`menu-section-${cat.id}`}
                data-category-id={cat.id}
                aria-labelledby={`menu-heading-${cat.id}`}
                className="pt-7"
              >
                <h2 id={`menu-heading-${cat.id}`} className="font-heading text-lg font-bold tracking-tight">
                  {cat.name}
                  <span className="ml-2 text-sm font-medium text-(--muted)">{cat.menuItems.length}</span>
                </h2>
                <div className="divide-y divide-zinc-100">
                  {cat.menuItems.map((item) => (
                    <MenuItemCard
                      key={item.id}
                      item={item}
                      quantity={quantityOf(item.id)}
                      canOrder={canOrder}
                      onAdd={() => handleAdd(item)}
                      onRemove={() => handleRemove(item)}
                      onOpenImage={() => setDetailItem(item)}
                    />
                  ))}
                </div>
              </section>
            ))
          )}

          <footer className="mt-12 flex items-center justify-center gap-1.5 text-xs text-zinc-400">
            Powered by <span className="font-semibold text-zinc-500">Alayn</span>
          </footer>
        </main>

        {/* ── Bottom bar: the order being built, or the order in the kitchen ── */}
        <AnimatePresence>
          {(showCartBar || showTrackBar) && (
            <motion.div
              key={showCartBar ? "cart" : "track"}
              initial={{ y: "120%" }}
              animate={{ y: 0, transition: { duration: 0.3, ease: UI_EASE } }}
              exit={{ y: "120%", transition: { duration: 0.2, ease: UI_EASE } }}
              className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6"
            >
              {showCartBar ? (
                <button
                  type="button"
                  onClick={() => setIsCartOpen(true)}
                  className="pointer-events-auto mx-auto flex h-14 w-full max-w-3xl items-center justify-between gap-3 rounded-2xl bg-(--amber) px-5 text-white shadow-[0_12px_32px_-8px_rgba(196,30,42,0.55)] transition-transform duration-150 ease-out active:scale-[0.98] outline-none focus-visible:ring-2 focus-visible:ring-(--espresso) focus-visible:ring-offset-2"
                >
                  <span className="text-left leading-tight">
                    <span className="block text-[13px] text-white/85">
                      {itemCount} item{itemCount === 1 ? "" : "s"}
                    </span>
                    <span className="block text-base font-semibold tabular-nums">{formatRupees(itemTotalPaise, { exact: true })}</span>
                  </span>
                  <span className="flex items-center gap-1 text-[15px] font-semibold">
                    View order <ChevronRight className="h-5 w-5" aria-hidden="true" />
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsBillOpen(true)}
                  className="pointer-events-auto mx-auto flex h-14 w-full max-w-3xl items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white px-5 shadow-[0_12px_32px_-12px_rgba(11,18,32,0.3)] transition-transform duration-150 ease-out active:scale-[0.98] outline-none focus-visible:ring-2 focus-visible:ring-(--espresso) focus-visible:ring-offset-2"
                >
                  <span className="flex min-w-0 items-center gap-3 text-left">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#15803D] motion-safe:animate-pulse" aria-hidden="true" />
                    <span className="min-w-0 leading-tight">
                      <span className="block truncate text-[15px] font-semibold">
                        Your bill · <span className="tabular-nums">{formatRupees(billStatus.duePaise || billStatus.totalPaise, { exact: true })}</span>
                      </span>
                      <span className="block truncate text-[13px] text-(--muted)">
                        {billStatus.request && !billStatus.requestOutdated ? "Bill requested · collect it at the counter" : ORDER_STEPS[Math.max(0, step)].label}
                      </span>
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-1 text-[15px] font-semibold">
                    View <ChevronRight className="h-5 w-5" aria-hidden="true" />
                  </span>
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <ItemOptionsSheet item={optionsItem} onClose={() => setOptionsItem(null)} onAdd={addToCart} />

        <DishDetailSheet
          item={detailItem}
          onClose={() => setDetailItem(null)}
          canOrder={canOrder}
          quantity={detailItem ? quantityOf(detailItem.id) : 0}
          onAdd={(item) => {
            if ((item.modifierGroups?.length || 0) > 0) {
              setDetailItem(null);
              setOptionsItem(item);
            } else addToCart(item);
          }}
          onRemove={handleRemove}
        />

        <CartSheet
          open={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          lines={cart}
          itemTotalPaise={itemTotalPaise}
          addingToBill={orderInProgress}
          onChangeQuantity={changeQuantity}
          onChangeNote={changeNote}
          guestName={guestName}
          guestPhone={guestPhone}
          onGuestNameChange={setGuestName}
          onGuestPhoneChange={setGuestPhone}
          tableNumber={tableNumber}
          placing={isPlacingOrder}
          onPlaceOrder={placeOrder}
        />

        <TableBillSheet
          open={isBillOpen && !!activeOrder}
          onClose={() => setIsBillOpen(false)}
          order={activeOrder}
          canOrderMore={canOrder}
          onPay={openPayment}
        />

        <PayBillSheet
          key={payKey}
          open={isPayOpen && !!activeOrder}
          onClose={() => setIsPayOpen(false)}
          amountDuePaise={billStatus.duePaise}
          tableNumber={tableNumber}
          orderNumber={activeOrder?.orderNumber}
          upiAvailable={upiAvailable}
          counterAvailable={counterAvailable}
          upiUrl={upiUrl}
          upiId={upiId}
          onRequestBill={requestBill}
        />
      </div>
    </MotionConfig>
  );
}

/** A dish's photo and full description, opened by tapping its picture */
function DishDetailSheet({
  item,
  onClose,
  canOrder,
  quantity,
  onAdd,
  onRemove,
}: {
  item: CustomerMenuItem | null;
  onClose: () => void;
  canOrder: boolean;
  quantity: number;
  onAdd: (item: CustomerMenuItem) => void;
  onRemove: (item: CustomerMenuItem) => void;
}) {
  // Keep the dish on screen while the sheet animates closed
  const [shown, setShown] = useState<CustomerMenuItem | null>(item);
  if (item && item !== shown) setShown(item);
  const dish = item || shown;
  const photo = dish ? resolveUploadUrl(dish.imageUrl) : null;
  const customisable = (dish?.modifierGroups?.length || 0) > 0;

  return (
    <BottomSheet
      open={!!item}
      onClose={onClose}
      title={
        <span className="flex items-start gap-2">
          {dish && <DietaryMark type={dietaryTypeOf(dish)} className="mt-1.5" />}
          <span>{dish?.name}</span>
        </span>
      }
      description={dish ? <span className="font-semibold tabular-nums text-(--espresso)">{formatRupees(dish.pricePaise)}</span> : null}
      media={
        photo ? (
          <div className="mx-4 mt-3 aspect-[4/3] overflow-hidden rounded-2xl bg-zinc-100 sm:mx-6 sm:mt-6">
            {/* eslint-disable-next-line @next/next/no-img-element -- menu photos are served from the outlet's upload host */}
            <img src={photo} alt={dish?.name || ""} className="h-full w-full object-cover" />
          </div>
        ) : null
      }
      footer={
        canOrder && dish ? (
          quantity > 0 && !customisable ? (
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-(--muted)">In your order</span>
              <QuantityStepper value={quantity} onDecrement={() => onRemove(dish)} onIncrement={() => onAdd(dish)} label={dish.name} />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onAdd(dish)}
              className="h-12 w-full rounded-xl bg-(--amber) text-[15px] font-semibold text-white transition-[transform,background-color] duration-150 ease-out hover:bg-[#A91A24] active:scale-[0.98]"
            >
              {customisable ? "Choose options" : "Add to order"}
            </button>
          )
        ) : null
      }
    >
      {dish?.description ? <p className="mt-2 text-[15px] leading-relaxed text-(--muted)">{dish.description}</p> : <div className="h-1" />}
    </BottomSheet>
  );
}

function EmptyMenu({ searching, filtered, hasAnyItems, onReset }: { searching: boolean; filtered: boolean; hasAnyItems: boolean; onReset: () => void }) {
  return (
    <div className="flex flex-col items-center px-6 py-20 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100 text-zinc-500">
        <UtensilsCrossed className="h-6 w-6" aria-hidden="true" />
      </span>
      <p className="mt-4 text-base font-semibold">
        {!hasAnyItems ? "The menu is being updated" : searching ? "No dishes match your search" : "No dishes in this filter"}
      </p>
      <p className="mt-1 max-w-xs text-sm text-(--muted)">
        {!hasAnyItems ? "Please check back in a moment or ask a member of staff." : "Try another word, or see the full menu."}
      </p>
      {hasAnyItems && (searching || filtered) && (
        <button
          type="button"
          onClick={onReset}
          className="mt-5 h-11 rounded-xl border border-zinc-300 px-5 text-sm font-semibold transition-colors hover:bg-zinc-50"
        >
          Show full menu
        </button>
      )}
    </div>
  );
}

function MenuSkeleton() {
  const block = "rounded-lg bg-zinc-100 motion-safe:animate-pulse";
  return (
    <div className="mx-auto min-h-dvh max-w-3xl bg-white px-4 pt-6 sm:px-6 sm:pt-8" aria-busy="true" aria-label="Loading the menu">
      <div className={cn(block, "h-8 w-56")} />
      <div className={cn(block, "mt-2.5 h-4 w-36")} />
      <div className={cn(block, "mt-6 h-11 w-full rounded-xl")} />
      <div className="mt-3 flex gap-2">
        {[72, 96, 64, 88].map((w) => (
          <div key={w} className={cn(block, "h-9 rounded-full")} style={{ width: w }} />
        ))}
      </div>
      <div className="mt-6 divide-y divide-zinc-100">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex gap-4 py-5">
            <div className="flex-1 space-y-2.5">
              <div className={cn(block, "h-4 w-3/5")} />
              <div className={cn(block, "h-4 w-16")} />
              <div className={cn(block, "h-3 w-full")} />
              <div className={cn(block, "h-3 w-4/5")} />
            </div>
            <div className={cn(block, "h-[120px] w-[120px] rounded-2xl")} />
          </div>
        ))}
      </div>
    </div>
  );
}

function MenuError({ message, onRetry }: { message: string; onRetry: () => void }) {
  const qrProblem = /token|table code/i.test(message);
  return (
    <main className="flex min-h-dvh items-center justify-center bg-white px-6">
      <div className="max-w-sm text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100 text-zinc-500">
          <UtensilsCrossed className="h-6 w-6" aria-hidden="true" />
        </span>
        <h1 className="mt-5 font-heading text-xl font-bold text-(--espresso)">
          {qrProblem ? "This QR code isn't active" : "We couldn't load the menu"}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-(--muted)">
          {qrProblem
            ? "It may have been replaced. Please ask a member of staff for the table's current QR code."
            : "Check your internet connection and try again."}
        </p>
        {!qrProblem && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-(--espresso) px-5 text-sm font-semibold text-white transition-[transform,background-color] duration-150 ease-out hover:bg-[#243556] active:scale-[0.98]"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Try again
          </button>
        )}
      </div>
    </main>
  );
}
