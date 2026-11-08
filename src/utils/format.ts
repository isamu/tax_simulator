export const formatYen = (value: number): string =>
  Number.isFinite(value) ? Math.round(value).toLocaleString("ja-JP") : "—";

const PERCENT = 100;

export const formatPercent = (share: number): string =>
  Number.isFinite(share) ? `${Math.round(share * PERCENT)}%` : "—";
