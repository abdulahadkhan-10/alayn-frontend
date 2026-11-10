import type { ReactNode } from "react";

/**
 * One example screen per kind of kitchen, for the "Set up for the way your
 * kitchen runs" section. They are drawn in HTML in the style of the app
 * (white cards on a pale slate page) rather than screenshots, so each one can
 * show exactly the part of Alayn that kitchen leans on. All values are
 * examples; every feature shown is shipped.
 */

function Frame({ title, status, children }: { title: string; status: ReactNode; children: ReactNode }) {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-[#F1F5F9] text-[#1B2A4A] shadow-[0_30px_60px_-30px_rgba(27,42,74,0.4),0_10px_24px_-14px_rgba(27,42,74,0.2)]">
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 sm:px-5">
        <p className="font-heading text-[15px] font-bold tracking-[-0.01em]">{title}</p>
        {status}
      </div>
      <div className="flex-1 p-3 sm:p-5">{children}</div>
    </div>
  );
}

const Card = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <div className={`rounded-xl border border-slate-200 bg-white ${className}`}>{children}</div>
);

type Tone = "ok" | "warn" | "alert" | "quiet";
const TONES: Record<Tone, string> = {
  ok: "bg-emerald-50 text-emerald-800",
  warn: "bg-amber-50 text-amber-900",
  alert: "bg-rose-50 text-rose-700",
  quiet: "bg-slate-100 text-slate-600",
};
const Pill = ({ tone = "quiet", children }: { tone?: Tone; children: ReactNode }) => (
  <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold ${TONES[tone]}`}>
    {children}
  </span>
);

const Label = ({ children }: { children: ReactNode }) => (
  <p className="mb-2 text-xs font-semibold text-slate-500">{children}</p>
);

/* ── Restaurants: the table map and the open table's bill ── */

const TABLES: { no: number; state: "free" | "open" | "selected"; amount?: string }[] = [
  { no: 1, state: "open", amount: "₹840" },
  { no: 2, state: "free" },
  { no: 3, state: "open", amount: "₹2,310" },
  { no: 4, state: "selected", amount: "₹1,155" },
  { no: 5, state: "free" },
  { no: 6, state: "open", amount: "₹460" },
  { no: 7, state: "open", amount: "₹1,720" },
  { no: 8, state: "free" },
  { no: 9, state: "open", amount: "₹990" },
];

export function RestaurantScreen() {
  return (
    <Frame title="Tables" status={<Pill tone="ok">6 tables open</Pill>}>
      <div className="grid h-full gap-3 sm:grid-cols-[1.25fr_1fr] sm:gap-4">
        <ul className="grid grid-cols-3 gap-2 sm:grid-rows-3">
          {TABLES.map((table) => (
            <li
              key={table.no}
              className={`flex flex-col items-center justify-center rounded-xl border px-2.5 py-3 text-center ${
                table.state === "selected"
                  ? "border-[#C41E2A] bg-white ring-2 ring-[#C41E2A]/15"
                  : table.state === "open"
                    ? "border-[#1B2A4A] bg-[#1B2A4A] text-white"
                    : "border-dashed border-slate-300 bg-white/60 text-slate-500"
              }`}
            >
              <span className="font-heading block text-[13px] font-bold">Table {table.no}</span>
              <span className="mt-0.5 block text-xs tabular-nums opacity-80">{table.amount ?? "Free"}</span>
            </li>
          ))}
        </ul>

        <Card className="flex flex-col p-4">
          <p className="flex items-baseline justify-between">
            <span className="font-heading text-[15px] font-bold">Table 4</span>
            <span className="text-xs text-slate-500">3 guests</span>
          </p>
          <ul className="mt-3 flex-1 space-y-1.5 text-[13px]">
            {[
              ["2", "Paneer Tikka", "₹560"],
              ["4", "Butter Naan", "₹180"],
              ["1", "Dal Makhani", "₹240"],
              ["2", "Masala Chaas", "₹120"],
            ].map(([qty, name, price]) => (
              <li key={name} className="flex gap-2">
                <span className="w-4 tabular-nums text-slate-500">{qty}</span>
                <span className="flex-1 font-medium">{name}</span>
                <span className="tabular-nums">{price}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 flex items-baseline justify-between border-t border-dashed border-slate-300 pt-3">
            <span className="text-xs text-slate-500">Total with GST</span>
            <span className="font-heading text-lg font-extrabold tabular-nums">₹1,155</span>
          </p>
          <p className="mt-3">
            <Pill tone="ok">Sent to kitchen</Pill>
          </p>
        </Card>
      </div>
    </Frame>
  );
}

/* ── Cafés: counter bill, a sold-out item, a low-stock alert ── */

export function CafeScreen() {
  return (
    <Frame title="Counter billing" status={<Pill tone="warn">1 item running low</Pill>}>
      <div className="grid h-full gap-3 sm:grid-cols-2 sm:gap-4">
        <Card className="flex flex-col p-4">
          <p className="flex items-baseline justify-between">
            <span className="font-heading text-[15px] font-bold">Token 112</span>
            <span className="text-xs text-slate-500">Takeaway</span>
          </p>
          <ul className="mt-3 flex-1 space-y-1.5 text-[13px]">
            {[
              ["2", "Flat White", "₹360"],
              ["1", "Oat Milk Latte", "₹220"],
              ["1", "Banana Bread", "₹140"],
            ].map(([qty, name, price]) => (
              <li key={name} className="flex gap-2">
                <span className="w-4 tabular-nums text-slate-500">{qty}</span>
                <span className="flex-1 font-medium">{name}</span>
                <span className="tabular-nums">{price}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 flex items-baseline justify-between border-t border-dashed border-slate-300 pt-3">
            <span className="text-xs text-slate-500">Total with GST</span>
            <span className="font-heading text-lg font-extrabold tabular-nums">₹756</span>
          </p>
          <ul className="mt-3 grid grid-cols-3 gap-1.5 text-center text-xs font-semibold">
            <li className="rounded-lg bg-[#1B2A4A] py-2 text-white">UPI</li>
            <li className="rounded-lg border border-slate-200 py-2">Card</li>
            <li className="rounded-lg border border-slate-200 py-2">Cash</li>
          </ul>
        </Card>

        <div className="flex flex-col gap-3">
          <Card className="p-4">
            <Label>On the menu today</Label>
            <ul className="space-y-2.5 text-[13px]">
              {[
                ["Flat White", true],
                ["Almond Croissant", false],
                ["Banana Bread", true],
              ].map(([name, on]) => (
                <li key={name as string} className="flex items-center justify-between gap-3">
                  <span className={on ? "font-medium" : "font-medium text-slate-400 line-through"}>{name}</span>
                  <span className="flex items-center gap-2 text-xs text-slate-500">
                    {on ? "Available" : "Sold out"}
                    <span aria-hidden className={`flex h-4 w-7 items-center rounded-full p-0.5 ${on ? "justify-end bg-emerald-600" : "bg-slate-300"}`}>
                      <span className="h-3 w-3 rounded-full bg-white" />
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </Card>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-[13px] font-semibold text-amber-950">Oat milk is running low</p>
            <p className="mt-0.5 text-xs text-amber-900">3 cartons left. Your minimum is 5.</p>
          </div>
        </div>
      </div>
    </Frame>
  );
}

/* ── Quick service: the kitchen queue, with a cancellation flagged ── */

const QUEUE: { name: string; orders: { token: string; wait: string; items: string[]; cancelled?: string }[] }[] = [
  {
    name: "Sent to kitchen",
    orders: [
      { token: "Token 208", wait: "Just now", items: ["2 Zinger Burger", "1 Fries"] },
      { token: "Token 207", wait: "1 min", items: ["1 Chicken Bucket"] },
    ],
  },
  {
    name: "In preparation",
    orders: [
      { token: "Token 205", wait: "4 min", items: ["3 Chicken Wrap", "2 Cola"], cancelled: "1 Fries cancelled" },
      { token: "Token 204", wait: "5 min", items: ["2 Paneer Wrap", "1 Cold Coffee"] },
    ],
  },
  {
    name: "Ready for pickup",
    orders: [
      { token: "Token 203", wait: "6 min", items: ["2 Veg Burger"] },
      { token: "Token 202", wait: "7 min", items: ["1 Meal Box"] },
    ],
  },
];

export function QuickServiceScreen() {
  return (
    <Frame title="Kitchen display" status={<Pill tone="ok">6 orders in the kitchen</Pill>}>
      <div className="grid gap-3 sm:grid-cols-3">
        {QUEUE.map((column) => (
          <section key={column.name}>
            <Label>{column.name}</Label>
            <ul className="space-y-2">
              {column.orders.map((order) => (
                <li key={order.token}>
                  <Card className="p-3">
                    <p className="flex items-baseline justify-between gap-2">
                      <span className="font-heading text-[13px] font-bold">{order.token}</span>
                      <span className="text-[11px] tabular-nums text-slate-500">{order.wait}</span>
                    </p>
                    <ul className="mt-1.5 space-y-0.5 text-[13px] leading-snug">
                      {order.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                    {order.cancelled && (
                      <p className="mt-2 rounded-md bg-rose-50 px-2 py-1.5 text-xs font-semibold text-rose-700">
                        {order.cancelled}
                      </p>
                    )}
                  </Card>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </Frame>
  );
}

/* ── Cloud kitchens: purchase orders and the week's waste ── */

export function CloudKitchenScreen() {
  return (
    <Frame title="Purchase orders" status={<Pill tone="ok">3 on the way</Pill>}>
      <div className="flex h-full flex-col gap-3">
        <Card className="px-4 py-1">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="text-xs text-slate-500">
                <th className="py-2 font-semibold">Supplier</th>
                <th className="hidden py-2 font-semibold sm:table-cell">Order</th>
                <th className="py-2 text-right font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {(
                [
                  ["Shree Dairy", "Paneer 10 kg, cream 12 packs", "On the way", "ok"],
                  ["Fresh Farm Veg", "Tomato 20 kg, onion 25 kg", "On the way", "ok"],
                  ["Royal Meats", "Chicken 30 kg", "On the way", "ok"],
                  ["Annapurna Grains", "Basmati rice 50 kg", "Delivered", "quiet"],
                ] as [string, string, string, Tone][]
              ).map(([supplier, order, status, tone]) => (
                <tr key={supplier} className="border-t border-slate-100">
                  <td className="py-2.5 font-medium">{supplier}</td>
                  <td className="hidden py-2.5 text-slate-600 sm:table-cell">{order}</td>
                  <td className="py-2.5 text-right">
                    <Pill tone={tone}>{status}</Pill>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <Card className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 p-4">
          <p className="text-[13px]">
            <span className="font-semibold">Waste logged this week</span>
            <span className="block text-xs text-slate-500">Cooked rice 4 kg, chicken 1.5 kg, gravy 1 kg</span>
          </p>
          <p className="font-heading text-xl font-extrabold tabular-nums">6.5 kg</p>
        </Card>
      </div>
    </Frame>
  );
}

/* ── Bakeries: stock by expiry date, soonest first ── */

export function BakeryScreen() {
  return (
    <Frame title="Expiring stock" status={<Pill tone="warn">5 items in the next 2 days</Pill>}>
      <div className="flex h-full flex-col gap-3">
        <Card className="px-4 py-1">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="text-xs text-slate-500">
                <th className="py-2 font-semibold">Item</th>
                <th className="py-2 font-semibold">In stock</th>
                <th className="py-2 text-right font-semibold">Expires</th>
              </tr>
            </thead>
            <tbody>
              {(
                [
                  ["Fresh cream", "3 packs", "Today", "alert"],
                  ["Whole milk", "8 L", "Tomorrow", "warn"],
                  ["Butter", "2 kg", "Tomorrow", "warn"],
                  ["Eggs", "4 trays", "In 2 days", "warn"],
                  ["Cream cheese", "1.5 kg", "In 2 days", "warn"],
                  ["Flour", "40 kg", "In 3 months", "quiet"],
                ] as [string, string, string, Tone][]
              ).map(([item, stock, expires, tone]) => (
                <tr key={item} className="border-t border-slate-100">
                  <td className="py-2 font-medium">{item}</td>
                  <td className="py-2 tabular-nums text-slate-600">{stock}</td>
                  <td className="py-2 text-right">
                    <Pill tone={tone}>{expires}</Pill>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <Card className="flex items-center justify-between gap-4 p-4">
          <p className="text-[13px] font-semibold">Unsold bread logged as waste today</p>
          <p className="font-heading text-xl font-extrabold tabular-nums">3.5 kg</p>
        </Card>
      </div>
    </Frame>
  );
}

/* ── Hotel restaurants: every outlet under one login ── */

const OUTLETS = [
  { name: "The Restaurant", kind: "All-day dining", orders: "86", staff: "9", note: "2 items low", tone: "warn" as Tone },
  { name: "Lobby Café", kind: "Café", orders: "142", staff: "5", note: "Stock fine", tone: "ok" as Tone },
  { name: "Rooftop Bar", kind: "Bar", orders: "37", staff: "4", note: "Opens 6 pm", tone: "quiet" as Tone },
];

export function HotelScreen() {
  return (
    <Frame title="All outlets" status={<Pill tone="ok">18 staff clocked in</Pill>}>
      <ul className="grid h-full gap-3 sm:grid-cols-3">
        {OUTLETS.map((outlet) => (
          <li key={outlet.name}>
            <Card className="flex h-full flex-col justify-between p-4 sm:p-5">
              <p className="font-heading text-[15px] font-bold leading-tight">{outlet.name}</p>
              <p className="text-xs text-slate-500">{outlet.kind}</p>
              <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-3 sm:grid-cols-1">
                <div>
                  <dt className="text-xs text-slate-500">Orders today</dt>
                  <dd className="font-heading text-2xl font-extrabold tabular-nums">{outlet.orders}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500">Staff on shift</dt>
                  <dd className="font-heading text-2xl font-extrabold tabular-nums">{outlet.staff}</dd>
                </div>
              </dl>
              <p className="mt-4">
                <Pill tone={outlet.tone}>{outlet.note}</Pill>
              </p>
            </Card>
          </li>
        ))}
      </ul>
    </Frame>
  );
}
