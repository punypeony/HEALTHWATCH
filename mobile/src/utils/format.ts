import type { IntakeNutrient } from "../types";

export function twoDecimals(value: number): string {
  return value.toFixed(2);
}

function halfUpTwo(value: number): number {
  return Math.round(value * 100) / 100;
}

const INTAKE_CHECKS = [
  { key: "calories", label: "calories", unit: "kcal" },
  { key: "sodium", label: "sodium", unit: "mg" },
  { key: "sugar", label: "sugar", unit: "g" },
  { key: "carbohydrates", label: "carbohydrate", unit: "g" },
  { key: "saturated_fat", label: "saturated fat", unit: "g" },
  { key: "protein", label: "protein", unit: "g" },
] as const;

export function dailyLimitWarnings(
  nutrients: Record<string, IntakeNutrient>,
  per100g: Partial<Record<(typeof INTAKE_CHECKS)[number]["key"], number | null | undefined>>,
  grams: number,
): string[] {
  const lines: string[] = [];
  for (const check of INTAKE_CHECKS) {
    const row = nutrients[check.key];
    const amount = per100g[check.key];
    if (!row || row.incomplete || row.consumed == null || amount == null || !Number.isFinite(amount)) {
      continue;
    }
    const cap = row.limit ?? row.target;
    if (cap == null) {
      continue;
    }
    const addition = halfUpTwo((amount * grams) / 100);
    const consumedCents = Math.round(row.consumed * 100);
    const capCents = Math.round(cap * 100);
    const additionCents = Math.round(addition * 100);
    if (consumedCents <= capCents && consumedCents + additionCents <= capCents) {
      continue;
    }
    lines.push(
      `Today's ${check.label} is ${twoDecimals(row.consumed)} ${check.unit} of ${twoDecimals(cap)} ${check.unit}. This meal adds ${twoDecimals(addition)} ${check.unit}.`,
    );
  }
  return lines;
}

export function gramsFromServings(servingsText: string, servingGrams: number): number | null {
  const trimmed = servingsText.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) {
    return null;
  }
  const servings = Number(trimmed);
  if (!Number.isFinite(servings) || servings <= 0 || !Number.isFinite(servingGrams) || servingGrams <= 0) {
    return null;
  }
  const grams = Math.round(servings * servingGrams * 100) / 100;
  return grams > 0 ? grams : null;
}

export function nutritionBasis(barcode: string): string {
  if (barcode.startsWith("dish:")) {
    return "FNRI food composition library, per 100 g edible portion";
  }
  if (barcode.startsWith("20000000000")) {
    return "Offline demo data, per 100 g";
  }
  return "Open Food Facts, per 100 g";
}

export function formatWhen(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString();
}

export function formatScanTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  const day = date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const time = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return `${day} · ${time}`;
}
