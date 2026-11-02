"use client";

import React from "react";
import NumberInput from "@/components/ui/NumberInput";

interface Props {
  value: number;
  /** Smallest allowed quantity; applied when the field loses focus */
  min?: number;
  /** Called while typing with every valid number (not yet clamped to min) */
  onChange: (value: number) => void;
  className?: string;
  "aria-label"?: string;
}

/** Order quantity field: never empty, never below the minimum once the user leaves it. */
export default function QuantityInput({ min = 0, ...props }: Props) {
  return <NumberInput min={min} {...props} />;
}
