type MonthlyFeeGrade = { lowerBoundYen: number; feeYen: number };

const LOWEST_MONTHLY_FEE_YEN = 58000;

const MONTHLY_FEE_GRADES: readonly MonthlyFeeGrade[] = [
  [63000, 68000],
  [73000, 78000],
  [83000, 88000],
  [93000, 98000],
  [101000, 104000],
  [107000, 110000],
  [114000, 118000],
  [122000, 126000],
  [130000, 134000],
  [138000, 142000],
  [146000, 150000],
  [155000, 160000],
  [165000, 170000],
  [175000, 180000],
  [185000, 190000],
  [195000, 200000],
  [210000, 220000],
  [230000, 240000],
  [250000, 260000],
  [270000, 280000],
  [290000, 300000],
  [310000, 320000],
  [330000, 340000],
  [350000, 360000],
  [370000, 380000],
  [395000, 410000],
  [425000, 440000],
  [455000, 470000],
  [485000, 500000],
  [515000, 530000],
  [545000, 560000],
  [575000, 590000],
  [605000, 620000],
  [635000, 650000],
  [665000, 680000],
  [695000, 710000],
  [730000, 750000],
  [770000, 790000],
  [810000, 830000],
  [855000, 880000],
  [905000, 930000],
  [955000, 980000],
  [1005000, 1030000],
  [1055000, 1090000],
  [1115000, 1150000],
  [1175000, 1210000],
  [1235000, 1270000],
  [1295000, 1330000],
  [1355000, 1390000],
].map(([lowerBoundYen, feeYen]) => ({ lowerBoundYen, feeYen }));

export const standardMonthlyFee = (monthlyIncomeYen: number): number => {
  const grade = MONTHLY_FEE_GRADES.findLast(({ lowerBoundYen }) => monthlyIncomeYen >= lowerBoundYen);
  return grade?.feeYen ?? LOWEST_MONTHLY_FEE_YEN;
};

type IncomeTaxBracket = { upperBoundYen: number; rate: number; deductionYen: number };

const INCOME_TAX_BRACKETS: readonly IncomeTaxBracket[] = [
  { upperBoundYen: 1950000, rate: 0.05, deductionYen: 0 },
  { upperBoundYen: 3300000, rate: 0.1, deductionYen: 97500 },
  { upperBoundYen: 6950000, rate: 0.2, deductionYen: 427500 },
  { upperBoundYen: 9000000, rate: 0.23, deductionYen: 636000 },
  { upperBoundYen: 18000000, rate: 0.33, deductionYen: 1536000 },
  { upperBoundYen: 40000000, rate: 0.4, deductionYen: 2796000 },
  { upperBoundYen: Infinity, rate: 0.45, deductionYen: 4796000 },
];

export const incomeTax = (taxableIncomeYen: number): number => {
  const bracket = INCOME_TAX_BRACKETS.find(({ upperBoundYen }) => taxableIncomeYen <= upperBoundYen);
  if (!bracket) {
    return NaN;
  }
  return taxableIncomeYen * bracket.rate - bracket.deductionYen;
};

type SalaryDeductionBracket = { upperBoundYen: number; rate: number; baseYen: number };

const FULL_DEDUCTION_LIMIT_YEN = 650000;
const MAX_SALARY_DEDUCTION_YEN = 2200000;

const SALARY_DEDUCTION_BRACKETS: readonly SalaryDeductionBracket[] = [
  { upperBoundYen: 1800000, rate: 0.4, baseYen: 0 },
  { upperBoundYen: 3600000, rate: 0.3, baseYen: 180000 },
  { upperBoundYen: 6600000, rate: 0.2, baseYen: 540000 },
  { upperBoundYen: 10000000, rate: 0.1, baseYen: 1200000 },
];

export const salaryIncomeDeduction = (incomeYen: number): number => {
  if (incomeYen < FULL_DEDUCTION_LIMIT_YEN) {
    return incomeYen;
  }
  const bracket = SALARY_DEDUCTION_BRACKETS.find(({ upperBoundYen }) => incomeYen < upperBoundYen);
  if (!bracket) {
    return MAX_SALARY_DEDUCTION_YEN;
  }
  return incomeYen * bracket.rate + bracket.baseYen;
};

const DIGITS_PER_JP_UNIT = 4;
const JP_NUMBER_UNITS = [
  "万",
  "億",
  "兆",
  "京",
  "垓",
  "秭",
  "穰",
  "溝",
  "澗",
  "正",
  "載",
  "極",
  "恒河沙",
  "阿僧祇",
  "那由他",
  "不可思議",
  "無量大数",
];

export const toJpNumber = (value: number | string): string => {
  const digits = String(value);
  let unitIndex = Math.floor((digits.length - 1) / DIGITS_PER_JP_UNIT);
  return digits.replace(/(\d)(?=(\d\d\d\d)+(?!\d))/g, (digit) => {
    unitIndex -= 1;
    return `${digit}${JP_NUMBER_UNITS[unitIndex]}`;
  });
};
