// Spoken cancellation alerts for the kitchen screen, using the browser's built-in speech
// (no API, no cost, works offline with the device's installed voices).

// Speak slightly slower than normal so it is clear over kitchen noise
const RATE = 0.92;
const VOLUME = 1;

let voice: SpeechSynthesisVoice | null = null;

/** Prefer an Indian English voice, then any English voice, then the device default. */
function pickVoice() {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return; // Chrome loads voices late; onvoiceschanged retries
  voice =
    voices.find((v) => v.lang === "en-IN") ||
    voices.find((v) => v.lang.startsWith("en") && /female|zira|samantha|google/i.test(v.name)) ||
    voices.find((v) => v.lang.startsWith("en")) ||
    null;
}

if (typeof window !== "undefined" && window.speechSynthesis) {
  pickVoice();
  window.speechSynthesis.addEventListener?.("voiceschanged", pickVoice);
}

/** Speaks the text after `delayMs` (used to let the chime finish first). Several alerts queue up in order. */
export function speakKitchenAlert(text: string, delayMs = 0) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.setTimeout(() => {
    if (!voice) pickVoice();
    const utterance = new SpeechSynthesisUtterance(text);
    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
    } else {
      utterance.lang = "en-IN";
    }
    utterance.rate = RATE;
    utterance.volume = VOLUME;
    // Chrome can leave speech stuck "paused" after the tab was in the background
    if (window.speechSynthesis.paused) window.speechSynthesis.resume();
    window.speechSynthesis.speak(utterance);
  }, delayMs);
}

/** The parts of a kitchen socket update this module reads (the server sends more). */
interface KitchenItem {
  id?: string;
  cancelledAt?: string | null;
  menuItemName?: string;
  menuItem?: { name?: string } | null;
}
interface KitchenOrder {
  id?: string;
  tableNo?: number | string | null;
  tableNumber?: number | string | null;
  orderNo?: string | null;
  orderNumber?: string | null;
  items?: KitchenItem[];
  orderItems?: KitchenItem[];
}
export interface KitchenUpdate {
  orderId?: string;
  itemCancelled?: boolean;
  cancelledItemId?: string;
  order?: KitchenOrder | null;
}

const cancelledItem = (data: KitchenUpdate) =>
  (data.order?.items || data.order?.orderItems || []).find((i) => i.id === data.cancelledItemId);

/**
 * "Order 0 0 1 2": the last 4 digits of the order number, spoken digit by digit so it matches the ticket.
 * Works for online numbers ("SEA202611020012") and offline ones ("SEA20261102-T1-0012").
 */
function orderLabel(order: KitchenOrder | null | undefined): string {
  const lastFour = String(order?.orderNo || order?.orderNumber || "").replace(/\D/g, "").slice(-4);
  return lastFour ? `Order ${lastFour.split("").join(" ")}` : "Order";
}

/** "Table 4. Order 0 0 1 2" for dine-in, "Order 0 0 1 2" for counter bills. */
function whereFrom(order: KitchenOrder | null | undefined): string {
  const table = order?.tableNo ?? order?.tableNumber;
  return table ? `Table ${table}. ${orderLabel(order)}` : orderLabel(order);
}

// Cancellations already announced on this screen, with when (so later updates to a cancelled order stay silent)
const announced = new Map<string, number>();
const FORGET_AFTER_MS = 60 * 60 * 1000;

/**
 * True the first time a cancellation is seen; false for the same cancellation arriving again
 * (e.g. a refund or note on an already-cancelled order sends another update carrying status CANCELLED).
 * A second partial cancel of the same item has a new cancelledAt, so it still counts as new.
 */
export function isNewCancellation(data: KitchenUpdate): boolean {
  const orderId = data.orderId || data.order?.id;
  let key: string;
  if (data.itemCancelled) {
    const item = cancelledItem(data);
    key = `item:${data.cancelledItemId ?? orderId}:${item?.cancelledAt ?? Date.now()}`;
  } else {
    if (!orderId) return true; // can't tell, so don't risk staying silent
    key = `order:${orderId}`;
  }

  const now = Date.now();
  for (const [k, at] of announced) if (now - at > FORGET_AFTER_MS) announced.delete(k);
  if (announced.has(key)) return false;
  announced.set(key, now);
  return true;
}

/** Sentence for a socket cancellation event; falls back to a generic line when the dish name isn't known. */
export function cancellationMessage(data: KitchenUpdate): string {
  const where = whereFrom(data.order);

  if (data.itemCancelled) {
    const item = cancelledItem(data);
    const name = item?.menuItem?.name || item?.menuItemName;
    return name ? `${where}. ${name} cancelled. Stop preparing.` : `${where}. An item was cancelled. Stop preparing.`;
  }
  return `${where} cancelled. Stop preparing.`;
}
