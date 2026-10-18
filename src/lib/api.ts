// Frontend API Client — Alayn Backend
// All branch-scoped calls accept outletId explicitly (from BranchContext).

import { showToast } from "./toast";

const RAW_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const API_VERSION = "v1";
export const BASE_DOMAIN = RAW_URL.replace(/\/$/, "").replace(/\/api\/v\d+$/, "");
const BACKEND_URL = `${BASE_DOMAIN}/api/${API_VERSION}`;

/** Base URL for resolving uploaded media files (images, documents, etc.) */
const MEDIA_BASE = (process.env.NEXT_PUBLIC_API_URI || process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/$/, "");

/** Resolves a relative upload path (e.g. /uploads/menu-items/foo.jpg) to a full backend URL */
export function resolveUploadUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${MEDIA_BASE}${path.startsWith("/") ? path : "/" + path}`;
}


// ── Shared request helper ─────────────────────────────────────────────────────

interface RequestOptions {
  method?: string;
  body?: unknown;
  outletId?: string;
}

function parseErrorMessage(json: any, status: number): string {
  if (!json) return `Request failed (HTTP ${status})`;
  
  const extract = (val: any): string | null => {
    if (!val) return null;
    if (typeof val === "string") return val;
    if (typeof val === "object") {
      if (typeof val.message === "string") return val.message;
      if (typeof val.error === "string") return val.error;
      if (typeof val.code === "string") return val.code;
    }
    return null;
  };

  const msg =
    extract(json.message) ??
    extract(json.error) ??
    (typeof json === "string" ? json : null);

  if (msg) return msg;

  try {
    if (typeof json === "object") {
      return JSON.stringify(json);
    }
  } catch {
    // fallback
  }

  return `Request failed (HTTP ${status})`;
}

async function apiRequest<T>(
  path: string,
  opts: RequestOptions = {},
  isRetry = false
): Promise<{ ok: true; data: T } | { ok: false; error: string; status?: number }> {
  const headers: Record<string, string> = {};
  if (opts.body !== undefined) headers["Content-Type"] = "application/json";
  if (opts.outletId) headers["x-outlet-id"] = opts.outletId;

  // Normalize path to prevent duplicate /api/v1/api/v1 or /api/vX
  const cleanPath = path.replace(/^\/?(api\/v\d+\/)+/, "").replace(/^\/+/, "");
  const targetUrl = `${BACKEND_URL}/${cleanPath}`;

  try {
    const res = await fetch(targetUrl, {
      method: opts.method ?? "GET",
      headers,
      credentials: "include",
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    });

    const json = await res.json();

    if (!res.ok) {
      if (res.status === 401 && !isRetry && !path.includes("/auth/")) {
        try {
          const refreshRes = await fetch(`${BACKEND_URL}/auth/refresh`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
          });
          if (refreshRes.ok) {
            // Retry original request with refreshed HTTP-Only cookies
            return apiRequest<T>(path, opts, true);
          }
        } catch {
          // ignore refresh error
        }
      }

      if (res.status === 403) {
        return {
          ok: false,
          error: "You do not have access to this branch.",
          status: 403,
        };
      }
      return {
        ok: false,
        error: parseErrorMessage(json, res.status),
        status: res.status,
      };
    }

    // Backend wraps data in { success, data, ... }
    return { ok: true, data: (json?.data ?? json) as T };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Network error";
    return { ok: false, error: msg };
  }
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Branch {
  id: string;
  name: string;
  address: string;
  businessId: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  unit: string;
  reorderThreshold: number;
  unitCostPaise: number;
  currentStock: number;
  createdAt?: string;
}

export interface InventoryListResult {
  items: InventoryItem[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

// ── Fallback / mock data ──────────────────────────────────────────────────────

const FALLBACK_INVENTORY: InventoryItem[] = [
  { id: "1", name: "Premium Espresso Beans", sku: "COF-ESP-001", category: "Beverages", unit: "kg", reorderThreshold: 10, unitCostPaise: 120000, currentStock: 24 },
  { id: "2", name: "Whole Milk", sku: "MILK-WHL-002", category: "Dairy", unit: "L", reorderThreshold: 15, unitCostPaise: 8000, currentStock: 8 },
  { id: "3", name: "Oat Milk (Barista Edition)", sku: "MILK-OAT-003", category: "Dairy", unit: "L", reorderThreshold: 10, unitCostPaise: 18000, currentStock: 18 },
  { id: "4", name: "Caramel Syrup", sku: "SYR-CAR-004", category: "Syrups", unit: "Bottle", reorderThreshold: 5, unitCostPaise: 45000, currentStock: 3 },
  { id: "5", name: "Paper Cups 12oz", sku: "PKG-CUP-12OZ", category: "Packaging", unit: "pack", reorderThreshold: 8, unitCostPaise: 65000, currentStock: 12 },
  { id: "6", name: "Chocolate Chips", sku: "BAK-CHP-006", category: "Bakery", unit: "kg", reorderThreshold: 4, unitCostPaise: 50000, currentStock: 5 },
  { id: "7", name: "Butter Croissant (Frozen)", sku: "BAK-CRO-007", category: "Bakery", unit: "pcs", reorderThreshold: 50, unitCostPaise: 4500, currentStock: 120 },
];

// ── Branches API ──────────────────────────────────────────────────────────────

export async function fetchBranches(): Promise<Branch[]> {
  const result = await apiRequest<Branch[]>("/outlets");
  if (result.ok) return result.data;
  console.warn("fetchBranches failed:", result.error);
  return [];
}

/** Returns the outlet used by the single-outlet inventory screen. */
export async function fetchDefaultInventoryOutletId(): Promise<string | null> {
  const outlets = await fetchBranches();
  return outlets[0]?.id ?? null;
}

// ── Inventory ─────────────────────────────────────────────────────────────────

export interface InventoryListParams {
  outletId: string;
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  lowStock?: boolean;
}

export async function fetchInventoryItems(
  params: InventoryListParams,
): Promise<InventoryItem[]> {
  const { outletId, page = 1, limit = 100, search, category, lowStock } = params;

  const qs = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    ...(search    ? { search }              : {}),
    ...(category  ? { category }            : {}),
    ...(lowStock  ? { lowStock: "true" }    : {}),
  });

  const result = await apiRequest<InventoryListResult>(
    `/inventory/items?${qs.toString()}`,
    { outletId },
  );
  if (result.ok) return result.data.items;

  console.warn("fetchInventoryItems failed:", result.error, "— using mock data");
  return [...FALLBACK_INVENTORY];
}

export async function createInventoryItem(
  outletId: string,
  itemData: Omit<InventoryItem, "id" | "currentStock" | "createdAt">,
): Promise<{ ok: boolean; item?: InventoryItem; error?: string }> {
  const result = await apiRequest<InventoryItem>("/inventory/items", {
    method: "POST",
    body: itemData,
    outletId,
  });
  if (result.ok) {
    showToast.success("Inventory Item Created", `"${itemData.name}" added to inventory.`);
    return { ok: true, item: result.data };
  }
  showToast.error("Failed to Create Item", result.error);
  return { ok: false, error: result.error };
}

export async function adjustInventoryStock(
  outletId: string,
  itemId: string,
  change: number,
  reason: "SALE" | "WASTE" | "PURCHASE" | "ADJUSTMENT",
  idempotencyKey?: string,
): Promise<{ ok: boolean; error?: string }> {
  const result = await apiRequest(`/inventory/items/${itemId}/adjust`, {
    method: "POST",
    body: { change, reason, idempotencyKey },
    outletId,
  });
  if (result.ok) {
    showToast.success("Stock Adjusted", `Inventory stock updated (${reason}).`);
    return { ok: true };
  }
  showToast.error("Stock Adjustment Failed", result.error);
  return { ok: false, error: result.error };
}

// ── Table Management APIs ───────────────────────────────────────────────────

export interface TableStaff {
  id: string;
  name: string;
  email: string;
  role: string;
  userId?: string | null;
}

export interface TableItem {
  id: string;
  tableNumber: number;
  tableType?: "AC" | "NON_AC";
  status: "AVAILABLE" | "OCCUPIED";
  assignedStaffId?: string | null;
  assignedStaff?: TableStaff | null;
  currentToken: string | null;
  tokenExpiresAt: string | null;
  createdAt: string;
  outletId?: string;
}

export async function fetchTables(
  outletId: string
): Promise<{ ok: boolean; tables?: TableItem[]; error?: string }> {
  const result = await apiRequest<TableItem[]>("/tables", { outletId });
  if (result.ok) return { ok: true, tables: result.data };
  return { ok: false, error: result.error };
}

export async function createBulkTables(
  outletId: string,
  count: number
): Promise<{ ok: boolean; tables?: TableItem[]; error?: string }> {
  const result = await apiRequest<TableItem[]>("/tables", {
    method: "POST",
    body: { acCount: 0, nonAcCount: count },
    outletId,
  });
  if (result.ok) {
    showToast.success("Tables Created Successfully", `${count} table${count !== 1 ? "s" : ""} added with QR tokens.`);
    return { ok: true, tables: result.data };
  }
  showToast.error("Table Creation Failed", result.error);
  return { ok: false, error: result.error };
}

export async function updateTable(
  outletId: string,
  tableId: string,
  data: { tableType?: "AC" | "NON_AC"; status?: "AVAILABLE" | "OCCUPIED"; assignedStaffId?: string | null }
): Promise<{ ok: boolean; error?: string }> {
  const result = await apiRequest(`/tables/${tableId}`, {
    method: "PATCH",
    body: data,
    outletId,
  });
  if (result.ok) {
    showToast.success("Table Updated", "Table details updated successfully.");
    return { ok: true };
  }
  showToast.error("Table Update Failed", result.error);
  return { ok: false, error: result.error };
}

export async function regenerateTableQRToken(
  outletId: string,
  tableId: string
): Promise<{ ok: boolean; token?: string; error?: string }> {
  const result = await apiRequest<{ token: string }>(`/tables/${tableId}/regenerate-qr`, {
    method: "POST",
    outletId,
  });
  if (result.ok) {
    showToast.success("QR Token Regenerated", "New QR code token is active.");
    return { ok: true, token: result.data.token };
  }
  showToast.error("QR Regeneration Failed", result.error);
  return { ok: false, error: result.error };
}

export async function deleteTable(
  outletId: string,
  tableId: string
): Promise<{ ok: boolean; error?: string }> {
  const result = await apiRequest(`/tables/${tableId}`, {
    method: "DELETE",
    outletId,
  });
  if (result.ok) {
    showToast.success("Table Deleted", "Table removed from dining floor.");
    return { ok: true };
  }
  showToast.error("Table Deletion Failed", result.error);
  return { ok: false, error: result.error };
}

// ── Customer QR Ordering APIs ─────────────────────────────────────────────

export interface CustomerMenuItem {
  id: string;
  name: string;
  description: string;
  imageUrl: string | null;
  pricePaise: number;
  isVeg: boolean;
  dietaryType?: 'VEG' | 'NON_VEG' | 'VEGAN';
  isActive: boolean;
  modifierGroups?: any[];
}

export interface CustomerMenuCategory {
  id: string;
  name: string;
  description: string;
  menuItems: CustomerMenuItem[];
}

export interface TableMenuResponse {
  ok: boolean;
  businessName?: string;
  outletName?: string;
  outletId?: string;
  tableNumber?: number;
  tableOrderMode?: 'WAITER_SERVICE' | 'ORDER_AND_PAY';
  allowPayAtCounter?: boolean;
  upiId?: string | null;
  currency?: string;
  taxRates?: {
    cgstRate: number;
    sgstRate: number;
    serviceChargeRate: number;
    gstRegistrationType: 'REGULAR' | 'COMPOSITION' | 'UNREGISTERED';
  };
  categories?: CustomerMenuCategory[];
  error?: string;
}

export interface QROrderItemInput {
  menuItemId: string;
  quantity: number;
  notes?: string;
  modifiers?: {
    id?: string;
    name: string;
    price?: number;
    pricePaise?: number;
  }[];
}

export interface CreateQROrderPayload {
  tableToken: string;
  items: QROrderItemInput[];
  customerName?: string;
  customerPhone?: string;
  paymentMethod?: 'UPI' | 'CARD' | 'CASH';
  paymentStatus?: 'PENDING' | 'CONFIRMED' | 'FAILED';
  paymentRef?: string;
}

export async function fetchTableMenu(
  token: string
): Promise<TableMenuResponse> {
  const result = await apiRequest<any>(`/orders/tables/${token}/menu`);
  
  if (!result.ok) {
    return { ok: false, error: result.error };
  }
  
  const data = result.data;
  return { 
    ok: true, 
    businessName: data?.businessName, 
    outletName: data?.outletName,
    outletId: data?.outletId,
    tableNumber: data?.tableNumber,
    tableOrderMode: data?.tableOrderMode || 'WAITER_SERVICE',
    allowPayAtCounter: data?.allowPayAtCounter ?? true,
    upiId: data?.upiId,
    currency: data?.currency || 'INR',
    taxRates: data?.taxRates || {
      cgstRate: 2.5,
      sgstRate: 2.5,
      serviceChargeRate: 0,
      gstRegistrationType: 'REGULAR',
    },
    categories: Array.isArray(data) ? data : data?.categories || []
  };
}

export async function fetchActiveTableOrder(
  token: string
): Promise<{ ok: boolean; order?: any; error?: string }> {
  const result = await apiRequest<any>(`/orders/tables/${token}/active`);
  if (!result.ok) {
    return { ok: false, error: result.error };
  }
  return { ok: true, order: result.data };
}

export async function createQROrder(
  payload: CreateQROrderPayload | { tableToken: string; items: Array<{ menuItemId: string; quantity: number }> }
): Promise<{ ok: boolean; order?: any; error?: string }> {
  const result = await apiRequest<{ id: string }>("/orders", {
    method: "POST",
    body: {
      source: "QR",
      ...payload,
    },
  });
  if (result.ok) {
    showToast.success("Order Placed!", "Your order has been sent to the kitchen.");
    return { ok: true, order: result.data };
  }
  showToast.error("Order Failed", result.error);
  return { ok: false, error: result.error };
}

// ── AlaynAI Executive Assistant API ───────────────────────────────────────

export interface AlaynAIMessage {
  role: "user" | "assistant";
  content: string;
}

/** The café data sections AlaynAI checked for an answer */
export type AlaynAITopic = "sales" | "staff" | "stock" | "menu";

/**
 * Which saved chat a question belongs to. No `chatId` starts a new chat; `retry` replaces the
 * chat's last question and answer ("Ask again"). The server keeps the history, so it isn't sent.
 */
export interface AlaynAIChatTarget {
  chatId?: string | null;
  retry?: boolean;
}

/** Asks AlaynAI and gets the whole answer at once (used when streaming isn't available). */
export async function askAlaynAI(
  prompt: string,
  outletId: string | undefined,
  target: AlaynAIChatTarget = {}
): Promise<{ ok: boolean; answer?: string; chatId?: string | null; title?: string | null; error?: string }> {
  const result = await apiRequest<{ answer: string; chatId: string | null; title: string | null }>("/ai/assistant", {
    method: "POST",
    body: { prompt, outletId, chatId: target.chatId ?? null, retry: !!target.retry },
    outletId,
  });

  if (result.ok) {
    return { ok: true, answer: result.data.answer, chatId: result.data.chatId, title: result.data.title };
  }
  return { ok: false, error: result.error };
}

interface StreamHandlers {
  /** The saved chat this answer belongs to (sent first, so a new chat gets its id straight away) */
  onChat?: (chatId: string, title: string) => void;
  onTopics?: (topics: AlaynAITopic[]) => void;
  onDelta: (text: string) => void;
  signal?: AbortSignal;
}

/**
 * Asks AlaynAI and receives the answer as it is written (server-sent events). If streaming can't
 * start (an old server, a proxy that blocks it), it falls back to the one-piece endpoint and delivers
 * that answer in one go. Resolves when the answer is complete, stopped, or failed.
 */
export async function streamAlaynAI(
  prompt: string,
  outletId: string | undefined,
  target: AlaynAIChatTarget,
  { onChat, onTopics, onDelta, signal }: StreamHandlers,
  isRetry = false
): Promise<{ ok: boolean; stopped?: boolean; error?: string }> {
  let res: Response;
  try {
    res = await fetch(`${BACKEND_URL}/ai/assistant/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(outletId ? { "x-outlet-id": outletId } : {}) },
      credentials: "include",
      body: JSON.stringify({ prompt, outletId, chatId: target.chatId ?? null, retry: !!target.retry }),
      signal,
    });
  } catch {
    if (signal?.aborted) return { ok: false, stopped: true };
    return oneShot();
  }

  if (res.status === 401 && !isRetry) {
    const refreshed = await fetch(`${BACKEND_URL}/auth/refresh`, { method: "POST", credentials: "include" }).catch(() => null);
    if (refreshed?.ok) return streamAlaynAI(prompt, outletId, target, { onChat, onTopics, onDelta, signal }, true);
  }
  if (res.status === 404) {
    return { ok: false, error: "This conversation was not found. It may have been deleted." };
  }
  if (!res.ok || !res.body || !res.headers.get("content-type")?.includes("text/event-stream")) return oneShot();

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      // Events are separated by a blank line; each has "event:" and "data:" lines
      const events = buffer.split("\n\n");
      buffer = events.pop() ?? "";
      for (const raw of events) {
        const dataLine = raw.split("\n").find((l) => l.startsWith("data:"));
        if (!dataLine) continue;
        const event = JSON.parse(dataLine.slice(5).trim()) as
          | { type: "chat"; chatId: string; title: string }
          | { type: "topics"; topics: AlaynAITopic[] }
          | { type: "delta"; text: string }
          | { type: "done" }
          | { type: "error"; message: string };
        if (event.type === "chat") onChat?.(event.chatId, event.title);
        else if (event.type === "topics") onTopics?.(event.topics);
        else if (event.type === "delta") onDelta(event.text);
        else if (event.type === "error") return { ok: false, error: event.message };
        else if (event.type === "done") return { ok: true };
      }
    }
    return { ok: true };
  } catch {
    if (signal?.aborted) return { ok: false, stopped: true };
    return { ok: false, error: "The answer was cut off. Please ask again." };
  }

  async function oneShot() {
    const result = await askAlaynAI(prompt, outletId, target);
    if (signal?.aborted) return { ok: false, stopped: true };
    if (result.ok && result.answer) {
      if (result.chatId && result.title) onChat?.(result.chatId, result.title);
      onDelta(result.answer);
      return { ok: true };
    }
    return { ok: false, error: result.error || "Alayn AI could not answer just now. Please try again." };
  }
}

// ── Saved AlaynAI chats (each person sees only their own; kept for 30 days) ──

export interface AlaynAIChatSummary {
  id: string;
  title: string;
  updatedAt: string;
}

export interface AlaynAISavedMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  topics: AlaynAITopic[];
  status: "done" | "stopped" | "error";
  createdAt: string;
}

/** The signed-in person's chats about this outlet (or "all outlets"), newest first. */
export async function listAlaynAIChats(outletId?: string) {
  return apiRequest<{ chats: AlaynAIChatSummary[] }>("/ai/chats", { outletId });
}

export async function getAlaynAIChat(chatId: string, outletId?: string) {
  return apiRequest<{ id: string; title: string; updatedAt: string; messages: AlaynAISavedMessage[] }>(
    `/ai/chats/${encodeURIComponent(chatId)}`,
    { outletId }
  );
}

export async function deleteAlaynAIChat(chatId: string, outletId?: string) {
  return apiRequest<{ deleted: number }>(`/ai/chats/${encodeURIComponent(chatId)}`, { method: "DELETE", outletId });
}

export async function deleteAllAlaynAIChats(outletId?: string) {
  return apiRequest<{ deleted: number }>("/ai/chats", { method: "DELETE", outletId });
}


