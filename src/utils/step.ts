// An empty or invalid field counts as zero; the result never goes below zero.
export const stepAmount = (current: number | "", deltaYen: number): number => {
  const base = Number(current);
  return Math.max((Number.isFinite(base) ? base : 0) + deltaYen, 0);
};
