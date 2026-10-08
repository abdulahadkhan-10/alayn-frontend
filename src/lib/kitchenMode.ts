export type KitchenMode = "KOT" | "KDS" | "HYBRID";

export interface KitchenModeCapabilities {
  mode: KitchenMode;
  supportsKotPrint: boolean;
  supportsKdsScreen: boolean;
  isKdsOnly: boolean;
  isKotOnly: boolean;
  isHybrid: boolean;
}

/**
 * Returns typed capabilities for an outlet's kitchen dispatch mode.
 * - KOT: Physical thermal paper slips only. Suppresses KDS dispatch interfaces.
 * - KDS: Paperless interactive touchscreen. Suppresses physical KOT print buttons/toggles.
 * - HYBRID: Dual dispatch. Both KOT printing and KDS live board are available.
 */
export function getKitchenModeCapabilities(
  rawMode?: string | null
): KitchenModeCapabilities {
  const mode: KitchenMode =
    rawMode === "KOT" || rawMode === "KDS" || rawMode === "HYBRID"
      ? rawMode
      : "HYBRID";

  return {
    mode,
    supportsKotPrint: mode === "KOT" || mode === "HYBRID",
    supportsKdsScreen: mode === "KDS" || mode === "HYBRID",
    isKdsOnly: mode === "KDS",
    isKotOnly: mode === "KOT",
    isHybrid: mode === "HYBRID",
  };
}
