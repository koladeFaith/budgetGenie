export const CURRENCY_SYMBOLS: Record<string, string> = {
  NGN: "₦",
  USD: "$",
  EUR: "€",
  GBP: "£",
  GHS: "₵",
  KES: "KSh",
  ZAR: "R",
};

export function getCurrencySymbol(code: string | null | undefined): string {
  if (!code) return "₦";
  return CURRENCY_SYMBOLS[code] ?? code;
}

export function formatMoney(amount: number, currency = "NGN"): string {
  const symbol = getCurrencySymbol(currency);
  const sign = amount < 0 ? "-" : "";
  const abs = Math.abs(amount);
  const formatted = new Intl.NumberFormat("en-NG", {
    minimumFractionDigits: abs % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(abs);
  return `${sign}${symbol}${formatted}`;
}

export function formatCompact(amount: number, currency = "NGN"): string {
  const symbol = getCurrencySymbol(currency);
  const formatted = new Intl.NumberFormat("en-NG", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(amount);
  return `${symbol}${formatted}`;
}

export function formatDate(d: string | Date): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function monthLabel(year: number, month: number): string {
  return new Date(year, month - 1, 1).toLocaleDateString("en-NG", {
    month: "long",
    year: "numeric",
  });
}
