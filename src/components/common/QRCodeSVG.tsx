"use client";

import React from "react";
import { QRCodeSVG as ReactQRCodeSVG } from "qrcode.react";

interface QRCodeSVGProps {
  value: string;
  size?: number;
  bgColor?: string;
  fgColor?: string;
  className?: string;
}

export function QRCodeSVG({
  value,
  size = 160,
  bgColor = "#FFFFFF",
  fgColor = "#1B2A4A",
  className = "",
}: QRCodeSVGProps) {
  if (!value) {
    return (
      <div
        style={{ width: size, height: size }}
        className={`bg-gray-100 rounded-lg flex items-center justify-center text-[10px] text-gray-400 font-semibold ${className}`}
      >
        No URL
      </div>
    );
  }

  return (
    <ReactQRCodeSVG
      value={value}
      size={size}
      bgColor={bgColor}
      fgColor={fgColor}
      level="M"
      marginSize={1}
      className={className}
    />
  );
}
