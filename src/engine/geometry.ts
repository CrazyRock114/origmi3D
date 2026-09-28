// 折纸引擎的基础几何运算：二维向量、多边形裁剪、线段求交、旋转等。
// 约定：纸张位于世界 XY 平面（z 轴朝上/朝观察者），坐标单位约为“半张纸宽”。

export interface Vec2 {
  x: number;
  y: number;
}

export type Pt3 = [number, number, number];

export const sub2 = (a: Vec2, b: Vec2): Vec2 => ({ x: a.x - b.x, y: a.y - b.y });
export const dot2 = (a: Vec2, b: Vec2): number => a.x * b.x + a.y * b.y;
export const cross2 = (a: Vec2, b: Vec2): number => a.x * b.y - a.y * b.x;
export const len2 = (a: Vec2): number => Math.hypot(a.x, a.y);

export function norm2(a: Vec2): Vec2 {
  const l = len2(a);
  if (l < 1e-12) return { x: 0, y: 0 };
  return { x: a.x / l, y: a.y / l };
}

/** 多边形在 XY 平面上的有向面积（>0 表示逆时针） */
export function signedArea(pts: Pt3[]): number {
  let s = 0;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    const q = pts[(i + 1) % pts.length];
    s += p[0] * q[1] - q[0] * p[1];
  }
  return s / 2;
}

export function ensureCCW(pts: Pt3[]): Pt3[] {
  return signedArea(pts) < 0 ? pts.slice().reverse() : pts.slice();
}

export function centroid2(pts: Pt3[]): Vec2 {
  let x = 0;
  let y = 0;
  for (const p of pts) {
    x += p[0];
    y += p[1];
  }
  return { x: x / pts.length, y: y / pts.length };
}

export function avgZ(pts: Pt3[]): number {
  let z = 0;
  for (const p of pts) z += p[2];
  return z / pts.length;
}

/**
 * Sutherland–Hodgman：把平面多边形按“过 a、法向 n（二维）”的竖直平面裁成两半。
 * 返回法向正侧的部分（保持顶点顺序 / 朝向不变）。
 */
export function clipHalf(poly: Pt3[], a: Vec2, n: Vec2): Pt3[] {
  const out: Pt3[] = [];
  const d = (p: Pt3) => (p[0] - a.x) * n.x + (p[1] - a.y) * n.y;
  for (let i = 0; i < poly.length; i++) {
    const cur = poly[i];
    const nxt = poly[(i + 1) % poly.length];
    const dc = d(cur);
    const dn = d(nxt);
    if (dc >= 0) out.push(cur);
    if ((dc > 0 && dn < 0) || (dc < 0 && dn > 0)) {
      const t = dc / (dc - dn);
      out.push([
        cur[0] + (nxt[0] - cur[0]) * t,
        cur[1] + (nxt[1] - cur[1]) * t,
        cur[2] + (nxt[2] - cur[2]) * t,
      ]);
    }
  }
  if (out.length <= 1) return out;
  const dedup: Pt3[] = [];
  for (let i = 0; i < out.length; i++) {
    const p1 = out[i];
    const p2 = out[(i + 1) % out.length];
    const dist2 = (p1[0] - p2[0]) ** 2 + (p1[1] - p2[1]) ** 2 + (p1[2] - p2[2]) ** 2;
    if (dist2 > 1e-12) dedup.push(p1);
  }
  return dedup;
}

export function pointInPoly(p: Vec2, pts: Pt3[]): boolean {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const xi = pts[i][0];
    const yi = pts[i][1];
    const xj = pts[j][0];
    const yj = pts[j][1];
    const intersect =
      yi > p.y !== yj > p.y && p.x < ((xj - xi) * (p.y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function orient(p: Vec2, q: Vec2, r: Vec2): number {
  return cross2(sub2(q, p), sub2(r, p));
}

function onSeg(p: Vec2, q: Vec2, r: Vec2): boolean {
  return (
    Math.min(p.x, r.x) - 1e-9 <= q.x &&
    q.x <= Math.max(p.x, r.x) + 1e-9 &&
    Math.min(p.y, r.y) - 1e-9 <= q.y &&
    q.y <= Math.max(p.y, r.y) + 1e-9 &&
    Math.abs(orient(p, q, r)) < 1e-9
  );
}

/** 线段 p1p2 与 p3p4 是否相交（含端点接触） */
export function segSegHit(p1: Vec2, p2: Vec2, p3: Vec2, p4: Vec2): boolean {
  const d1 = orient(p3, p4, p1);
  const d2 = orient(p3, p4, p2);
  const d3 = orient(p1, p2, p3);
  const d4 = orient(p1, p2, p4);
  if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0)))
    return true;
  if (Math.abs(d1) < 1e-9 && onSeg(p3, p1, p4)) return true;
  if (Math.abs(d2) < 1e-9 && onSeg(p3, p2, p4)) return true;
  if (Math.abs(d3) < 1e-9 && onSeg(p1, p3, p2)) return true;
  if (Math.abs(d4) < 1e-9 && onSeg(p1, p4, p2)) return true;
  return false;
}

function pointSegDist2(p: Vec2, a: Vec2, b: Vec2): number {
  const ab = sub2(b, a);
  const l2 = dot2(ab, ab);
  let t = l2 > 0 ? dot2(sub2(p, a), ab) / l2 : 0;
  t = Math.max(0, Math.min(1, t));
  const q = { x: a.x + ab.x * t, y: a.y + ab.y * t };
  const d = sub2(p, q);
  return dot2(d, d);
}

/**
 * 折痕“影响域”判定：折痕线段是否与面片多边形相交
 * （穿过内部、端点在面内、或顶点落在线段上）。
 */
export function segTouchesPoly(a: Vec2, b: Vec2, pts: Pt3[]): boolean {
  if (pointInPoly(a, pts) || pointInPoly(b, pts)) return true;
  for (let i = 0; i < pts.length; i++) {
    const p = { x: pts[i][0], y: pts[i][1] };
    const q = { x: pts[(i + 1) % pts.length][0], y: pts[(i + 1) % pts.length][1] };
    if (segSegHit(a, b, p, q)) return true;
    if (pointSegDist2(p, a, b) < 1e-12) return true;
  }
  return false;
}

/**
 * 把线段 ab 裁剪到多边形内部（用于生成面片上的折痕印记）。
 * 假设多边形是凸的；返回裁剪后的线段，或 null（不相交 / 退化）。
 */
export function clipSegToPoly(a: Vec2, b: Vec2, pts: Pt3[]): [Vec2, Vec2] | null {
  const ts: number[] = [];
  const ab = sub2(b, a);
  if (pointInPoly(a, pts)) ts.push(0);
  if (pointInPoly(b, pts)) ts.push(1);
  for (let i = 0; i < pts.length; i++) {
    const p = { x: pts[i][0], y: pts[i][1] };
    const q = { x: pts[(i + 1) % pts.length][0], y: pts[(i + 1) % pts.length][1] };
    const qp = sub2(q, p);
    const denom = cross2(ab, qp);
    if (Math.abs(denom) < 1e-12) continue;
    const t = cross2(sub2(p, a), qp) / denom;
    const u = cross2(sub2(p, a), ab) / denom;
    if (t >= -1e-9 && t <= 1 + 1e-9 && u >= -1e-9 && u <= 1 + 1e-9) ts.push(t);
  }
  if (ts.length === 0) return null;
  ts.sort((x, y) => x - y);
  // 在凸多边形内部是连续区间：找中点在内部的整段
  let lo: number | null = null;
  let hi: number | null = null;
  for (let i = 0; i < ts.length; i++) {
    for (let j = i; j < ts.length; j++) {
      const mid = a.x + ab.x * ((ts[i] + ts[j]) / 2);
      const midY = a.y + ab.y * ((ts[i] + ts[j]) / 2);
      if (pointInPoly({ x: mid, y: midY }, pts)) {
        if (lo === null || ts[i] < lo) lo = ts[i];
        if (hi === null || ts[j] > hi) hi = ts[j];
      }
    }
  }
  if (lo === null || hi === null || hi - lo < 1e-6) return null;
  return [
    { x: a.x + ab.x * lo, y: a.y + ab.y * lo },
    { x: a.x + ab.x * hi, y: a.y + ab.y * hi },
  ];
}

/** Newell 法求多边形法线 */
export function newellNormal(pts: Pt3[]): Pt3 {
  let x = 0;
  let y = 0;
  let z = 0;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    const q = pts[(i + 1) % pts.length];
    x += (p[1] - q[1]) * (p[2] + q[2]);
    y += (p[2] - q[2]) * (p[0] + q[0]);
    z += (p[0] - q[0]) * (p[1] + q[1]);
  }
  const l = Math.hypot(x, y, z) || 1;
  return [x / l, y / l, z / l];
}

/** Rodrigues 旋转：把点绕单位轴 axis（过 origin）旋转 theta 弧度 */
export function rotatePts(pts: Pt3[], axis: Pt3, origin: Pt3, theta: number): Pt3[] {
  const [ux, uy, uz] = axis;
  const c = Math.cos(theta);
  const s = Math.sin(theta);
  return pts.map((p) => {
    const vx = p[0] - origin[0];
    const vy = p[1] - origin[1];
    const vz = p[2] - origin[2];
    const crossX = uy * vz - uz * vy;
    const crossY = uz * vx - ux * vz;
    const crossZ = ux * vy - uy * vx;
    const dot = ux * vx + uy * vy + uz * vz;
    return [
      origin[0] + vx * c + crossX * s + ux * dot * (1 - c),
      origin[1] + vy * c + crossY * s + uy * dot * (1 - c),
      origin[2] + vz * c + crossZ * s + uz * dot * (1 - c),
    ];
  });
}

export function translateZ(pts: Pt3[], dz: number): Pt3[] {
  return pts.map((p) => [p[0], p[1], p[2] + dz] as Pt3);
}
