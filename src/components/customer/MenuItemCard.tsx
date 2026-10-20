"use client";

import React, { useState } from "react";
import { Plus } from "lucide-react";
import type { CustomerMenuItem } from "@/lib/api";
import { resolveUploadUrl } from "@/lib/api";
import { cn } from "@/lib/utils";
import { DietaryMark, QuantityStepper } from "./MenuBits";
import { dietaryTypeOf, formatRupees } from "./menuFormat";

interface MenuItemCardProps {
  item: CustomerMenuItem;
  /** How many of this dish (all variations) are in the cart */
  quantity: number;
  /** False in waiter-service mode: the menu is view-only */
  canOrder: boolean;
  onAdd: () => void;
  onRemove: () => void;
  onOpenImage: (url: string) => void;
}

export default function MenuItemCard({ item, quantity, canOrder, onAdd, onRemove, onOpenImage }: MenuItemCardProps) {
  const imageUrl = resolveUploadUrl(item.imageUrl);
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = !!imageUrl && !imageFailed;
  const customisable = (item.modifierGroups?.length || 0) > 0;

  const control = canOrder ? (
    quantity > 0 ? (
      <QuantityStepper value={quantity} onDecrement={onRemove} onIncrement={onAdd} label={item.name} size="sm" />
    ) : (
      <button
        type="button"
        onClick={onAdd}
        aria-label={`Add ${item.name}`}
        className={cn(
          "inline-flex h-10 w-[104px] items-center justify-center gap-1 rounded-xl border border-[#C41E2A]/25 bg-white",
          "text-sm font-bold uppercase tracking-wide text-(--amber) shadow-[0_1px_2px_rgba(11,18,32,0.06)]",
          "transition-[transform,background-color] duration-150 ease-out hover:bg-[#FDF2F3] active:scale-[0.97]",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--amber)"
        )}
      >
        Add
        <Plus className="h-3.5 w-3.5" strokeWidth={3} aria-hidden="true" />
      </button>
    )
  ) : null;

  return (
    <article className="flex gap-4 py-5">
      <div className="min-w-0 flex-1">
        <DietaryMark type={dietaryTypeOf(item)} />
        <h3 className="mt-1.5 text-[16px] font-semibold leading-snug text-(--espresso)">{item.name}</h3>
        <p className="mt-1 text-[15px] font-semibold text-(--espresso) tabular-nums">{formatRupees(item.pricePaise)}</p>
        {item.description && (
          <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-(--muted)">{item.description}</p>
        )}
        {/* Without a photo the add control sits under the text */}
        {!showImage && control && <div className="mt-3">{control}</div>}
        {canOrder && customisable && !showImage && (
          <p className="mt-1.5 text-xs text-(--muted)">Customisable</p>
        )}
      </div>

      {showImage && (
        <div className="relative flex w-[120px] shrink-0 flex-col items-center sm:w-[136px]">
          <button
            type="button"
            onClick={() => onOpenImage(imageUrl)}
            aria-label={`View photo of ${item.name}`}
            className="block aspect-square w-full overflow-hidden rounded-2xl bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--espresso)"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- menu photos are served from the outlet's upload host */}
            <img
              src={imageUrl}
              alt=""
              width={136}
              height={136}
              loading="lazy"
              decoding="async"
              onError={() => setImageFailed(true)}
              className="h-full w-full object-cover"
            />
          </button>
          {control && <div className="-mt-5">{control}</div>}
          {canOrder && customisable && <p className="mt-1 text-[11px] text-(--muted)">Customisable</p>}
        </div>
      )}
    </article>
  );
}
