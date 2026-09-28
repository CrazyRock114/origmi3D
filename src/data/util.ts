import type { Vec2 } from '../engine/geometry';

export const v = (x: number, y: number): Vec2 => ({ x, y });

/** 正方形（边长 2） */
export const SQUARE = [v(-1, -1), v(1, -1), v(1, 1), v(-1, 1)];

/** 菱形（对角线长 2，即旋转 45° 的正方形） */
export const DIAMOND = [v(0, 1), v(-1, 0), v(0, -1), v(1, 0)];

/** 横向长方形 */
export const RECT_LANDSCAPE = [v(-1.2, -0.75), v(1.2, -0.75), v(1.2, 0.75), v(-1.2, 0.75)];

/** 竖向长方形（接近 A4 比例） */
export const RECT_PORTRAIT = [v(-0.75, -1), v(0.75, -1), v(0.75, 1), v(-0.75, 1)];
