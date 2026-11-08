const MIN_INCOME_FROM_HASH_YEN = 100000;

export const incomeFromHash = (hash: string): number | undefined => {
  const income = Number(hash.replace(/#/, ""));
  return income > MIN_INCOME_FROM_HASH_YEN ? income : undefined;
};
