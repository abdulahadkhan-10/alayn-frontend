import { AlaynAITopic } from "@/lib/api";

/** How each data section reads in "Checked: …" */
export const TOPIC_LABELS: Record<AlaynAITopic, string> = {
  sales: "Sales and forecast",
  staff: "Roster and attendance",
  stock: "Stock and waste",
  menu: "Menu sales",
};

/** Natural next questions for each section, picked without another AI call */
const FOLLOW_UPS: Record<AlaynAITopic, string[]> = {
  sales: ["Compare this month with last month", "Which day of the week is busiest?", "What were my sales yesterday?"],
  staff: ["Who is working tomorrow?", "Is next week's roster enough for the forecast?"],
  stock: ["What expires this week?", "What is running low?"],
  menu: ["Which dishes are not selling?", "What are my top 5 dishes this month?"],
};

/**
 * Up to three follow-up questions for an answer that used these sections. A broad question (every
 * section) gets one from sales, stock and staff; questions already asked are skipped.
 */
export function followUpsFor(topics: AlaynAITopic[], asked: string[]): string[] {
  const seen = new Set(asked.map((q) => q.trim().toLowerCase()));
  const order: AlaynAITopic[] = topics.length >= 4 ? ["sales", "stock", "staff"] : topics;
  const picks: string[] = [];
  // Round-robin so two sections each get a say before either gets a second question
  for (let round = 0; picks.length < 3 && round < 3; round++) {
    for (const t of order) {
      const q = FOLLOW_UPS[t]?.[round];
      if (q && !seen.has(q.toLowerCase()) && !picks.includes(q)) picks.push(q);
      if (picks.length === 3) break;
    }
  }
  return picks;
}
