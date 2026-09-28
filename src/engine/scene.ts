// Three.js 渲染层：把面片状态画出来。每个面片两份网格（正面/背面），
// 依赖背面剔除自动呈现“折过来后看到纸的另一面”。

import * as THREE from 'three';
import earcut from 'earcut';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { Face, MovingPiece, PaperSpec } from './fold';
import { newellNormal, rotatePts, type Pt3 } from './geometry';
export { rotatePts };

interface FaceMeshes {
  front: THREE.Mesh;
  back: THREE.Mesh;
  lines: THREE.LineSegments;
  geo: THREE.BufferGeometry;
  lineGeo: THREE.BufferGeometry;
}

const GHOST_COLOR = 0x5b5247;

/** 任意多边形（允许凹多边形）三角剖分：投影到主平面 → earcut → 映射回 3D 顶点 */
function triangulate(pts: Pt3[]): number[] {
  if (pts.length < 3) return [];
  const n = newellNormal(pts);
  const ax =
    Math.abs(n[0]) > Math.abs(n[1])
      ? Math.abs(n[0]) > Math.abs(n[2])
        ? 0
        : 2
      : Math.abs(n[1]) > Math.abs(n[2])
        ? 1
        : 2;
  const flat: number[] = [];
  for (const p of pts) {
    if (ax === 0) flat.push(p[1], p[2]);
    else if (ax === 1) flat.push(p[0], p[2]);
    else flat.push(p[0], p[1]);
  }
  const idx = earcut(flat);
  const tri: number[] = [];
  for (let i = 0; i < idx.length; i++) {
    const p = pts[idx[i]];
    tri.push(p[0], p[1], p[2]);
  }
  return tri;
}

/** 三维质心 */
function centroid3(pts: Pt3[]): Pt3 {
  let x = 0;
  let y = 0;
  let z = 0;
  for (const p of pts) {
    x += p[0];
    y += p[1];
    z += p[2];
  }
  return [x / pts.length, y / pts.length, z / pts.length];
}

/** pose/collapse 形变的配对信息：一对面片的起点/终点几何 */
export interface MorphPair {
  toId: number;
  fromPts: Pt3[];
  toPts: Pt3[];
  /** 有铰链时走刚性旋转（真实折叠），否则顶点插值 */
  hinge?: { axisA: Pt3; axisD: Pt3; angle: number };
}
export interface PoseMorph {
  pairs: MorphPair[];
  looseOld: number[];
  looseNew: number[];
}

export class OrigamiScene {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene: THREE.Scene;
  readonly camera: THREE.PerspectiveCamera;
  readonly controls: OrbitControls;
  private root = new THREE.Group();
  private ghostRoot = new THREE.Group();
  private faceMeshes = new Map<number, FaceMeshes>();
  private basePts = new Map<number, Pt3[]>();
  private matFront!: THREE.MeshLambertMaterial;
  private matBack!: THREE.MeshLambertMaterial;
  private matLine!: THREE.LineBasicMaterial;
  private matGhost!: THREE.MeshBasicMaterial;
  private paper: PaperSpec | null = null;

  constructor(private container: HTMLElement) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x000000, 0);
    container.appendChild(this.renderer.domElement);
    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    this.camera.up.set(0, 0, 1);
    this.camera.position.set(0.9, -2.9, 4.2);
    this.camera.lookAt(0, 0, 0);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.set(0, 0, 0);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.minDistance = 2.2;
    this.controls.maxDistance = 12;

    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x9a8d7a, 1.25));
    const key = new THREE.DirectionalLight(0xfff3e2, 1.7);
    key.position.set(1.6, -2.2, 4);
    this.scene.add(key);
    const fill = new THREE.DirectionalLight(0xdfeaff, 0.55);
    fill.position.set(-2.5, 2, -2.5);
    this.scene.add(fill);

    this.scene.add(this.ghostRoot);
    this.scene.add(this.root);

    this.makeMaterials();
    this.resize();
  }

  private makeMaterials() {
    const front = this.paper?.front ?? '#ff8a4c';
    const back = this.paper?.back ?? '#fffaf0';
    this.matFront?.dispose();
    this.matBack?.dispose();
    this.matLine?.dispose();
    this.matGhost?.dispose();
    this.matFront = new THREE.MeshLambertMaterial({ color: new THREE.Color(front), side: THREE.FrontSide });
    this.matBack = new THREE.MeshLambertMaterial({ color: new THREE.Color(back), side: THREE.BackSide });
    this.matLine = new THREE.LineBasicMaterial({
      color: 0x6b5637,
      transparent: true,
      opacity: 0.28,
      depthWrite: false,
    });
    this.matGhost?.dispose();
    this.matGhost = new THREE.MeshBasicMaterial({
      color: GHOST_COLOR,
      transparent: true,
      opacity: 0.14,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
  }

  setPaper(paper: PaperSpec) {
    this.paper = paper;
    this.makeMaterials();
  }

  resize() {
    const w = this.container.clientWidth || 1;
    const h = this.container.clientHeight || 1;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  private faceGeometry(pts: Pt3[]): THREE.BufferGeometry {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(triangulate(pts), 3));
    geo.computeVertexNormals();
    return geo;
  }

  private lineGeometry(f: Face): THREE.BufferGeometry {
    const n = newellNormal(f.pts);
    const off = 0.009;
    const arr: number[] = [];
    for (const c of f.creases) {
      arr.push(c[0][0] + n[0] * off, c[0][1] + n[1] * off, c[0][2] + n[2] * off);
      arr.push(c[1][0] + n[0] * off, c[1][1] + n[1] * off, c[1][2] + n[2] * off);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(arr, 3));
    return geo;
  }

  private buildFace(f: Face): FaceMeshes {
    const geo = this.faceGeometry(f.pts);
    const front = new THREE.Mesh(geo, this.matFront);
    const back = new THREE.Mesh(geo, this.matBack);
    const lineGeo = this.lineGeometry(f);
    const lines = new THREE.LineSegments(lineGeo, this.matLine);
    lines.renderOrder = 2;
    this.root.add(front, back, lines);
    this.basePts.set(f.id, f.pts.map((p) => [...p] as Pt3));
    return { front, back, lines, geo, lineGeo };
  }

  private disposeFace(m: FaceMeshes) {
    this.root.remove(m.front, m.back, m.lines);
    m.geo.dispose();
    m.lineGeo.dispose();
  }

  /** 重建全部面片网格 */
  setFaces(faces: Face[]) {
    for (const m of this.faceMeshes.values()) this.disposeFace(m);
    this.faceMeshes.clear();
    this.basePts.clear();
    for (const f of faces) this.faceMeshes.set(f.id, this.buildFace(f));
  }

  /** 就地更新某个面片的顶点（pose 形变用） */
  updateFacePositions(id: number, pts: Pt3[]) {
    const m = this.faceMeshes.get(id);
    if (!m) return;
    const pos = m.geo.getAttribute('position') as THREE.BufferAttribute;
    (pos.array as Float32Array).set(triangulate(pts));
    pos.needsUpdate = true;
    m.geo.computeVertexNormals();
  }

  /** 以面片质心为基准整体缩放（pose 中渐隐/渐现用） */
  setFaceScale(id: number, s: number) {
    const base = this.basePts.get(id);
    const m = this.faceMeshes.get(id);
    if (!base || !m) return;
    const c = centroid3(base);
    const pts = base.map((p) => [c[0] + (p[0] - c[0]) * s, c[1] + (p[1] - c[1]) * s, c[2] + (p[2] - c[2]) * s] as Pt3);
    this.updateFacePositions(id, pts);
    m.lines.visible = s > 0.35 && base.length > 0 && m.lineGeo.getAttribute('position').count > 0;
  }

  /** 动画帧：把移动面片替换成旋转中的几何 */
  applyAnimation(moving: Map<number, MovingPiece>, axisA: Pt3, axisD: Pt3, theta: number, liftT: number) {
    for (const [id, piece] of moving) {
      const m = this.faceMeshes.get(id);
      if (!m) continue;
      let pts = rotatePts(piece.basePts, axisD, axisA, theta);
      const lift = piece.dz * liftT;
      if (lift !== 0) pts = pts.map((p) => [p[0], p[1], p[2] + lift] as Pt3);
      const pos = m.geo.getAttribute('position') as THREE.BufferAttribute;
      const tri: number[] = [];
      for (let i = 1; i < pts.length - 1; i++) tri.push(...pts[0], ...pts[i], ...pts[i + 1]);
      (pos.array as Float32Array).set(tri);
      pos.needsUpdate = true;
      m.geo.computeVertexNormals();
      // 折痕线跟随旋转
      const creases = rotatePts(piece.baseCreases.flatMap((c) => [c[0], c[1]]), axisD, axisA, theta);
      const lpos = m.lineGeo.getAttribute('position') as THREE.BufferAttribute;
      const larr: number[] = [];
      for (const p of creases) larr.push(p[0], p[1], p[2]);
      (lpos.array as Float32Array).set(larr);
      lpos.needsUpdate = true;
    }
  }

  /** 幽灵预览：只画移动面片的原位置，沿法线后移少许避免与真实纸面共面冲突 */
  setGhost(faces: Face[]) {
    this.clearGhost();
    for (const f of faces) {
      const n = newellNormal(f.pts);
      const pts = f.pts.map(
        (p) => [p[0] - n[0] * 0.012, p[1] - n[1] * 0.012, p[2] - n[2] * 0.012] as Pt3,
      );
      const g = new THREE.Mesh(this.faceGeometry(pts), this.matGhost);
      this.ghostRoot.add(g);
    }
  }

  clearGhost() {
    for (const c of [...this.ghostRoot.children]) {
      this.ghostRoot.remove(c);
      if (c instanceof THREE.Mesh) c.geometry.dispose();
    }
  }

  /** pose 变形动画用：整体缩放与绕 z 旋转 */
  setTransform(scale: number, rotZ: number) {
    this.root.scale.set(scale, scale, scale);
    this.root.rotation.z = rotZ;
  }

  /**
   * pose/collapse 逐面片动画：有铰链的做刚性旋转（真实折叠），
   * 其余从起点几何插值到终点几何；未配对面片缩放渐隐/渐现。
   */
  applyPoseMorph(morph: PoseMorph, e: number) {
    for (const pr of morph.pairs) {
      let pts: Pt3[];
      if (pr.hinge) {
        pts = rotatePts(pr.fromPts, pr.hinge.axisD, pr.hinge.axisA, pr.hinge.angle * e);
      } else {
        pts = pr.fromPts.map((p, i) => {
          const q = pr.toPts[i];
          return [p[0] + (q[0] - p[0]) * e, p[1] + (q[1] - p[1]) * e, p[2] + (q[2] - p[2]) * e] as Pt3;
        });
      }
      this.updateFacePositions(pr.toId, pts);
    }
    for (const id of morph.looseOld) this.setFaceScale(id, Math.max(0, 1 - e));
    for (const id of morph.looseNew) this.setFaceScale(id, 0.15 + 0.85 * e);
  }

  render() {
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    for (const m of this.faceMeshes.values()) this.disposeFace(m);
    this.faceMeshes.clear();
    this.basePts.clear();
    this.clearGhost();
    this.matFront.dispose();
    this.matBack.dispose();
    this.matLine.dispose();
    this.matGhost.dispose();
    this.controls.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
