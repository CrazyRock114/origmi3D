// 步骤播放器：驱动“上一步 / 下一步 / 自动播放”，并把动画帧写入场景。

import { compile, makePlan, type CollapseStep, type Face, type FoldPlan, type ModelState, type PoseStep, type Step, type Tutorial } from './fold';
import type { Pt3 } from './geometry';
import { OrigamiScene, type MorphPair, type PoseMorph } from './scene';

const easeInOutCubic = (t: number): number =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

/** 按质心就近 + 顶点数相同 + 旋转最优对齐，把新旧面片配对 */
function buildMorph(oldFaces: Face[], newFaces: Face[]): PoseMorph {
  const c2 = (pts: Pt3[]): [number, number] => {
    let x = 0;
    let y = 0;
    for (const p of pts) {
      x += p[0];
      y += p[1];
    }
    return [x / pts.length, y / pts.length];
  };
  const used = new Set<number>();
  const pairs: MorphPair[] = [];
  const looseNew: number[] = [];
  for (const nf of newFaces) {
    const nc = c2(nf.pts);
    let best: Face | null = null;
    let bestD = Infinity;
    for (const of of oldFaces) {
      if (used.has(of.id) || of.pts.length !== nf.pts.length) continue;
      const oc = c2(of.pts);
      const d = (oc[0] - nc[0]) ** 2 + (oc[1] - nc[1]) ** 2;
      if (d < bestD) {
        bestD = d;
        best = of;
      }
    }
    if (best && bestD < 0.9) {
      used.add(best.id);
      const n = nf.pts.length;
      let bestFrom = best.pts;
      let bestCost = Infinity;
      for (let r = 0; r < n; r++) {
        let cost = 0;
        for (let i = 0; i < n; i++) {
          const a = best.pts[(i + r) % n];
          const b = nf.pts[i];
          cost += (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;
        }
        if (cost < bestCost) {
          bestCost = cost;
          bestFrom = best.pts.map((_, i) => best.pts[(i + r) % n]);
        }
      }
      pairs.push({ toId: nf.id, fromPts: bestFrom, toPts: nf.pts });
    } else {
      looseNew.push(nf.id);
    }
  }
  const looseOld = oldFaces.filter((f) => !used.has(f.id)).map((f) => f.id);
  return { pairs, looseOld, looseNew };
}

export interface PlayerStatus {
  idx: number; // 已完成步数（0..steps.length）
  total: number;
  playing: boolean;
  animating: boolean;
  currentStep: Step | null; // 即将执行 / 正在执行的步骤
}

interface Anim {
  plan: FoldPlan;
  stepIdx: number;
  t: number; // 0..1
  dur: number;
  kind: 'fold' | 'prefold' | 'flip' | 'note' | 'pose' | 'collapse';
  /** pose 步骤专用：绕 z 轴的附加旋转与形变配对 */
  spin: number;
  morph: PoseMorph | null;
}

export class Player {
  private states: ModelState[] = [];
  private plans: (FoldPlan | null)[] = [];
  private idx = 0;
  private anim: Anim | null = null;
  private playing = false;
  private speed = 1;
  private sinceCommit = 0;
  private raf = 0;
  private lastT = 0;
  private listeners = new Set<(s: PlayerStatus) => void>();

  constructor(
    private scene: OrigamiScene,
    private tutorial: Tutorial,
  ) {
    const c = compile(tutorial);
    this.states = c.states;
    this.plans = c.plans;
    this.scene.setPaper(tutorial.paper);
    this.scene.setFaces(this.states[0].faces);
    this.loop = this.loop.bind(this);
    this.raf = requestAnimationFrame(this.loop);
  }

  get total(): number {
    return this.tutorial.steps.length;
  }

  subscribe(fn: (s: PlayerStatus) => void): () => void {
    this.listeners.add(fn);
    fn(this.status());
    return () => this.listeners.delete(fn);
  }

  status(): PlayerStatus {
    return {
      idx: this.idx,
      total: this.total,
      playing: this.playing,
      animating: this.anim !== null,
      currentStep: this.idx < this.total ? this.tutorial.steps[this.idx] : null,
    };
  }

  private emit() {
    const s = this.status();
    for (const fn of this.listeners) fn(s);
  }

  /** 跳到第 i 步完成后的状态（无动画） */
  goto(i: number) {
    // 动画进行中点击进度点：取消当前动画，直接跳到目标状态
    this.anim = null;
    const clamped = Math.max(0, Math.min(this.total, i));
    this.idx = clamped;
    this.sinceCommit = 0;
    this.scene.setTransform(1, 0);
    this.scene.clearGhost();
    this.scene.setFaces(this.states[this.idx].faces);
    this.emit();
  }

  next() {
    if (this.anim || this.idx >= this.total) return;
    const step = this.tutorial.steps[this.idx];
    const plan = this.plans[this.idx] ?? makePlan(this.states[this.idx], step);
    this.plans[this.idx] = plan;
    const base = 1 / this.speed;
    if (!plan) {
      this.anim = { plan: null as unknown as FoldPlan, stepIdx: this.idx, t: 0, dur: 0.9 * base, kind: 'note', spin: 0, morph: null };
    } else if (plan.kind === 'pose') {
      const dur = 1.7 * base;
      const morph = buildMorph(plan.preFaces, plan.facesAll);
      this.anim = { plan, stepIdx: this.idx, t: 0, dur, kind: 'pose', spin: (step as PoseStep).spin ?? 0, morph };
      this.scene.setTransform(1, 0);
      // 展示“旧面片（未配对的）+ 新面片（配对的从起点形变到位）”
      const looseOldFaces = plan.preFaces.filter((f) => morph.looseOld.includes(f.id));
      this.scene.setFaces([...plan.facesAll, ...looseOldFaces]);
      this.scene.clearGhost();
      this.scene.applyPoseMorph(morph, 0);
    } else if (plan.kind === 'collapse') {
      const dur = 1.9 * base;
      const stepC = step as CollapseStep;
      const morph: PoseMorph = { pairs: [], looseOld: [], looseNew: [] };
      const hingeById = new Map((plan.hingeFaces ?? []).map((h) => [h.id, h]));
      stepC.faces.forEach((cf, i) => {
        const target = plan.facesAll[i];
        const h = hingeById.get(target.id);
        const fromPts = h
          ? h.sourcePts
          : cf.from
            ? (cf.from.map((p) => [...p] as Pt3))
            : target.pts;
        morph.pairs.push({
          toId: target.id,
          fromPts,
          toPts: target.pts,
          hinge: h ? { axisA: h.axisA, axisD: h.axisD, angle: h.angle } : undefined,
        });
      });
      this.anim = { plan, stepIdx: this.idx, t: 0, dur, kind: 'collapse', spin: stepC.spin ?? 0, morph };
      this.scene.setTransform(1, 0);
      this.scene.setFaces(plan.facesAll);
      this.scene.clearGhost();
      this.scene.applyPoseMorph(morph, 0);
    } else {
      const dur =
        plan.kind === 'prefold' ? 1.7 * base : plan.kind === 'flip' ? 1.05 * base : plan.reverse ? 1.6 * base : 1.2 * base;
      this.anim = { plan, stepIdx: this.idx, t: 0, dur, kind: plan.kind, spin: 0, morph: null };
      // 渲染已切分、未旋转的面片，动画才能驱动这些网格
      this.scene.setFaces(plan.animFaces);
      // 幽灵只画移动面片的原位置（避免整纸半透明覆盖与共面闪烁）
      const ghostFaces: Face[] = [];
      for (const [id, mp] of plan.moving) {
        ghostFaces.push({ id, pts: mp.basePts, stack: 0, creases: mp.baseCreases, flat: true });
      }
      this.scene.setGhost(ghostFaces);
    }
    this.emit();
  }

  prev() {
    if (this.anim) return;
    if (this.idx <= 0) return;
    this.goto(this.idx - 1);
  }

  reset() {
    this.anim = null;
    this.playing = false;
    this.goto(0);
  }

  play() {
    if (this.idx >= this.total && !this.anim) this.goto(0);
    this.playing = true;
    this.emit();
  }

  pause() {
    this.playing = false;
    this.emit();
  }

  setSpeed(s: number) {
    this.speed = s;
  }

  private commit() {
    const anim = this.anim!;
    this.anim = null;
    this.idx = anim.stepIdx + 1;
    this.sinceCommit = 0;
    this.scene.setTransform(1, 0);
    this.scene.clearGhost();
    this.scene.setFaces(this.states[this.idx].faces);
    if (this.idx >= this.total) this.playing = false;
    this.emit();
  }

  private loop(now: number) {
    this.raf = requestAnimationFrame(this.loop);
    const dt = Math.min(0.05, (now - this.lastT) / 1000 || 0);
    this.lastT = now;

    if (this.anim) {
      this.anim.t = Math.min(1, this.anim.t + dt / this.anim.dur);
      this.applyFrame();
      if (this.anim.t >= 1) this.commit();
    } else if (this.playing && this.idx < this.total) {
      this.sinceCommit += dt;
      if (this.sinceCommit > 0.85 / this.speed) this.next();
    }

    this.scene.render();
  }

  private applyFrame() {
    const anim = this.anim!;
    if (anim.kind === 'note') return;
    const plan = anim.plan;
    const t = anim.t;
    const e = easeInOutCubic(t);

    if (anim.kind === 'pose' || anim.kind === 'collapse') {
      // 逐面片动画：铰链面片刚性旋转（真实折叠），其余形变插值（配合扭转）
      const twist = anim.spin * Math.sin(Math.PI * t);
      this.scene.setTransform(1, twist);
      this.scene.applyPoseMorph(anim.morph!, e);
      return;
    }

    if (anim.kind === 'prefold') {
      // 折过去（0~0.42）→ 停顿（0.42~0.55）→ 折回来（0.55~1）
      let p: number;
      if (t < 0.42) p = easeInOutCubic(t / 0.42);
      else if (t < 0.55) p = 1;
      else p = 1 - easeInOutCubic((t - 0.55) / 0.45);
      const liftT = 0;
      this.scene.applyAnimation(plan.moving, plan.axisA, plan.axisD, plan.theta * p, liftT);
      return;
    }

    if (plan.reverse) {
      if (plan.sink) {
        // 沉折：朝终角大幅张开翻过（正弦过冲约 45°），随后压平到位
        const theta = plan.theta * (e + 0.28 * Math.sin(Math.PI * t));
        const liftT = Math.max(0, Math.min(1, (t - 0.9) / 0.1));
        this.scene.applyAnimation(plan.moving, plan.axisA, plan.axisD, theta, liftT);
        return;
      }
      // 内翻/外翻折：先朝反方向张开（0~0.36），再整体翻过去合拢（0.36~1）
      const open = -plan.theta * 0.32;
      const theta =
        t < 0.36 ? open * easeInOutCubic(t / 0.36) : open + (plan.theta - open) * easeInOutCubic((t - 0.36) / 0.64);
      const liftT = Math.max(0, Math.min(1, (t - 0.9) / 0.1));
      this.scene.applyAnimation(plan.moving, plan.axisA, plan.axisD, theta, liftT);
      return;
    }

    const liftT = Math.max(0, Math.min(1, (t - 0.88) / 0.12));
    this.scene.applyAnimation(plan.moving, plan.axisA, plan.axisD, plan.theta * e, liftT);
  }

  dispose() {
    cancelAnimationFrame(this.raf);
    this.listeners.clear();
    this.scene.dispose();
  }
}
