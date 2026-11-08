// Based on https://css-tricks.com/building-a-donut-chart-with-vue-and-svg/

export const DONUT_GEOMETRY = {
  cx: 80,
  cy: 80,
  radius: 60,
  strokeWidth: 30,
} as const;

export const DONUT_COLORS = [
  "#6495ED",
  "goldenrod",
  "#cd5c5c",
  "thistle",
  "lightgray",
  "#aaDDaa",
  "#FF8C00",
  "#444444",
];

// Starting at -90deg puts the first segment's edge at 12 o'clock.
const START_ANGLE_DEG = -90;
const FULL_CIRCLE_DEG = 360;
const PERCENT = 100;
const MIN_LABELED_PERCENT = 5;
// Shortening the dash leaves a small white gap between segments.
const SEGMENT_GAP = 2;

export type DonutSegment = {
  color: string | undefined;
  strokeDashOffset: number;
  rotateDeg: number;
  textX: number;
  textY: number;
  label: string;
  showLabel: boolean;
};

export const circumference = (): number => 2 * Math.PI * DONUT_GEOMETRY.radius;

export const adjustedCircumference = (): number => circumference() - SEGMENT_GAP;

const degreesToRadians = (angleDeg: number): number => angleDeg * (Math.PI / 180);

const textCoords = (fraction: number, startDeg: number): { x: number; y: number } => {
  const radians = degreesToRadians((fraction * FULL_CIRCLE_DEG) / 2 + startDeg);
  return {
    x: DONUT_GEOMETRY.radius * Math.cos(radians) + DONUT_GEOMETRY.cx,
    y: DONUT_GEOMETRY.radius * Math.sin(radians) + DONUT_GEOMETRY.cy,
  };
};

const segment = (value: number, index: number, total: number, startDeg: number): DonutSegment => {
  const fraction = value / total;
  const percent = Math.round(fraction * PERCENT);
  const { x, y } = textCoords(fraction, startDeg);
  return {
    color: DONUT_COLORS[index],
    strokeDashOffset: circumference() - fraction * circumference(),
    rotateDeg: startDeg,
    textX: x,
    textY: y,
    label: `(${index + 1}) ${percent}%`,
    showLabel: percent > MIN_LABELED_PERCENT,
  };
};

export const donutSegments = (values: readonly number[]): DonutSegment[] => {
  const total = values.reduce((acc, value) => acc + value, 0);
  const startAngles = values.reduce<number[]>(
    (angles, value) => [...angles, (value / total) * FULL_CIRCLE_DEG + angles[angles.length - 1]],
    [START_ANGLE_DEG],
  );
  return values.map((value, index) => segment(value, index, total, startAngles[index]));
};
