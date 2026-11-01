"use client";

import React, { useState } from "react";

type NativeProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type" | "value" | "onChange" | "min" | "max" | "step" | "inputMode"
>;

interface BaseProps extends NativeProps {
  /** Smallest allowed value; a lower value is raised to it when the field loses focus */
  min?: number;
  /** Largest allowed value; a higher value is lowered to it when the field loses focus */
  max?: number;
  /** Whole numbers only (no decimal point) */
  integer?: boolean;
}

interface RequiredValueProps extends BaseProps {
  value: number;
  /** Called while typing with each valid number, and once more on blur if it was clamped */
  onChange: (value: number) => void;
  allowEmpty?: false;
}

interface OptionalValueProps extends BaseProps {
  value: number | "";
  /** "" while the field is empty */
  onChange: (value: number | "") => void;
  /** The field may be left empty (the form validates it on submit) */
  allowEmpty: true;
}

type Props = RequiredValueProps | OptionalValueProps;

/** Digits with at most one decimal point, leading zeros removed ("02" -> "2", "007.5" -> "7.5"). */
export function sanitizeNumberText(raw: string, integer = false): string {
  let s = raw.replace(/,/g, ".").replace(integer ? /[^\d]/g : /[^\d.]/g, "");
  const dot = s.indexOf(".");
  if (dot !== -1) s = s.slice(0, dot + 1) + s.slice(dot + 1).replace(/\./g, "");
  s = s.replace(/^0+(?=\d)/, "");
  if (s.startsWith(".")) s = "0" + s;
  return s;
}

const toText = (v: number | "") => (v === "" ? "" : String(v));

/**
 * Number field that can be cleared and typed into freely.
 *
 * A controlled <input type="number"> bound to a number keeps "02" on screen
 * (React sees 2 === 2 and leaves the text alone) and snaps an empty field to
 * 0. This keeps its own text, strips leading zeros, and only reports clean
 * numbers; min/max are applied when the field loses focus.
 */
export default function NumberInput(props: Props) {
  const { value, onChange, min, max, integer = false, allowEmpty, onBlur, onFocus, onKeyDown, ...rest } = props;
  const emit = onChange as (v: number | "") => void;

  const [text, setText] = useState(toText(value));
  const [lastValue, setLastValue] = useState<number | "">(value);

  // Follow changes made outside the field (+ / − buttons, form reset, …)
  if (value !== lastValue) {
    setLastValue(value);
    const shown = text === "" ? "" : Number(text);
    if (shown !== value) setText(toText(value));
  }

  const clamp = (n: number) => {
    let v = n;
    if (min !== undefined && v < min) v = min;
    if (max !== undefined && v > max) v = max;
    return v;
  };

  const commit = () => {
    const n = Number(text);
    let final: number | "";
    if (text === "" || !Number.isFinite(n)) {
      final = allowEmpty ? "" : clamp(min ?? 0);
    } else {
      final = clamp(n);
    }
    setText(toText(final));
    setLastValue(final);
    if (final !== value) emit(final);
  };

  return (
    <input
      {...rest}
      type="text"
      inputMode={integer ? "numeric" : "decimal"}
      autoComplete="off"
      value={text}
      onChange={(e) => {
        const next = sanitizeNumberText(e.target.value, integer);
        setText(next);
        if (next === "") {
          if (allowEmpty) {
            setLastValue("");
            emit("");
          }
          return;
        }
        const n = Number(next);
        if (!next.endsWith(".") && Number.isFinite(n)) {
          setLastValue(n);
          emit(n);
        }
      }}
      onBlur={(e) => {
        commit();
        onBlur?.(e);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") commit();
        onKeyDown?.(e);
      }}
      onFocus={(e) => {
        e.currentTarget.select();
        onFocus?.(e);
      }}
    />
  );
}
