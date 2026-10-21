"use client";

import React, { useState } from "react";
import { Check } from "lucide-react";
import type { CustomerMenuItem } from "@/lib/api";
import { resolveUploadUrl } from "@/lib/api";
import { cn } from "@/lib/utils";
import BottomSheet from "./BottomSheet";
import { DietaryMark, QuantityStepper } from "./MenuBits";
import { dietaryTypeOf, formatRupees } from "./menuFormat";

export interface CartModifierItem {
  id?: string;
  name: string;
  pricePaise: number;
  isVariant?: boolean;
}

/* eslint-disable @typescript-eslint/no-explicit-any -- modifier groups and options come untyped from the menu API */
type ModifierGroup = any;

const priceOf = (mod: any): number => mod.pricePaise ?? Math.round((Number(mod.price) || 0) * 100);
const isSingleChoice = (group: ModifierGroup) => group.minSelection === 1 && group.maxSelection === 1;
// A single-choice group with priced options sets the dish's price (a size) instead of adding to it
const isSizeGroup = (group: ModifierGroup) => isSingleChoice(group) && (group.modifiers || []).some((m: any) => priceOf(m) > 0);
const sameOption = (a: CartModifierItem, mod: any) => (mod.id ? a.id === mod.id : a.name === mod.name);

/** Required single choices start on their first option, as a diner would expect */
function initialSelection(item: CustomerMenuItem): Record<string, CartModifierItem[]> {
  const selected: Record<string, CartModifierItem[]> = {};
  for (const group of item.modifierGroups || []) {
    const first = group.modifiers?.[0];
    selected[group.id] =
      isSingleChoice(group) && first
        ? [{ id: first.id, name: first.name, pricePaise: priceOf(first), isVariant: isSizeGroup(group) }]
        : [];
  }
  return selected;
}

interface ItemOptionsSheetProps {
  item: CustomerMenuItem | null;
  onClose: () => void;
  onAdd: (item: CustomerMenuItem, modifiers: CartModifierItem[], quantity: number, unitPricePaise: number) => void;
}

/** Choose a size and add-ons for a customisable dish */
export default function ItemOptionsSheet({ item, onClose, onAdd }: ItemOptionsSheetProps) {
  // Keep the last dish while the sheet animates closed, and start fresh choices for each new dish
  const [shown, setShown] = useState<{ item: CustomerMenuItem; selected: Record<string, CartModifierItem[]>; quantity: number } | null>(null);
  if (item && shown?.item.id !== item.id) {
    setShown({ item, selected: initialSelection(item), quantity: 1 });
  }

  const dish = shown?.item;
  const groups: ModifierGroup[] = dish?.modifierGroups || [];
  const selected = shown?.selected || {};
  const quantity = shown?.quantity || 1;

  const chosen = Object.values(selected).flat();
  const size = chosen.find((m) => m.isVariant && m.pricePaise > 0);
  const unitPricePaise = (size ? size.pricePaise : dish?.pricePaise || 0) + chosen.filter((m) => !m.isVariant).reduce((sum, m) => sum + m.pricePaise, 0);
  const missing = groups.find((g) => (selected[g.id] || []).length < (g.minSelection || 0));

  const setSelected = (groupId: string, options: CartModifierItem[]) =>
    setShown((prev) => (prev ? { ...prev, selected: { ...prev.selected, [groupId]: options } } : prev));

  const toggle = (group: ModifierGroup, mod: any) => {
    const current = selected[group.id] || [];
    const option: CartModifierItem = { id: mod.id, name: mod.name, pricePaise: priceOf(mod), isVariant: isSizeGroup(group) };
    if (isSingleChoice(group)) setSelected(group.id, [option]);
    else if (current.some((m) => sameOption(m, mod))) setSelected(group.id, current.filter((m) => !sameOption(m, mod)));
    else if (!group.maxSelection || current.length < group.maxSelection) setSelected(group.id, [...current, { ...option, isVariant: false }]);
  };

  const photo = dish ? resolveUploadUrl(dish.imageUrl) : null;

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
      description={dish?.description || undefined}
      media={
        photo ? (
          <div className="mx-4 mt-3 aspect-[16/9] overflow-hidden rounded-2xl bg-zinc-100 sm:mx-6 sm:mt-6">
            {/* eslint-disable-next-line @next/next/no-img-element -- menu photos are served from the outlet's upload host */}
            <img src={photo} alt="" className="h-full w-full object-cover" />
          </div>
        ) : null
      }
      footer={
        dish && (
          <div className="flex items-center gap-3">
            <QuantityStepper
              value={quantity}
              onDecrement={() => setShown((prev) => (prev ? { ...prev, quantity: Math.max(1, prev.quantity - 1) } : prev))}
              onIncrement={() => setShown((prev) => (prev ? { ...prev, quantity: Math.min(99, prev.quantity + 1) } : prev))}
              label={dish.name}
            />
            <button
              type="button"
              disabled={!!missing}
              onClick={() => {
                onAdd(dish, chosen, quantity, unitPricePaise);
                onClose();
              }}
              className={cn(
                "flex h-12 min-w-0 flex-1 items-center justify-between gap-3 rounded-xl bg-(--amber) px-4 text-[15px] font-semibold text-white",
                "transition-[transform,background-color] duration-150 ease-out hover:bg-[#A91A24] active:scale-[0.98]",
                "disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:active:scale-100",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--amber)"
              )}
            >
              <span className="truncate">{missing ? `Choose ${missing.name}` : "Add item"}</span>
              <span className="shrink-0 tabular-nums">{formatRupees(unitPricePaise * quantity)}</span>
            </button>
          </div>
        )
      }
    >
      <div className="mt-4 space-y-6">
        {groups.map((group) => {
          const single = isSingleChoice(group);
          const sizeGroup = isSizeGroup(group);
          const current = selected[group.id] || [];
          const atMax = !single && !!group.maxSelection && current.length >= group.maxSelection;
          const rule = single
            ? "Choose 1"
            : group.minSelection > 0
              ? `Choose at least ${group.minSelection}${group.maxSelection ? `, up to ${group.maxSelection}` : ""}`
              : group.maxSelection
                ? `Up to ${group.maxSelection}`
                : "Choose any";
          return (
            <fieldset key={group.id}>
              <legend className="w-full">
                <span className="flex items-baseline justify-between gap-2">
                  <span className="text-[15px] font-semibold text-(--espresso)">{group.name}</span>
                  <span className={cn("text-xs", group.minSelection > 0 ? "font-semibold text-(--amber)" : "text-(--muted)")}>
                    {group.minSelection > 0 ? "Required" : "Optional"}
                  </span>
                </span>
                <span className="mt-0.5 block text-xs text-(--muted)">{rule}</span>
              </legend>
              <div className="mt-2.5 overflow-hidden rounded-2xl border border-zinc-200">
                {(group.modifiers || []).map((mod: any, idx: number) => {
                  const isOn = current.some((m) => sameOption(m, mod));
                  const disabled = !isOn && atMax;
                  const price = priceOf(mod);
                  return (
                    <label
                      key={mod.id || mod.name}
                      className={cn(
                        "flex min-h-12 cursor-pointer items-center gap-3 px-4 py-2.5 transition-colors",
                        idx > 0 && "border-t border-zinc-100",
                        isOn ? "bg-[#FDF2F3]" : "hover:bg-zinc-50",
                        disabled && "cursor-not-allowed opacity-50 hover:bg-transparent"
                      )}
                    >
                      <input
                        type={single ? "radio" : "checkbox"}
                        name={`group-${group.id}`}
                        checked={isOn}
                        disabled={disabled}
                        onChange={() => toggle(group, mod)}
                        className="peer sr-only"
                      />
                      <span
                        aria-hidden="true"
                        className={cn(
                          "flex h-5 w-5 shrink-0 items-center justify-center border-2 transition-colors",
                          "peer-focus-visible:ring-2 peer-focus-visible:ring-(--amber) peer-focus-visible:ring-offset-2",
                          single ? "rounded-full" : "rounded-md",
                          isOn ? "border-(--amber) bg-(--amber) text-white" : "border-zinc-300 bg-white"
                        )}
                      >
                        {isOn && (single ? <span className="h-2 w-2 rounded-full bg-white" /> : <Check className="h-3.5 w-3.5" strokeWidth={3} />)}
                      </span>
                      <span className="min-w-0 flex-1 text-[15px] text-(--espresso)">{mod.name}</span>
                      <span className="shrink-0 text-sm tabular-nums text-(--muted)">
                        {sizeGroup ? formatRupees(price) : price > 0 ? `+${formatRupees(price)}` : ""}
                      </span>
                    </label>
                  );
                })}
              </div>
              {atMax && <p className="mt-1.5 text-xs text-(--muted)">You&apos;ve picked the most allowed for {group.name}.</p>}
            </fieldset>
          );
        })}
      </div>
    </BottomSheet>
  );
}
