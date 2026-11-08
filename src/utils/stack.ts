export type StackItem = { key: string; label: string; valueYen: number };

export type StackSegment = StackItem & { share: number };

// Negative values (e.g. take-home pay below zero) cannot be drawn as a share, so they are left out.
export const stackSegments = (items: readonly StackItem[]): StackSegment[] => {
  const positive = items.filter(({ valueYen }) => valueYen > 0);
  const totalYen = positive.reduce((sum, { valueYen }) => sum + valueYen, 0);
  if (!(totalYen > 0)) {
    return [];
  }
  return positive.map((item) => ({ ...item, share: item.valueYen / totalYen }));
};

export const shareOfLargest = (values: readonly number[]): number[] => {
  const largest = Math.max(0, ...values);
  return values.map((value) => (largest > 0 ? Math.max(value, 0) / largest : 0));
};
