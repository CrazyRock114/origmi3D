// 折纸内核：把教程步骤编译成纸面几何状态，并生成可播放的折叠动画计划。
//
// 核心思想：纸张 = 一组平面面片（face），每片带正面/背面颜色与“层号”。
// 一次折叠 = 用折痕线段把受影响的面片切开，让移动侧绕折痕轴旋转到目标角度，
// 并按“移动包落在停留层之上/之下”的规则重排层号，最后把层号换成微小 z 偏移，
// 避免共面面片 z-fighting。

import {
  type Pt3,
  type Vec2,
  avgZ,
  centroid2,
  clipHalf,
  clipSegToPoly,
  dot2,
  ensureCCW,
  newellNormal,
  norm2,
  rotatePts,
  segTouchesPoly,
  signedArea,
  sub2,
  translateZ,
} from './geometry';

/** 层与层之间的视觉间隔（纸宽约 2 个单位） */
export const STACK_EPS = 0.014;

export interface Face {
  id: number;
  pts: Pt3[];
  /** 层号：越大越靠近观察者一侧；相对顺序有意义 */
  stack: number;
  /** 面片上的折痕印记（三维线段，随面片一起旋转） */
  creases: [Pt3, Pt3][];
  /** 是否仍处于“压平”状态（经历过非 180° 折叠的面片为 false） */
  flat: boolean;
}

export interface ModelState {
  faces: Face[];
  nextId: number;
}

export interface PaperSpec {
  /** 初始纸形（XY 平面多边形，自动纠正绕向） */
  outline: Vec2[];
  front: string;
  back: string;
}

export type FoldDir = 'valley' | 'mountain';

export interface FoldStep {
  type: 'fold';
  /** 折痕线段（当前俯视坐标系） */
  a: Vec2;
  b: Vec2;
  /** 移动侧内任一点 */
  m: Vec2;
  dir: FoldDir;
  /** 折叠角度，默认 180（对折） */
  angle?: number;
  /** 只折层号 >= layersMin 的纸层（例如“只折最上面一层”） */
  layersMin?: number;
  /** 只折层号 <= layersMax 的纸层（例如“不带上层已折好的部件”） */
  layersMax?: number;
  /** 全幅对折：折痕贯穿整个模型时，移动侧的所有面片（含不接触折痕的）整体移动 */
  wholeSide?: boolean;
  desc: string;
  tip?: string;
}

/** 预折痕：折过去再折回来，留下折痕印记 */
export interface PrefoldStep {
  type: 'prefold';
  a: Vec2;
  b: Vec2;
  m: Vec2;
  dir?: FoldDir;
  angle?: number;
  layersMin?: number;
  layersMax?: number;
  wholeSide?: boolean;
  desc: string;
  tip?: string;
}

/**
 * 内翻折/外翻折：终点几何与把移动侧反方向折 180° 相同，
 * 差别在动画（先把纸张开一段，再整体翻过去合拢）与层的去向
 * （内翻的翻折部分收进层内）。inside → 终态同山折，outside → 终态同谷折。
 */
export interface ReverseStep {
  type: 'reverse';
  a: Vec2;
  b: Vec2;
  m: Vec2;
  dir: 'inside' | 'outside';
  /** sink：沉折动画（先大幅张开翻过再压平）；默认 'reverse' 的两段式 */
  style?: 'reverse' | 'sink';
  angle?: number;
  layersMin?: number;
  layersMax?: number;
  wholeSide?: boolean;
  desc: string;
  tip?: string;
}

/** 翻面：绕面内水平轴（x）或竖直轴（y）整体旋转 180° */
export interface FlipStep {
  type: 'flip';
  axis?: 'x' | 'y';
  desc: string;
  tip?: string;
}

export interface NoteStep {
  type: 'note';
  desc: string;
  tip?: string;
}

/**
 * 立体聚合步骤：风车基础形、水中气泡底、锥形立起等"整体收拢"无法用单次折叠表达，
 * 直接给出目标几何（每个面片的多边形与层号），播放时以"收拢→绽放"的变形动画过渡。
 */
export interface PoseStep {
  type: 'pose';
  faces: { pts: [number, number, number][]; stack?: number }[];
  /** 变形过程中绕 z 轴的旋转弧度（如风车聚合旋转 90°） */
  spin?: number;
  desc: string;
  tip?: string;
}

/**
 * 塌缩步骤：水气球基础形、风车基础形等"整体收拢"。
 * 与 pose 的区别：每个面片给定铰链轴与终止角度，动画为真实刚性旋转
 * （面片从"目标位姿反转回角度"的源位置，绕铰链转到目标位姿），
 * 未给铰链的面片沿用 pose 的形变插值。
 */
export interface CollapseFace {
  pts: [number, number, number][];
  stack?: number;
  /** 源多边形（平纸上的位置）；省略则视为静止 */
  from?: [number, number, number][];
  /** 铰链轴（两点定义）；省略则走形变插值 */
  hinge?: { a: [number, number, number]; b: [number, number, number] };
  /** 终止角度（度，带符号）；源位姿 = 目标位姿绕铰链反转 angle */
  angle?: number;
}

export interface CollapseStep {
  type: 'collapse';
  /** 塌缩折痕指派（动画前在平纸上显出折痕，并参与折痕印记） */
  creases: { a: Vec2; b: Vec2; dir: FoldDir }[];
  faces: CollapseFace[];
  /** 过程中绕 z 轴的整体扭转（弧度） */
  spin?: number;
  desc: string;
  tip?: string;
}

export type Step = FoldStep | PrefoldStep | FlipStep | NoteStep | PoseStep | CollapseStep | ReverseStep;

export interface Tutorial {
  id: string;
  title: string;
  emoji: string;
  category: string;
  difficulty: 1 | 2 | 3;
  minutes: number;
  intro: string;
  paper: PaperSpec;
  steps: Step[];
  source: { label: string; url: string };
}

export function initialState(paper: PaperSpec): ModelState {
  let outline: Pt3[] = paper.outline.map((p) => [p.x, p.y, 0] as Pt3);
  outline = ensureCCW(outline);
  return { faces: [{ id: 0, pts: outline, stack: 0, creases: [], flat: true }], nextId: 1 };
}

// ---------------------------------------------------------------------------
// 折叠计划
// ---------------------------------------------------------------------------

export interface MovingPiece {
  /** 该面片折叠前的几何（随动画旋转） */
  basePts: Pt3[];
  baseCreases: [Pt3, Pt3][];
  /** 旋转到位后的 z 修正量（层距归一化），动画末段渐入 */
  dz: number;
}

export interface FoldPlan {
  kind: 'fold' | 'prefold' | 'flip' | 'pose' | 'collapse';
  /** 内翻/外翻折标记：动画走“先张开再翻合”的两段曲线 */
  reverse?: 'inside' | 'outside';
  /** 沉折样式：动画“大幅张开翻落后压平” */
  sink?: boolean;
  /** 完成后的全部面片（提交态） */
  facesAll: Face[];
  /** 动画开始时应渲染的面片（已切分、未旋转），保证动画网格与 moving 的 id 对齐 */
  animFaces: Face[];
  nextId: number;
  axisA: Pt3;
  axisD: Pt3;
  /** 带符号目标角（弧度） */
  theta: number;
  /** 需要动画的移动面片：faceId -> 几何 */
  moving: Map<number, MovingPiece>;
  /** 折叠前的完整状态（用于幽灵预览 / prefold 还原） */
  preFaces: Face[];
  /** prefold 提交时给原面片补上的折痕印记 */
  creaseAdds: Map<number, [Pt3, Pt3][]>;
  /** collapse 专用：逐面片刚性旋转动画参数 */
  hingeFaces?: { id: number; axisA: Pt3; axisD: Pt3; angle: number; sourcePts: Pt3[] }[];
}

function cloneFace(f: Face): Face {
  return { ...f, pts: f.pts.map((p) => [...p] as Pt3), creases: f.creases.map((c) => [...c] as [Pt3, Pt3]) };
}

function cloneFaces(faces: Face[]): Face[] {
  return faces.map(cloneFace);
}

function pointSegDist(p: Vec2, a: Vec2, b: Vec2): number {
  const abx = b.x - a.x;
  const aby = b.y - a.y;
  const l2 = abx * abx + aby * aby;
  let t = l2 > 0 ? ((p.x - a.x) * abx + (p.y - a.y) * aby) / l2 : 0;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p.x - (a.x + abx * t), p.y - (a.y + aby * t));
}

/** 折痕印记是否整段落在面片边界上（沿边缘的折痕会悬空渲染，应丢弃） */
function segOnBoundary(seg: [Pt3, Pt3], pts: Pt3[]): boolean {
  const onEdge = (x: number, y: number) => {
    let min = Infinity;
    for (let i = 0; i < pts.length; i++) {
      const p = { x: pts[i][0], y: pts[i][1] };
      const q = { x: pts[(i + 1) % pts.length][0], y: pts[(i + 1) % pts.length][1] };
      min = Math.min(min, pointSegDist({ x, y }, p, q));
    }
    return min < 1e-5;
  };
  const mx = (seg[0][0] + seg[1][0]) / 2;
  const my = (seg[0][1] + seg[1][1]) / 2;
  return onEdge(seg[0][0], seg[0][1]) && onEdge(mx, my) && onEdge(seg[1][0], seg[1][1]);
}

function cleanCreases(creases: [Pt3, Pt3][], pts: Pt3[]): [Pt3, Pt3][] {
  return creases.filter((c) => !segOnBoundary(c, pts));
}

interface SplitInput {
  a: Vec2;
  b: Vec2;
  m: Vec2;
  dir: FoldDir;
  angle: number;
  layersMin: number;
  layersMax: number;
  wholeSide: boolean;
}

/**
 * 折叠共同逻辑：切开受影响面片 → 分出移动/停留集合 → 计算层号与落位。
 * 返回移动面片（未旋转）与停留面片，供 fold/prefold 两种计划复用。
 */
function splitForFold(state: ModelState, inp: SplitInput) {
  const d2 = norm2(sub2(inp.b, inp.a));
  const n2 = { x: -d2.y, y: d2.x };
  const sideM = dot2(sub2(inp.m, inp.a), n2) > 0 ? 1 : -1;
  const fullFold = Math.abs(Math.abs(inp.angle) - 180) < 1e-6;
  const inLayerRange = (stack: number) => stack >= inp.layersMin && stack <= inp.layersMax;

  const staying: Face[] = [];
  const movingBase: Face[] = [];
  let nextId = state.nextId;

  const mkCrease = (pts: Pt3[]): [Pt3, Pt3] | null => {
    const seg = clipSegToPoly(inp.a, inp.b, pts);
    if (!seg) return null;
    const crease: [Pt3, Pt3] = [
      [seg[0].x, seg[0].y, avgZ(pts)],
      [seg[1].x, seg[1].y, avgZ(pts)],
    ];
    return segOnBoundary(crease, pts) ? null : crease;
  };

  for (const f of state.faces) {
    // 立体面片（显著倾斜的面片，如翻折起的腿/立翼）不切分：
    // 新折痕会穿过它，但它通过根部附着在一侧的纸面上，
    // 物理上随附着侧整体翻转——切分反而会撕裂模型。
    // 微倾（如刚压平的水气球层，172°）仍按平面处理。
    const zs = f.pts.map((p) => p[2]);
    const xs = f.pts.map((p) => p[0]);
    const ys = f.pts.map((p) => p[1]);
    const zSpan = Math.max(...zs) - Math.min(...zs);
    const extent = Math.max(1e-6, Math.hypot(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)));
    const is3D = zSpan > Math.max(0.05, extent * 0.12);
    if (is3D && inLayerRange(f.stack)) {
      const c = centroid2(f.pts);
      if ((dot2(sub2(c, inp.a), n2) > 0 ? 1 : -1) === sideM) movingBase.push(cloneFace(f));
      else staying.push(cloneFace(f));
      continue;
    }
    const touches = segTouchesPoly(inp.a, inp.b, f.pts);
    if (!touches) {
      // 不接触折痕的面片：默认留在原地；wholeSide（全幅对折）时
      // 只要任一顶点越过折痕就随移动侧走（此前折叠可能已把面片折过中线）
      if (inp.wholeSide && inLayerRange(f.stack)) {
        const c = centroid2(f.pts);
        const centroidSide = dot2(sub2(c, inp.a), n2) > 0 ? 1 : -1;
        const anyBeyond = f.pts.some(
          (p) => dot2({ x: p[0] - inp.a.x, y: p[1] - inp.a.y }, n2) * sideM > 1e-6,
        );
        if (centroidSide === sideM || anyBeyond) {
          movingBase.push(cloneFace(f));
          continue;
        }
      }
      staying.push(cloneFace(f));
      continue;
    }
    const layerOk = inLayerRange(f.stack);
    const ds = f.pts.map((p) => dot2({ x: p[0] - inp.a.x, y: p[1] - inp.a.y }, n2));
    const hasPos = ds.some((x) => x > 1e-9);
    const hasNeg = ds.some((x) => x < -1e-9);
    const crossing = hasPos && hasNeg;
    // 折痕需以正长度穿过面片才切开；仅擦边（如沿中缝对折时面片与折痕共边）不切
    const positive = crossing ? clipSegToPoly(inp.a, inp.b, f.pts) !== null : false;

    if (crossing && positive && layerOk) {
      const pos = clipHalf(f.pts, inp.a, n2);
      const neg = clipHalf(f.pts, inp.a, { x: -n2.x, y: -n2.y });
      for (const [piece, sgn] of [
        [pos, 1],
        [neg, -1],
      ] as const) {
        if (piece.length < 3) continue;
        // 丢弃零面积退化片（折痕恰好穿过顶点时产生的毛刺）
        if (Math.abs(signedArea(piece)) < 1e-8) continue;
        const crease = mkCrease(piece);
        // 继承的折痕印记重新裁剪到新面片范围内（否则全长印记会伸出纸外）
        const z = avgZ(piece);
        const inherited = f.creases.flatMap((c) => {
          const seg = clipSegToPoly({ x: c[0][0], y: c[0][1] }, { x: c[1][0], y: c[1][1] }, piece);
          if (!seg) return [];
          return [[[seg[0].x, seg[0].y, z], [seg[1].x, seg[1].y, z]] as [Pt3, Pt3]];
        });
        const face: Face = {
          id: nextId++,
          pts: piece,
          stack: f.stack,
          creases: cleanCreases([...inherited, ...(crease ? [crease] : [])], piece),
          flat: f.flat,
        };
        if (sgn === sideM) movingBase.push(face);
        else staying.push(face);
      }
    } else {
      const c = centroid2(f.pts);
      const s = dot2(sub2(c, inp.a), n2) > 0 ? 1 : -1;
      const crease = layerOk ? mkCrease(f.pts) : null;
      const face: Face = {
        ...cloneFace(f),
        creases: crease ? cleanCreases([...f.creases, crease], f.pts) : cleanCreases(f.creases, f.pts),
      };
      if (s === sideM && layerOk && !crossing) movingBase.push(face);
      else staying.push(face);
    }
  }

  return { staying, movingBase, nextId, d2, fullFold };
}

/** 生成一次“折叠”的完整计划（fold 与 prefold 共用） */
export function planFold(state: ModelState, step: FoldStep | PrefoldStep, kind: 'fold' | 'prefold'): FoldPlan {
  const inp: SplitInput = {
    a: step.a,
    b: step.b,
    m: step.m,
    dir: step.type === 'fold' ? step.dir : step.dir ?? 'valley',
    angle: step.angle ?? 180,
    layersMin: step.layersMin ?? -Infinity,
    layersMax: step.layersMax ?? Infinity,
    wholeSide: step.wholeSide ?? false,
  };
  const { staying, movingBase, nextId, d2, fullFold } = splitForFold(state, inp);

  // 旋转角符号：valley = 移动侧先朝观察者（+z）抬起
  let cx = 0;
  let cy = 0;
  let cz = 0;
  let n = 0;
  for (const f of movingBase)
    for (const p of f.pts) {
      cx += p[0];
      cy += p[1];
      cz += p[2];
      n++;
    }
  const theta0 = (inp.angle * Math.PI) / 180;
  let theta = theta0;
  if (n > 0) {
    const r: Pt3 = [cx / n - inp.a.x, cy / n - inp.a.y, cz / n];
    const axisD: Pt3 = [d2.x, d2.y, 0];
    const rxu: Pt3 = [
      axisD[1] * r[2] - axisD[2] * r[1],
      axisD[2] * r[0] - axisD[0] * r[2],
      axisD[0] * r[1] - axisD[1] * r[0],
    ];
    if (rxu[2] < 0) theta = -theta;
    if (inp.dir === 'mountain') theta = -theta;
  }

  // 层号重排
  let hi = -Infinity;
  let lo = Infinity;
  for (const f of staying) {
    hi = Math.max(hi, f.stack);
    lo = Math.min(lo, f.stack);
  }
  if (!isFinite(hi)) hi = -1;
  if (!isFinite(lo)) lo = 0;
  const maxMoved = movingBase.reduce((s, f) => Math.max(s, f.stack), 0);

  const axisA: Pt3 = [inp.a.x, inp.a.y, 0];
  const axisD: Pt3 = [d2.x, d2.y, 0];
  const moving = new Map<number, MovingPiece>();
  const movedFaces: Face[] = movingBase.map((base) => {
    const s = base.stack;
    let ns: number;
    if (!fullFold) {
      ns = s;
    } else if (inp.dir === 'valley') {
      ns = hi + 1 + (maxMoved - s);
    } else {
      ns = lo - 1 - (maxMoved - s);
    }
    let pts = rotatePts(base.pts, axisD, axisA, theta);
    // 折痕印记必须与面片一起旋转（否则会留在折叠前的位置）
    let creases = base.creases.map(
      (c) => [rotatePts([c[0]], axisD, axisA, theta)[0], rotatePts([c[1]], axisD, axisA, theta)[0]] as [Pt3, Pt3],
    );
    let dz = 0;
    if (fullFold && base.flat) {
      const zTarget = ns * STACK_EPS;
      dz = zTarget - avgZ(pts);
      pts = translateZ(pts, dz);
    } else if (fullFold) {
      // 已经翘起的面片对折后不再强制压平，但仍按层号微调，避免穿插
      dz = ns * STACK_EPS - avgZ(pts);
      pts = translateZ(pts, dz);
    }
    if (dz !== 0) {
      creases = creases.map((c) => [
        [c[0][0], c[0][1], c[0][2] + dz],
        [c[1][0], c[1][1], c[1][2] + dz],
      ] as [Pt3, Pt3]);
    }
    moving.set(base.id, { basePts: base.pts, baseCreases: base.creases, dz });
    return { id: base.id, pts, stack: ns, creases, flat: fullFold ? base.flat : false };
  });

  return {
    kind,
    facesAll: [...staying, ...movedFaces],
    animFaces: [...staying, ...movingBase],
    nextId,
    axisA,
    axisD,
    theta,
    moving,
    preFaces: cloneFaces(state.faces),
    creaseAdds: new Map(),
  };
}

/** prefold 提交：纸回到折叠前，只在受影响面片上留下折痕印记（见 commitStep） */

/** 编译一步（fold/prefold/flip/pose/note）到提交后的状态 */
export function commitStep(state: ModelState, step: Step, plan: FoldPlan | null): ModelState {
  if (step.type === 'note' || !plan) return { faces: cloneFaces(state.faces), nextId: state.nextId };
  if (step.type === 'pose' || step.type === 'collapse')
    return { faces: plan.facesAll.map(cloneFace), nextId: plan.nextId };
  if (step.type === 'prefold') {
    // 面片回到折叠前；折痕以正长度穿过的面片补上印记
    const faces = cloneFaces(plan.preFaces);
    const a = step.a;
    const b = step.b;
    const layersMin = step.layersMin ?? -Infinity;
    const layersMax = step.layersMax ?? Infinity;
    for (const f of faces) {
      if (f.stack < layersMin || f.stack > layersMax) continue;
      const seg = clipSegToPoly(a, b, f.pts);
      if (!seg) continue;
      const z = avgZ(f.pts);
      const crease: [Pt3, Pt3] = [
        [seg[0].x, seg[0].y, z],
        [seg[1].x, seg[1].y, z],
      ];
      if (!segOnBoundary(crease, f.pts)) f.creases = [...f.creases, crease];
    }
    return { faces, nextId: state.nextId };
  }
  return { faces: plan.facesAll.map(cloneFace), nextId: plan.nextId };
}

export function planFlip(state: ModelState, axis: 'x' | 'y'): FoldPlan {
  const maxS = state.faces.reduce((s, f) => Math.max(s, f.stack), 0);
  const minS = state.faces.reduce((s, f) => Math.min(s, f.stack), 0);
  const lift = (maxS + minS) * STACK_EPS;
  const axisD: Pt3 = axis === 'x' ? [1, 0, 0] : [0, 1, 0];
  const theta = -Math.PI;
  const moving = new Map<number, MovingPiece>();
  const faces = state.faces.map((f) => {
    moving.set(f.id, {
      basePts: f.pts.map((p) => [...p] as Pt3),
      baseCreases: f.creases.map((c) => [...c] as [Pt3, Pt3]),
      dz: lift,
    });
    const pts = translateZ(rotatePts(f.pts, axisD, [0, 0, 0], theta), lift);
    // 折痕印记随面片一起翻转
    const creases = f.creases.map(
      (c) =>
        [
          translateZ(rotatePts([c[0]], axisD, [0, 0, 0], theta), lift)[0],
          translateZ(rotatePts([c[1]], axisD, [0, 0, 0], theta), lift)[0],
        ] as [Pt3, Pt3],
    );
    // 翻面后层序颠倒：底变顶、顶变底
    return { ...cloneFace(f), pts, creases, stack: maxS + minS - f.stack };
  });
  return {
    kind: 'flip',
    facesAll: faces,
    animFaces: cloneFaces(state.faces),
    nextId: state.nextId,
    axisA: [0, 0, 0],
    axisD,
    theta,
    moving,
    preFaces: cloneFaces(state.faces),
    creaseAdds: new Map(),
  };
}

export function makePlan(state: ModelState, step: Step): FoldPlan | null {
  if (step.type === 'fold') return planFold(state, step, 'fold');
  if (step.type === 'prefold') return planFold(state, step, 'prefold');
  if (step.type === 'reverse') {
    // 终点几何 = 把移动侧按相反方向折过去；动画与层的去向由 plan.reverse 标记
    const mapped: FoldStep = {
      ...step,
      type: 'fold',
      dir: step.dir === 'inside' ? 'mountain' : 'valley',
    };
    const plan = planFold(state, mapped, 'fold');
    plan.reverse = step.dir;
    plan.sink = step.style === 'sink';
    return plan;
  }
  if (step.type === 'flip') return planFlip(state, step.axis ?? 'x');
  if (step.type === 'pose') {
    let nextId = state.nextId;
    const faces = step.faces.map((f) => ({
      id: nextId++,
      pts: f.pts.map((p) => [...p] as Pt3),
      stack: f.stack ?? 0,
      creases: [] as [Pt3, Pt3][],
      flat: true,
    }));
    return {
      kind: 'pose',
      facesAll: faces,
      animFaces: cloneFaces(state.faces),
      nextId,
      axisA: [0, 0, 0],
      axisD: [0, 0, 1],
      theta: 0,
      moving: new Map(),
      preFaces: cloneFaces(state.faces),
      creaseAdds: new Map(),
    };
  }
  if (step.type === 'collapse') {
    let nextId = state.nextId;
    // 1) 折痕指派：在当前平纸上留印记（动画开始时可见折痕图案）
    const animFaces = cloneFaces(state.faces);
    for (const c of step.creases) {
      for (const f of animFaces) {
        const seg = clipSegToPoly(c.a, c.b, f.pts);
        if (!seg) continue;
        const z = avgZ(f.pts);
        const crease: [Pt3, Pt3] = [
          [seg[0].x, seg[0].y, z],
          [seg[1].x, seg[1].y, z],
        ];
        if (!segOnBoundary(crease, f.pts)) f.creases = [...f.creases, crease];
      }
    }
    // 2) 目标面片；有铰链的生成"源位姿 = 目标反旋"
    const faces: Face[] = [];
    const hingeFaces: NonNullable<FoldPlan['hingeFaces']> = [];
    for (const f of step.faces) {
      const id = nextId++;
      const pts = f.pts.map((p) => [...p] as Pt3);
      faces.push({ id, pts, stack: f.stack ?? 0, creases: [], flat: true });
      if (f.hinge && f.angle) {
        const axisA: Pt3 = [...f.hinge.a] as Pt3;
        const axisB: Pt3 = [...f.hinge.b] as Pt3;
        const d = norm2({ x: axisB[0] - axisA[0], y: axisB[1] - axisA[1] });
        const axis: Pt3 = [d.x, d.y, 0];
        const angleRad = (f.angle * Math.PI) / 180;
        const sourcePts = rotatePts(pts, axis, axisA, -angleRad);
        hingeFaces.push({ id, axisA, axisD: axis, angle: angleRad, sourcePts });
      }
    }
    return {
      kind: 'collapse',
      facesAll: faces,
      animFaces,
      nextId,
      axisA: [0, 0, 0],
      axisD: [0, 0, 1],
      theta: 0,
      moving: new Map(),
      preFaces: cloneFaces(state.faces),
      creaseAdds: new Map(),
      hingeFaces,
    };
  }
  return null;
}

/** 编译整份教程 → 每步完成后的状态序列（states[0] 为初始状态） */
export function compile(tutorial: Tutorial): { states: ModelState[]; plans: (FoldPlan | null)[] } {
  const states: ModelState[] = [initialState(tutorial.paper)];
  const plans: (FoldPlan | null)[] = [];
  for (const step of tutorial.steps) {
    const plan = makePlan(states[states.length - 1], step);
    plans.push(plan);
    states.push(commitStep(states[states.length - 1], step, plan));
  }
  return { states, plans };
}

/** 面片法线（用于折痕线渲染偏移） */
export function faceNormal(f: Face): Pt3 {
  return newellNormal(f.pts);
}
