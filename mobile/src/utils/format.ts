export function twoDecimals(value: number): string {
  return value.toFixed(2);
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
