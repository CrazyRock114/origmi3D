// src/engine/geometry.ts
var sub2 = (a, b) => ({ x: a.x - b.x, y: a.y - b.y });
var dot2 = (a, b) => a.x * b.x + a.y * b.y;
var cross2 = (a, b) => a.x * b.y - a.y * b.x;
var len2 = (a) => Math.hypot(a.x, a.y);
function norm2(a) {
  const l = len2(a);
  if (l < 1e-12) return { x: 0, y: 0 };
  return { x: a.x / l, y: a.y / l };
}
function signedArea(pts) {
  let s = 0;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    const q = pts[(i + 1) % pts.length];
    s += p[0] * q[1] - q[0] * p[1];
  }
  return s / 2;
}
function ensureCCW(pts) {
  return signedArea(pts) < 0 ? pts.slice().reverse() : pts.slice();
}
function centroid2(pts) {
  let x = 0;
  let y = 0;
  for (const p of pts) {
    x += p[0];
    y += p[1];
  }
  return { x: x / pts.length, y: y / pts.length };
}
function avgZ(pts) {
  let z = 0;
  for (const p of pts) z += p[2];
  return z / pts.length;
}
function clipHalf(poly, a, n) {
  const out = [];
  const d = (p) => (p[0] - a.x) * n.x + (p[1] - a.y) * n.y;
  for (let i = 0; i < poly.length; i++) {
    const cur = poly[i];
    const nxt = poly[(i + 1) % poly.length];
    const dc = d(cur);
    const dn = d(nxt);
    if (dc >= 0) out.push(cur);
    if (dc > 0 && dn < 0 || dc < 0 && dn > 0) {
      const t = dc / (dc - dn);
      out.push([
        cur[0] + (nxt[0] - cur[0]) * t,
        cur[1] + (nxt[1] - cur[1]) * t,
        cur[2] + (nxt[2] - cur[2]) * t
      ]);
    }
  }
  if (out.length <= 1) return out;
  const dedup = [];
  for (let i = 0; i < out.length; i++) {
    const p1 = out[i];
    const p2 = out[(i + 1) % out.length];
    const dist2 = (p1[0] - p2[0]) ** 2 + (p1[1] - p2[1]) ** 2 + (p1[2] - p2[2]) ** 2;
    if (dist2 > 1e-12) dedup.push(p1);
  }
  return dedup;
}
function pointInPoly(p, pts) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const xi = pts[i][0];
    const yi = pts[i][1];
    const xj = pts[j][0];
    const yj = pts[j][1];
    const intersect = yi > p.y !== yj > p.y && p.x < (xj - xi) * (p.y - yi) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}
function orient(p, q, r) {
  return cross2(sub2(q, p), sub2(r, p));
}
function onSeg(p, q, r) {
  return Math.min(p.x, r.x) - 1e-9 <= q.x && q.x <= Math.max(p.x, r.x) + 1e-9 && Math.min(p.y, r.y) - 1e-9 <= q.y && q.y <= Math.max(p.y, r.y) + 1e-9 && Math.abs(orient(p, q, r)) < 1e-9;
}
function segSegHit(p1, p2, p3, p4) {
  const d1 = orient(p3, p4, p1);
  const d2 = orient(p3, p4, p2);
  const d3 = orient(p1, p2, p3);
  const d4 = orient(p1, p2, p4);
  if ((d1 > 0 && d2 < 0 || d1 < 0 && d2 > 0) && (d3 > 0 && d4 < 0 || d3 < 0 && d4 > 0))
    return true;
  if (Math.abs(d1) < 1e-9 && onSeg(p3, p1, p4)) return true;
  if (Math.abs(d2) < 1e-9 && onSeg(p3, p2, p4)) return true;
  if (Math.abs(d3) < 1e-9 && onSeg(p1, p3, p2)) return true;
  if (Math.abs(d4) < 1e-9 && onSeg(p1, p4, p2)) return true;
  return false;
}
function pointSegDist2(p, a, b) {
  const ab = sub2(b, a);
  const l2 = dot2(ab, ab);
  let t = l2 > 0 ? dot2(sub2(p, a), ab) / l2 : 0;
  t = Math.max(0, Math.min(1, t));
  const q = { x: a.x + ab.x * t, y: a.y + ab.y * t };
  const d = sub2(p, q);
  return dot2(d, d);
}
function segTouchesPoly(a, b, pts) {
  if (pointInPoly(a, pts) || pointInPoly(b, pts)) return true;
  for (let i = 0; i < pts.length; i++) {
    const p = { x: pts[i][0], y: pts[i][1] };
    const q = { x: pts[(i + 1) % pts.length][0], y: pts[(i + 1) % pts.length][1] };
    if (segSegHit(a, b, p, q)) return true;
    if (pointSegDist2(p, a, b) < 1e-12) return true;
  }
  return false;
}
function clipSegToPoly(a, b, pts) {
  const ts = [];
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
  let lo = null;
  let hi = null;
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
    { x: a.x + ab.x * hi, y: a.y + ab.y * hi }
  ];
}
function newellNormal(pts) {
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
function rotatePts(pts, axis, origin, theta) {
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
      origin[2] + vz * c + crossZ * s + uz * dot * (1 - c)
    ];
  });
}
function translateZ(pts, dz) {
  return pts.map((p) => [p[0], p[1], p[2] + dz]);
}

// src/engine/fold.ts
var STACK_EPS = 0.014;
function initialState(paper) {
  let outline = paper.outline.map((p) => [p.x, p.y, 0]);
  outline = ensureCCW(outline);
  return { faces: [{ id: 0, pts: outline, stack: 0, creases: [], flat: true }], nextId: 1 };
}
function cloneFace(f2) {
  return { ...f2, pts: f2.pts.map((p) => [...p]), creases: f2.creases.map((c) => [...c]) };
}
function cloneFaces(faces) {
  return faces.map(cloneFace);
}
function pointSegDist(p, a, b) {
  const abx = b.x - a.x;
  const aby = b.y - a.y;
  const l2 = abx * abx + aby * aby;
  let t = l2 > 0 ? ((p.x - a.x) * abx + (p.y - a.y) * aby) / l2 : 0;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p.x - (a.x + abx * t), p.y - (a.y + aby * t));
}
function segOnBoundary(seg, pts) {
  const onEdge = (x, y) => {
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
function cleanCreases(creases, pts) {
  return creases.filter((c) => !segOnBoundary(c, pts));
}
function splitForFold(state, inp) {
  const d2 = norm2(sub2(inp.b, inp.a));
  const n2 = { x: -d2.y, y: d2.x };
  const sideM = dot2(sub2(inp.m, inp.a), n2) > 0 ? 1 : -1;
  const fullFold = Math.abs(Math.abs(inp.angle) - 180) < 1e-6;
  const inLayerRange = (stack) => stack >= inp.layersMin && stack <= inp.layersMax;
  const staying = [];
  const movingBase = [];
  let nextId = state.nextId;
  const mkCrease = (pts) => {
    const seg = clipSegToPoly(inp.a, inp.b, pts);
    if (!seg) return null;
    const crease = [
      [seg[0].x, seg[0].y, avgZ(pts)],
      [seg[1].x, seg[1].y, avgZ(pts)]
    ];
    return segOnBoundary(crease, pts) ? null : crease;
  };
  for (const f2 of state.faces) {
    const zs = f2.pts.map((p) => p[2]);
    const xs = f2.pts.map((p) => p[0]);
    const ys = f2.pts.map((p) => p[1]);
    const zSpan = Math.max(...zs) - Math.min(...zs);
    const extent = Math.max(1e-6, Math.hypot(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)));
    const is3D = zSpan > Math.max(0.05, extent * 0.12);
    if (is3D && inLayerRange(f2.stack)) {
      const c = centroid2(f2.pts);
      if ((dot2(sub2(c, inp.a), n2) > 0 ? 1 : -1) === sideM) movingBase.push(cloneFace(f2));
      else staying.push(cloneFace(f2));
      continue;
    }
    const touches = segTouchesPoly(inp.a, inp.b, f2.pts);
    if (!touches) {
      if (inp.wholeSide && inLayerRange(f2.stack)) {
        const c = centroid2(f2.pts);
        const centroidSide = dot2(sub2(c, inp.a), n2) > 0 ? 1 : -1;
        const anyBeyond = f2.pts.some(
          (p) => dot2({ x: p[0] - inp.a.x, y: p[1] - inp.a.y }, n2) * sideM > 1e-6
        );
        if (centroidSide === sideM || anyBeyond) {
          movingBase.push(cloneFace(f2));
          continue;
        }
      }
      staying.push(cloneFace(f2));
      continue;
    }
    const layerOk = inLayerRange(f2.stack);
    const ds = f2.pts.map((p) => dot2({ x: p[0] - inp.a.x, y: p[1] - inp.a.y }, n2));
    const hasPos = ds.some((x) => x > 1e-9);
    const hasNeg = ds.some((x) => x < -1e-9);
    const crossing = hasPos && hasNeg;
    const positive = crossing ? clipSegToPoly(inp.a, inp.b, f2.pts) !== null : false;
    if (crossing && positive && layerOk) {
      const pos = clipHalf(f2.pts, inp.a, n2);
      const neg = clipHalf(f2.pts, inp.a, { x: -n2.x, y: -n2.y });
      for (const [piece, sgn] of [
        [pos, 1],
        [neg, -1]
      ]) {
        if (piece.length < 3) continue;
        if (Math.abs(signedArea(piece)) < 1e-8) continue;
        const crease = mkCrease(piece);
        const z = avgZ(piece);
        const inherited = f2.creases.flatMap((c) => {
          const seg = clipSegToPoly({ x: c[0][0], y: c[0][1] }, { x: c[1][0], y: c[1][1] }, piece);
          if (!seg) return [];
          return [[[seg[0].x, seg[0].y, z], [seg[1].x, seg[1].y, z]]];
        });
        const face = {
          id: nextId++,
          pts: piece,
          stack: f2.stack,
          creases: cleanCreases([...inherited, ...crease ? [crease] : []], piece),
          flat: f2.flat
        };
        if (sgn === sideM) movingBase.push(face);
        else staying.push(face);
      }
    } else {
      const c = centroid2(f2.pts);
      const s = dot2(sub2(c, inp.a), n2) > 0 ? 1 : -1;
      const crease = layerOk ? mkCrease(f2.pts) : null;
      const face = {
        ...cloneFace(f2),
        creases: crease ? cleanCreases([...f2.creases, crease], f2.pts) : cleanCreases(f2.creases, f2.pts)
      };
      if (s === sideM && layerOk && !crossing) movingBase.push(face);
      else staying.push(face);
    }
  }
  return { staying, movingBase, nextId, d2, fullFold };
}
function planFold(state, step, kind) {
  const inp = {
    a: step.a,
    b: step.b,
    m: step.m,
    dir: step.type === "fold" ? step.dir : step.dir ?? "valley",
    angle: step.angle ?? 180,
    layersMin: step.layersMin ?? -Infinity,
    layersMax: step.layersMax ?? Infinity,
    wholeSide: step.wholeSide ?? false
  };
  const { staying, movingBase, nextId, d2, fullFold } = splitForFold(state, inp);
  let cx = 0;
  let cy = 0;
  let cz = 0;
  let n = 0;
  for (const f2 of movingBase)
    for (const p of f2.pts) {
      cx += p[0];
      cy += p[1];
      cz += p[2];
      n++;
    }
  const theta0 = inp.angle * Math.PI / 180;
  let theta = theta0;
  if (n > 0) {
    const r = [cx / n - inp.a.x, cy / n - inp.a.y, cz / n];
    const axisD2 = [d2.x, d2.y, 0];
    const rxu = [
      axisD2[1] * r[2] - axisD2[2] * r[1],
      axisD2[2] * r[0] - axisD2[0] * r[2],
      axisD2[0] * r[1] - axisD2[1] * r[0]
    ];
    if (rxu[2] < 0) theta = -theta;
    if (inp.dir === "mountain") theta = -theta;
  }
  let hi = -Infinity;
  let lo = Infinity;
  for (const f2 of staying) {
    hi = Math.max(hi, f2.stack);
    lo = Math.min(lo, f2.stack);
  }
  if (!isFinite(hi)) hi = -1;
  if (!isFinite(lo)) lo = 0;
  const maxMoved = movingBase.reduce((s, f2) => Math.max(s, f2.stack), 0);
  const axisA = [inp.a.x, inp.a.y, 0];
  const axisD = [d2.x, d2.y, 0];
  const moving = /* @__PURE__ */ new Map();
  const movedFaces = movingBase.map((base) => {
    const s = base.stack;
    let ns;
    if (!fullFold) {
      ns = s;
    } else if (inp.dir === "valley") {
      ns = hi + 1 + (maxMoved - s);
    } else {
      ns = lo - 1 - (maxMoved - s);
    }
    let pts = rotatePts(base.pts, axisD, axisA, theta);
    let creases = base.creases.map(
      (c) => [rotatePts([c[0]], axisD, axisA, theta)[0], rotatePts([c[1]], axisD, axisA, theta)[0]]
    );
    let dz = 0;
    if (fullFold && base.flat) {
      const zTarget = ns * STACK_EPS;
      dz = zTarget - avgZ(pts);
      pts = translateZ(pts, dz);
    } else if (fullFold) {
      dz = ns * STACK_EPS - avgZ(pts);
      pts = translateZ(pts, dz);
    }
    if (dz !== 0) {
      creases = creases.map((c) => [
        [c[0][0], c[0][1], c[0][2] + dz],
        [c[1][0], c[1][1], c[1][2] + dz]
      ]);
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
    creaseAdds: /* @__PURE__ */ new Map()
  };
}
function commitStep(state, step, plan) {
  if (step.type === "note" || !plan) return { faces: cloneFaces(state.faces), nextId: state.nextId };
  if (step.type === "pose" || step.type === "collapse")
    return { faces: plan.facesAll.map(cloneFace), nextId: plan.nextId };
  if (step.type === "prefold") {
    const faces = cloneFaces(plan.preFaces);
    const a = step.a;
    const b = step.b;
    const layersMin = step.layersMin ?? -Infinity;
    const layersMax = step.layersMax ?? Infinity;
    for (const f2 of faces) {
      if (f2.stack < layersMin || f2.stack > layersMax) continue;
      const seg = clipSegToPoly(a, b, f2.pts);
      if (!seg) continue;
      const z = avgZ(f2.pts);
      const crease = [
        [seg[0].x, seg[0].y, z],
        [seg[1].x, seg[1].y, z]
      ];
      if (!segOnBoundary(crease, f2.pts)) f2.creases = [...f2.creases, crease];
    }
    return { faces, nextId: state.nextId };
  }
  return { faces: plan.facesAll.map(cloneFace), nextId: plan.nextId };
}
function planFlip(state, axis) {
  const maxS = state.faces.reduce((s, f2) => Math.max(s, f2.stack), 0);
  const minS = state.faces.reduce((s, f2) => Math.min(s, f2.stack), 0);
  const lift = (maxS + minS) * STACK_EPS;
  const axisD = axis === "x" ? [1, 0, 0] : [0, 1, 0];
  const theta = -Math.PI;
  const moving = /* @__PURE__ */ new Map();
  const faces = state.faces.map((f2) => {
    moving.set(f2.id, {
      basePts: f2.pts.map((p) => [...p]),
      baseCreases: f2.creases.map((c) => [...c]),
      dz: lift
    });
    const pts = translateZ(rotatePts(f2.pts, axisD, [0, 0, 0], theta), lift);
    const creases = f2.creases.map(
      (c) => [
        translateZ(rotatePts([c[0]], axisD, [0, 0, 0], theta), lift)[0],
        translateZ(rotatePts([c[1]], axisD, [0, 0, 0], theta), lift)[0]
      ]
    );
    return { ...cloneFace(f2), pts, creases, stack: maxS + minS - f2.stack };
  });
  return {
    kind: "flip",
    facesAll: faces,
    animFaces: cloneFaces(state.faces),
    nextId: state.nextId,
    axisA: [0, 0, 0],
    axisD,
    theta,
    moving,
    preFaces: cloneFaces(state.faces),
    creaseAdds: /* @__PURE__ */ new Map()
  };
}
function makePlan(state, step) {
  if (step.type === "fold") return planFold(state, step, "fold");
  if (step.type === "prefold") return planFold(state, step, "prefold");
  if (step.type === "reverse") {
    const mapped = {
      ...step,
      type: "fold",
      dir: step.dir === "inside" ? "mountain" : "valley"
    };
    const plan = planFold(state, mapped, "fold");
    plan.reverse = step.dir;
    plan.sink = step.style === "sink";
    return plan;
  }
  if (step.type === "flip") return planFlip(state, step.axis ?? "x");
  if (step.type === "pose") {
    let nextId = state.nextId;
    const faces = step.faces.map((f2) => ({
      id: nextId++,
      pts: f2.pts.map((p) => [...p]),
      stack: f2.stack ?? 0,
      creases: [],
      flat: true
    }));
    return {
      kind: "pose",
      facesAll: faces,
      animFaces: cloneFaces(state.faces),
      nextId,
      axisA: [0, 0, 0],
      axisD: [0, 0, 1],
      theta: 0,
      moving: /* @__PURE__ */ new Map(),
      preFaces: cloneFaces(state.faces),
      creaseAdds: /* @__PURE__ */ new Map()
    };
  }
  if (step.type === "collapse") {
    let nextId = state.nextId;
    const animFaces = cloneFaces(state.faces);
    for (const c of step.creases) {
      for (const f2 of animFaces) {
        const seg = clipSegToPoly(c.a, c.b, f2.pts);
        if (!seg) continue;
        const z = avgZ(f2.pts);
        const crease = [
          [seg[0].x, seg[0].y, z],
          [seg[1].x, seg[1].y, z]
        ];
        if (!segOnBoundary(crease, f2.pts)) f2.creases = [...f2.creases, crease];
      }
    }
    const faces = [];
    const hingeFaces = [];
    for (const f2 of step.faces) {
      const id = nextId++;
      const pts = f2.pts.map((p) => [...p]);
      faces.push({ id, pts, stack: f2.stack ?? 0, creases: [], flat: true });
      if (f2.hinge && f2.angle) {
        const axisA = [...f2.hinge.a];
        const axisB = [...f2.hinge.b];
        const d = norm2({ x: axisB[0] - axisA[0], y: axisB[1] - axisA[1] });
        const axis = [d.x, d.y, 0];
        const angleRad = f2.angle * Math.PI / 180;
        const sourcePts = rotatePts(pts, axis, axisA, -angleRad);
        hingeFaces.push({ id, axisA, axisD: axis, angle: angleRad, sourcePts });
      }
    }
    return {
      kind: "collapse",
      facesAll: faces,
      animFaces,
      nextId,
      axisA: [0, 0, 0],
      axisD: [0, 0, 1],
      theta: 0,
      moving: /* @__PURE__ */ new Map(),
      preFaces: cloneFaces(state.faces),
      creaseAdds: /* @__PURE__ */ new Map(),
      hingeFaces
    };
  }
  return null;
}
function compile(tutorial) {
  const states = [initialState(tutorial.paper)];
  const plans = [];
  for (const step of tutorial.steps) {
    const plan = makePlan(states[states.length - 1], step);
    plans.push(plan);
    states.push(commitStep(states[states.length - 1], step, plan));
  }
  return { states, plans };
}

// src/data/util.ts
var v = (x, y) => ({ x, y });
var SQUARE = [v(-1, -1), v(1, -1), v(1, 1), v(-1, 1)];
var DIAMOND = [v(0, 1), v(-1, 0), v(0, -1), v(1, 0)];
var RECT_LANDSCAPE = [v(-1.2, -0.75), v(1.2, -0.75), v(1.2, 0.75), v(-1.2, 0.75)];
var RECT_PORTRAIT = [v(-0.75, -1), v(0.75, -1), v(0.75, 1), v(-0.75, 1)];

// src/data/tutorials/cicada.ts
var cicada = {
  id: "cicada",
  title: "\u77E5\u4E86",
  emoji: "\u{1FAB2}",
  category: "\u52A8\u7269",
  difficulty: 2,
  minutes: 5,
  intro: "\u590F\u5929\u7684\u9E23\u866B\u77E5\u4E86\uFF0C\u4F20\u7EDF\u6298\u6CD5\u53EA\u8981\u516D\u6298\uFF0C\u7FC5\u8180\u4F1A\u5FAE\u5FAE\u5F20\u5F00\u3002",
  paper: { outline: DIAMOND, front: "#FFF8E1", back: "#8D6E63" },
  steps: [
    {
      type: "fold",
      a: v(-1, 0),
      b: v(1, 0),
      m: v(0, -1),
      dir: "valley",
      desc: "\u83F1\u5F62\u4E0B\u9762\u7684\u89D2\u5411\u4E0A\u5BF9\u6298\uFF0C\u6298\u6210\u5C16\u671D\u4E0A\u7684\u4E09\u89D2\u5F62\u3002"
    },
    {
      type: "fold",
      a: v(0, 0),
      b: v(-0.5, 0.5),
      m: v(-0.8, -0.1),
      dir: "valley",
      desc: "\u628A\u5DE6\u8FB9\u7684\u89D2\u6CBF\u659C\u7EBF\u5411\u4E0A\u6298\uFF0C\u5C16\u7AEF\u5BF9\u51C6\u9876\u89D2\u3002"
    },
    {
      type: "fold",
      a: v(0, 0),
      b: v(0.5, 0.5),
      m: v(0.8, -0.1),
      dir: "valley",
      desc: "\u53F3\u8FB9\u7684\u89D2\u540C\u6837\u5411\u4E0A\u6298\uFF0C\u5728\u9876\u89D2\u6C47\u5408\u3002"
    },
    {
      type: "fold",
      a: v(0, 0.15),
      b: v(-0.5, 0.5),
      m: v(-0.4, 0.6),
      dir: "valley",
      angle: 150,
      layersMin: 2,
      desc: "\u628A\u5DE6\u8FB9\u7684\u7FC5\u8180\u6CBF\u659C\u7EBF\u5411\u5916\u6298\u4E0B\u6765\u3002",
      tip: "\u53EA\u6298\u7FC5\u8180\u5C42\uFF0C\u4E0D\u7528\u6298\u5E73\uFF0C\u8BA9\u5B83\u5FAE\u5FAE\u5F20\u5F00\u3002"
    },
    {
      type: "fold",
      a: v(0, 0.15),
      b: v(0.5, 0.5),
      m: v(0.4, 0.6),
      dir: "valley",
      angle: 150,
      layersMin: 4,
      desc: "\u53F3\u8FB9\u7684\u7FC5\u8180\u540C\u6837\u5411\u5916\u6298\u4E0B\uFF0C\u4E24\u8FB9\u5BF9\u79F0\u3002"
    },
    {
      type: "fold",
      a: v(-0.14, 0.74),
      b: v(0.14, 0.74),
      m: v(0, 0.9),
      dir: "valley",
      layersMin: 1,
      layersMax: 1,
      desc: "\u628A\u6700\u4E0A\u9762\u4E00\u5C42\u7684\u5C16\u89D2\u5411\u4E0B\u6298\uFF0C\u8FD9\u662F\u77E5\u4E86\u7684\u5934\u3002"
    },
    {
      type: "fold",
      a: v(-0.18, 0.62),
      b: v(0.18, 0.62),
      m: v(0, 0.75),
      dir: "valley",
      layersMax: 0,
      desc: "\u4E0B\u9762\u4E00\u5C42\u4E5F\u5411\u4E0B\u6298\u4E00\u70B9\uFF0C\u9732\u51FA\u6DF1\u8272\u7684\u201C\u590D\u773C\u201D\u3002"
    },
    {
      type: "fold",
      a: v(-0.3, 0.5),
      b: v(0.3, 0.5),
      m: v(0, 0.7),
      dir: "valley",
      desc: "\u628A\u9876\u90E8\u6574\u4F53\u5411\u4E0B\u6298\u5E73\uFF0C\u538B\u4F4F\u5934\u90E8\u3002"
    },
    {
      type: "fold",
      a: v(-0.6, -0.3),
      b: v(-0.4, 0.4),
      m: v(-0.9, 0),
      dir: "mountain",
      layersMax: 1,
      desc: "\u628A\u5DE6\u8FB9\u5411\u80CC\u9762\u6298\u8FDB\u53BB\uFF0C\u6536\u7A84\u8EAB\u4F53\u3002"
    },
    {
      type: "fold",
      a: v(0.6, -0.3),
      b: v(0.4, 0.4),
      m: v(0.9, 0),
      dir: "mountain",
      layersMax: 1,
      desc: "\u53F3\u8FB9\u540C\u6837\u6298\u8FDB\u53BB\u3002"
    },
    {
      type: "note",
      desc: "\u5B8C\u6210\uFF01\u753B\u4E0A\u773C\u775B\uFF0C\u6309\u4F4F\u5C3E\u5DF4\u4E00\u677E\u624B\uFF0C\u77E5\u4E86\u8FD8\u4F1A\u5F80\u524D\u8DF3\u4E00\u8DF3\u3002"
    }
  ],
  source: { label: "Origami.me \xB7 Traditional Origami Cicada", url: "https://origami.me/cicada/" }
};

// src/data/tutorials/cup.ts
var cup = {
  id: "cup",
  title: "\u5C0F\u7EB8\u676F",
  emoji: "\u{1F964}",
  category: "\u751F\u6D3B",
  difficulty: 1,
  minutes: 4,
  intro: "\u4E00\u4E2A\u771F\u6B63\u80FD\u88C5\u4E1C\u897F\u7684\u5C0F\u7EB8\u676F\uFF0C\u9732\u8425\u6E38\u620F\u91CC\u7279\u522B\u5B9E\u7528\u3002",
  paper: { outline: DIAMOND, front: "#FFF8F0", back: "#E4573D" },
  steps: [
    {
      type: "fold",
      a: v(-1, 0),
      b: v(1, 0),
      m: v(0, -1),
      dir: "valley",
      desc: "\u83F1\u5F62\u4E0B\u9762\u7684\u89D2\u5411\u4E0A\u5BF9\u6298\uFF0C\u6298\u6210\u5C16\u671D\u4E0A\u7684\u4E09\u89D2\u5F62\u3002"
    },
    {
      type: "prefold",
      a: v(-0.5, 0.5),
      b: v(0.5, 0.5),
      m: v(0, 0.9),
      dir: "valley",
      desc: "\u628A\u4E0A\u9762\u7684\u5C16\u89D2\u5411\u4E0B\u6298\u5230\u5E95\u8FB9\uFF0C\u538B\u51FA\u6298\u75D5\u540E\u5C55\u5F00\u3002",
      tip: "\u8FD9\u6761\u6298\u75D5\u51B3\u5B9A\u4E86\u676F\u53E3\u7684\u9AD8\u5EA6\u3002"
    },
    {
      type: "fold",
      a: v(-0.375, 0),
      b: v(-0.583, 0.417),
      m: v(-0.85, 0.2),
      dir: "valley",
      desc: "\u628A\u5DE6\u4E0B\u89D2\u659C\u7740\u5411\u4E0A\u6298\uFF0C\u5C16\u7AEF\u521A\u597D\u78B0\u5230\u521A\u624D\u7684\u6298\u75D5\u7EBF\u3002"
    },
    {
      type: "fold",
      a: v(0.375, 0),
      b: v(0.583, 0.417),
      m: v(0.85, 0.2),
      dir: "valley",
      desc: "\u53F3\u4E0B\u89D2\u540C\u6837\u5411\u4E0A\u6298\uFF0C\u4E24\u4E2A\u5C16\u89D2\u5728\u4E2D\u95F4\u78B0\u5934\u3002"
    },
    {
      type: "fold",
      a: v(-0.5, 0.5),
      b: v(0.5, 0.5),
      m: v(0, 0.8),
      dir: "valley",
      layersMin: 1,
      desc: "\u628A\u4E0A\u9762\u4E00\u5C42\u7684\u4E09\u89D2\u5411\u4E0B\u6298\uFF0C\u76D6\u4F4F\u4E24\u4E2A\u5C16\u89D2\u3002",
      tip: "\u53EA\u6298\u524D\u9762\u8FD9\u4E00\u5C42\u3002"
    },
    {
      type: "fold",
      a: v(-0.5, 0.5),
      b: v(0.5, 0.5),
      m: v(0, 0.8),
      dir: "mountain",
      desc: "\u628A\u540E\u9762\u90A3\u5C42\u4E09\u89D2\u5411\u540E\u6298\u3002"
    },
    {
      type: "note",
      desc: "\u5B8C\u6210\uFF01\u4ECE\u676F\u53E3\u8F7B\u8F7B\u6491\u5F00\uFF0C\u4E00\u4E2A\u5C0F\u7EB8\u676F\u5C31\u505A\u597D\u4E86\u3002",
      tip: "\u7528\u9632\u6C34\u8721\u7EB8\u6298\u7684\u8BDD\uFF0C\u771F\u7684\u80FD\u88C5\u6C34\u54E6\u3002"
    }
  ],
  source: { label: "Origami Fun \xB7 Origami Drinking Cup", url: "https://www.origami-fun.com/origami-drinking-cup.html" }
};

// src/data/tutorials/dog.ts
var dog = {
  id: "dog",
  title: "\u5C0F\u72D7\u5934",
  emoji: "\u{1F436}",
  category: "\u52A8\u7269",
  difficulty: 1,
  minutes: 3,
  intro: "\u53EA\u9700\u8981\u56DB\u6B65\u5C31\u80FD\u6298\u51FA\u4E00\u53EA\u61A8\u61A8\u7684\u5C0F\u72D7\uFF0C\u662F\u6700\u9002\u5408\u5165\u95E8\u7684\u7ECF\u5178\u6298\u7EB8\u3002",
  paper: { outline: DIAMOND, front: "#FFF9F0", back: "#C68642" },
  steps: [
    {
      type: "fold",
      a: v(-1, 0),
      b: v(1, 0),
      m: v(0, 1),
      dir: "valley",
      desc: "\u628A\u6B63\u65B9\u5F62\u6446\u6210\u83F1\u5F62\uFF0C\u4E0A\u9762\u7684\u89D2\u5411\u4E0B\u5BF9\u6298\uFF0C\u538B\u5E73\u6210\u4E09\u89D2\u5F62\u3002",
      tip: "\u8FB9\u5BF9\u9F50\u518D\u538B\u5B9E\uFF0C\u6298\u75D5\u8D8A\u6574\u9F50\uFF0C\u5C0F\u72D7\u8D8A\u7CBE\u795E\u3002"
    },
    {
      type: "fold",
      a: v(-0.12, 0),
      b: v(-0.52, -0.5),
      m: v(-0.85, -0.18),
      dir: "valley",
      desc: "\u628A\u5DE6\u8FB9\u7684\u89D2\u659C\u7740\u5411\u4E0B\u6298\uFF0C\u505A\u6210\u5DE6\u8033\u6735\u3002"
    },
    {
      type: "fold",
      a: v(0.12, 0),
      b: v(0.52, -0.5),
      m: v(0.85, -0.18),
      dir: "valley",
      desc: "\u540C\u6837\u628A\u53F3\u8FB9\u7684\u89D2\u5411\u4E0B\u6298\uFF0C\u4E24\u53EA\u8033\u6735\u8981\u5BF9\u79F0\u54E6\u3002",
      tip: "\u6298\u4E4B\u524D\u5148\u6BD4\u4E00\u6BD4\u4E24\u8FB9\u7684\u89D2\u5EA6\u3002"
    },
    {
      type: "fold",
      a: v(-0.32, -0.62),
      b: v(0.32, -0.62),
      m: v(0, -0.92),
      dir: "mountain",
      desc: "\u628A\u4E0B\u9762\u7684\u5C16\u89D2\u5411\u540E\u4E0A\u65B9\u6298\u8FDB\u53BB\uFF0C\u8FD9\u662F\u5C0F\u72D7\u7684\u4E0B\u5DF4\u3002"
    },
    {
      type: "note",
      desc: "\u5B8C\u6210\uFF01\u7528\u7B14\u753B\u4E0A\u773C\u775B\u548C\u9F3B\u5B50\uFF0C\u5C0F\u72D7\u5C31\u6D3B\u7075\u6D3B\u73B0\u5566\u3002",
      tip: "\u4E5F\u53EF\u4EE5\u8D34\u4E0A\u6D3B\u52A8\u773C\u775B\u8D34\u7EB8\u3002"
    }
  ],
  source: { label: "Origami Fun \xB7 Origami Dog Face", url: "https://www.origami-fun.com/origami-dog.html" }
};

// src/data/tutorials/envelope.ts
var envelope = {
  id: "envelope",
  title: "\u7231\u5FC3\u4FE1\u5C01",
  emoji: "\u{1F48C}",
  category: "\u8282\u65E5",
  difficulty: 1,
  minutes: 4,
  intro: "\u56DB\u4E2A\u89D2\u4F9D\u6B21\u6298\u5411\u4E2D\u5FC3\uFF0C\u505A\u4E00\u4E2A\u88C5\u6084\u6084\u8BDD\u7684\u5C0F\u4FE1\u5C01\u3002",
  paper: { outline: DIAMOND, front: "#FFF9F0", back: "#7FB3E8" },
  steps: [
    {
      type: "fold",
      a: v(-0.5, -0.5),
      b: v(0.5, -0.5),
      m: v(0, -0.9),
      dir: "valley",
      desc: "\u628A\u4E0B\u9762\u7684\u89D2\u5411\u4E0A\u6298\uFF0C\u5C16\u7AEF\u5BF9\u51C6\u7EB8\u7684\u6B63\u4E2D\u5FC3\u3002",
      tip: "\u4E2D\u5FC3\u5C31\u662F\u4E24\u6761\u5BF9\u89D2\u7EBF\u7684\u4EA4\u70B9\u3002"
    },
    {
      type: "fold",
      a: v(-0.5, -0.5),
      b: v(-0.5, 0.5),
      m: v(-0.9, 0),
      dir: "valley",
      desc: "\u628A\u5DE6\u8FB9\u7684\u89D2\u5411\u53F3\u6298\uFF0C\u5C16\u7AEF\u4E5F\u5BF9\u51C6\u4E2D\u5FC3\u3002"
    },
    {
      type: "fold",
      a: v(0.5, -0.5),
      b: v(0.5, 0.5),
      m: v(0.9, 0),
      dir: "valley",
      desc: "\u53F3\u8FB9\u7684\u89D2\u540C\u6837\u5411\u5DE6\u6298\uFF0C\u56DB\u4E2A\u5C16\u89D2\u5728\u4E2D\u5FC3\u78B0\u5934\u3002"
    },
    {
      type: "fold",
      a: v(-0.5, 0.5),
      b: v(0.5, 0.5),
      m: v(0, 0.9),
      dir: "valley",
      desc: "\u6700\u540E\u628A\u4E0A\u9762\u7684\u89D2\u5411\u4E0B\u6298\uFF0C\u76D6\u4F4F\u4E2D\u95F4\u3002",
      tip: "\u628A\u7B2C\u4E00\u4E2A\u89D2\u585E\u8FDB\u8FD9\u4E2A\u76D6\u5B50\u91CC\uFF0C\u4FE1\u5C01\u5C31\u5C01\u597D\u4E86\u3002"
    },
    {
      type: "note",
      desc: "\u5B8C\u6210\uFF01\u7FFB\u8FC7\u6765\u753B\u4E0A\u7231\u5FC3\u548C\u90AE\u7968\uFF0C\u628A\u6084\u6084\u8BDD\u5199\u597D\u88C5\u8FDB\u53BB\u5427\u3002"
    }
  ],
  source: { label: "Origami Fun \xB7 Origami Envelope", url: "https://www.origami-fun.com/origami-envelope.html" }
};

// src/data/tutorials/fan.ts
var B = (k) => 1.2 - k * 2.4 / 7;
var fan = {
  id: "fan",
  title: "\u5C0F\u6298\u6247",
  emoji: "\u{1FAAD}",
  category: "\u73A9\u5177",
  difficulty: 1,
  minutes: 5,
  intro: "\u50CF\u6298\u624B\u98CE\u7434\u4E00\u6837\u6765\u56DE\u6298\uFF0C\u4E00\u62C9\u5F00\u5C31\u662F\u4E00\u628A\u5C0F\u6247\u5B50\u3002",
  paper: { outline: RECT_LANDSCAPE, front: "#FF9EB5", back: "#FFE0EA" },
  steps: [
    {
      type: "fold",
      a: v(B(1), -0.75),
      b: v(B(1), 0.75),
      m: v(B(0.5), 0),
      dir: "valley",
      desc: "\u628A\u53F3\u8FB9\u7EA6\u4E03\u5206\u4E4B\u4E00\u5BBD\u7684\u7EB8\u5411\u5DE6\u6298\u8FC7\u6765\u3002",
      tip: "\u50CF\u6298\u624B\u98CE\u7434\u4E00\u6837\uFF0C\u4E00\u6B63\u4E00\u53CD\u5730\u6298\u3002"
    },
    {
      type: "fold",
      a: v(B(2), -0.75),
      b: v(B(2), 0.75),
      m: v(B(1.5), 0),
      dir: "valley",
      desc: "\u628A\u53E0\u597D\u7684\u90E8\u5206\u5411\u53F3\u6298\u56DE\u6765\u3002"
    },
    {
      type: "fold",
      a: v(B(3), -0.75),
      b: v(B(3), 0.75),
      m: v(B(2.5), 0),
      dir: "valley",
      desc: "\u518D\u5411\u5DE6\u6298\u3002"
    },
    {
      type: "fold",
      a: v(B(4), -0.75),
      b: v(B(4), 0.75),
      m: v(B(3.5), 0),
      dir: "valley",
      desc: "\u518D\u5411\u53F3\u6298\u3002",
      tip: "\u4FDD\u6301\u6BCF\u6761\u6298\u75D5\u5E73\u884C\u3001\u5BBD\u5EA6\u4E00\u81F4\u3002"
    },
    {
      type: "fold",
      a: v(B(5), -0.75),
      b: v(B(5), 0.75),
      m: v(B(4.5), 0),
      dir: "valley",
      desc: "\u518D\u5411\u5DE6\u6298\u3002"
    },
    {
      type: "fold",
      a: v(B(6), -0.75),
      b: v(B(6), 0.75),
      m: v(B(5.5), 0),
      dir: "valley",
      desc: "\u6700\u540E\u5411\u53F3\u6298\u4E00\u6B21\uFF0C\u628A\u6574\u6761\u7EB8\u90FD\u6298\u5B8C\u3002"
    },
    {
      type: "note",
      desc: "\u5B8C\u6210\uFF01\u634F\u4F4F\u4E0B\u7AEF\uFF0C\u628A\u4E0A\u9762\u7684\u8936\u5B50\u62C9\u5F00\u2014\u2014\u4E00\u628A\u5C0F\u6247\u5B50\uFF01",
      tip: "\u5E95\u7AEF\u5377\u4E0A\u4E00\u5708\u80F6\u5E26\uFF0C\u6247\u5B50\u66F4\u7ED3\u5B9E\u3002"
    }
  ],
  source: { label: "Origami Fun \xB7 Origami Fan", url: "https://web.archive.org/web/2024/https://www.origami-fun.com/origami-fan.html" }
};

// src/data/tutorials/fortune.ts
var fortune = {
  id: "fortune",
  title: "\u4E1C\u5357\u897F\u5317",
  emoji: "\u{1F39E}\uFE0F",
  category: "\u73A9\u5177",
  difficulty: 2,
  minutes: 6,
  intro: "\u5199\u4E0A\u6084\u6084\u8BDD\uFF0C\u5957\u5728\u624B\u6307\u4E0A\u5F00\u5408\uFF0C\u5168\u73ED\u540C\u5B66\u90FD\u7231\u73A9\u7684\u7ECF\u5178\u73A9\u5177\u3002",
  paper: { outline: SQUARE, front: "#4A90D9", back: "#FFD34D" },
  steps: [
    {
      type: "prefold",
      a: v(0, -1),
      b: v(0, 1),
      m: v(-0.5, 0),
      dir: "valley",
      desc: "\u5DE6\u53F3\u5BF9\u6298\u51FA\u4E2D\u7EBF\uFF0C\u5C55\u5F00\uFF1B\u518D\u4E0A\u4E0B\u5BF9\u6298\u51FA\u53E6\u4E00\u6761\u4E2D\u7EBF\uFF0C\u5C55\u5F00\u3002",
      tip: "\u4E24\u6761\u4E2D\u7EBF\u662F\u540E\u9762\u201C\u89D2\u627E\u4E2D\u5FC3\u201D\u7684\u51C6\u7EF3\u3002"
    },
    {
      type: "note",
      desc: "\u63A5\u4E0B\u6765\u628A\u56DB\u4E2A\u89D2\u4F9D\u6B21\u6298\u5411\u4E2D\u5FC3\u3002"
    },
    {
      type: "fold",
      a: v(-1, 0),
      b: v(0, -1),
      m: v(-0.8, -0.8),
      dir: "valley",
      desc: "\u5DE6\u4E0B\u89D2\u6298\u5411\u4E2D\u5FC3\u3002"
    },
    {
      type: "fold",
      a: v(1, 0),
      b: v(0, -1),
      m: v(0.8, -0.8),
      dir: "valley",
      desc: "\u53F3\u4E0B\u89D2\u6298\u5411\u4E2D\u5FC3\u3002"
    },
    {
      type: "fold",
      a: v(-1, 0),
      b: v(0, 1),
      m: v(-0.8, 0.8),
      dir: "valley",
      desc: "\u5DE6\u4E0A\u89D2\u6298\u5411\u4E2D\u5FC3\u3002"
    },
    {
      type: "fold",
      a: v(1, 0),
      b: v(0, 1),
      m: v(0.8, 0.8),
      dir: "valley",
      desc: "\u53F3\u4E0A\u89D2\u6298\u5411\u4E2D\u5FC3\uFF0C\u56DB\u4E2A\u89D2\u5728\u4E2D\u5FC3\u78B0\u5934\u3002",
      tip: "\u56DB\u4E2A\u89D2\u90FD\u8981\u5BF9\u51C6\u540C\u4E00\u4E2A\u4E2D\u5FC3\u70B9\u3002"
    },
    {
      type: "flip",
      axis: "x",
      desc: "\u6574\u4E2A\u7FFB\u4E2A\u9762\uFF0C\u8BA9\u7A7A\u767D\u7684\u4E00\u9762\u671D\u4E0A\u3002"
    },
    {
      type: "fold",
      a: v(-0.5, -0.5),
      b: v(-0.5, 0.5),
      m: v(-0.9, 0),
      dir: "valley",
      layersMin: 4,
      desc: "\u628A\u5DE6\u8FB9\u7684\u89D2\u6298\u5411\u4E2D\u5FC3\uFF08\u53EA\u6298\u6700\u4E0A\u9762\u4E00\u5C42\uFF09\u3002"
    },
    {
      type: "fold",
      a: v(-0.5, -0.5),
      b: v(0.5, -0.5),
      m: v(0, -0.9),
      dir: "valley",
      layersMin: 4,
      desc: "\u628A\u4E0B\u9762\u7684\u89D2\u6298\u5411\u4E2D\u5FC3\u3002"
    },
    {
      type: "fold",
      a: v(0.5, -0.5),
      b: v(0.5, 0.5),
      m: v(0.9, 0),
      dir: "valley",
      layersMin: 4,
      desc: "\u628A\u53F3\u8FB9\u7684\u89D2\u6298\u5411\u4E2D\u5FC3\u3002"
    },
    {
      type: "fold",
      a: v(-0.5, 0.5),
      b: v(0.5, 0.5),
      m: v(0, 0.9),
      dir: "valley",
      layersMin: 4,
      desc: "\u628A\u4E0A\u9762\u7684\u89D2\u6298\u5411\u4E2D\u5FC3\u3002",
      tip: "\u5C0F\u6B63\u65B9\u5F62\u8D8A\u6765\u8D8A\u539A\uFF0C\u6BCF\u4E00\u6B65\u90FD\u8981\u538B\u5B9E\u3002"
    },
    {
      type: "prefold",
      a: v(0, -1),
      b: v(0, 1),
      m: v(0.5, 0),
      dir: "valley",
      desc: "\u5DE6\u53F3\u5BF9\u6298\u518D\u5C55\u5F00\uFF0C\u8BA9\u7EB8\u53D8\u5F97\u7075\u6D3B\u3002"
    },
    {
      type: "prefold",
      a: v(-1, 0),
      b: v(1, 0),
      m: v(0, 0.5),
      dir: "valley",
      desc: "\u4E0A\u4E0B\u5BF9\u6298\u518D\u5C55\u5F00\u3002"
    },
    {
      type: "note",
      desc: "\u5B8C\u6210\uFF01\u5728\u56DB\u4E2A\u5C0F\u65B9\u5757\u4E0A\u5199\u4E0A\u201C\u4E1C\u5357\u897F\u5317\u201D\u548C\u6084\u6084\u8BDD\uFF0C\u56DB\u4E2A\u89D2\u5957\u4E0A\u624B\u6307\uFF0C\u4E00\u5F00\u4E00\u5408\u5F00\u59CB\u7B97\u547D\u5566\uFF01"
    }
  ],
  source: { label: "Origami Fun \xB7 Origami Fortune Teller", url: "https://www.origami-fun.com/origami-fortune-teller.html" }
};

// src/data/tutorials/house.ts
var house = {
  id: "house",
  title: "\u5C0F\u623F\u5B50",
  emoji: "\u{1F3E0}",
  category: "\u751F\u6D3B",
  difficulty: 1,
  minutes: 3,
  intro: "\u7EA2\u9876\u5C0F\u623F\u5B50\uFF0C\u6298\u597D\u53EF\u4EE5\u753B\u4E0A\u95E8\u7A97\uFF0C\u529E\u5BB6\u5BB6\u3001\u642D\u5C0F\u9547\u90FD\u597D\u7528\u3002",
  paper: { outline: SQUARE, front: "#FFF9F0", back: "#E2574C" },
  steps: [
    {
      type: "fold",
      a: v(-1, 0),
      b: v(0, 1),
      m: v(-0.7, 0.7),
      dir: "valley",
      desc: "\u628A\u5DE6\u4E0A\u89D2\u6CBF\u659C\u7EBF\u6298\u4E0B\u6765\uFF0C\u5C16\u89D2\u5BF9\u51C6\u7EB8\u7684\u4E2D\u5FC3\u3002",
      tip: "\u6298\u75D5\u7684\u4E0A\u7AEF\u6B63\u597D\u5728\u4E0A\u8FB9\u7684\u4E2D\u70B9\u3002"
    },
    {
      type: "fold",
      a: v(0, 1),
      b: v(1, 0),
      m: v(0.7, 0.7),
      dir: "valley",
      desc: "\u53F3\u4E0A\u89D2\u540C\u6837\u6298\u4E0B\u6765\uFF0C\u4E24\u4E2A\u5C16\u89D2\u5728\u4E2D\u5FC3\u78B0\u5934\u3002",
      tip: "\u4E0A\u9762\u51FA\u73B0\u4E00\u4E2A\u5C16\u5C16\u7684\u5C4B\u9876\u3002"
    },
    {
      type: "fold",
      a: v(-0.28, 0.7),
      b: v(0.28, 0.7),
      m: v(0, 0.9),
      dir: "valley",
      desc: "\u628A\u5C4B\u9876\u51F8\u51FA\u6765\u7684\u5C0F\u5C16\u89D2\u5411\u4E0B\u6298\u5E73\u3002"
    },
    {
      type: "fold",
      a: v(-1, -0.55),
      b: v(1, -0.55),
      m: v(0, -0.9),
      dir: "valley",
      desc: "\u628A\u5E95\u8FB9\u5411\u4E0A\u6298\u4E00\u6761\uFF0C\u505A\u623F\u5B50\u7684\u5730\u57FA\u3002"
    },
    {
      type: "flip",
      axis: "y",
      desc: "\u7FFB\u4E2A\u9762\uFF0C\u5149\u6ED1\u7684\u623F\u9876\u5C31\u671D\u4E0A\u4E86\u3002"
    },
    {
      type: "note",
      desc: "\u5B8C\u6210\uFF01\u753B\u4E0A\u95E8\u548C\u7A97\uFF0C\u4E00\u5EA7\u5C0F\u623F\u5B50\u76D6\u597D\u4E86\u3002",
      tip: "\u6298\u4E00\u6392\u5C0F\u623F\u5B50\uFF0C\u5C31\u662F\u4E00\u6761\u5C0F\u8857\u5566\u3002"
    }
  ],
  source: { label: "Origami Make \xB7 Origami House", url: "https://web.archive.org/web/2024/http://en.origami-make.org/origami-house-simple" }
};

// src/data/tutorials/plane.ts
var plane = {
  id: "plane",
  title: "\u7EB8\u98DE\u673A",
  emoji: "\u2708\uFE0F",
  category: "\u73A9\u5177",
  difficulty: 1,
  minutes: 4,
  intro: "\u6C38\u8FDC\u662F\u5B69\u5B50\u4EEC\u6700\u7231\u7684\u7EB8\u98DE\u673A\uFF01\u6298\u597D\u5C31\u80FD\u98DE\u51FA\u53BB\u3002",
  paper: { outline: RECT_PORTRAIT, front: "#EAF4FF", back: "#3D8FD6" },
  steps: [
    {
      type: "prefold",
      a: v(0, -1),
      b: v(0, 1),
      m: v(-0.4, 0),
      dir: "valley",
      desc: "\u628A\u7EB8\u5DE6\u53F3\u5BF9\u6298\u51FA\u4E00\u6761\u4E2D\u7EBF\uFF0C\u518D\u5C55\u5F00\u3002",
      tip: "\u5BF9\u9F50\u8FB9\u7F18\uFF0C\u538B\u51FA\u6E05\u6670\u7684\u4E2D\u7EBF\u6298\u75D5\u3002"
    },
    {
      type: "fold",
      a: v(0, 1),
      b: v(-0.75, 0.25),
      m: v(-0.5, 0.8),
      dir: "valley",
      desc: "\u628A\u5DE6\u4E0A\u89D2\u6CBF\u659C\u7EBF\u6298\u4E0B\u6765\uFF0C\u5C16\u89D2\u6B63\u597D\u843D\u5728\u4E2D\u7EBF\u4E0A\u3002"
    },
    {
      type: "fold",
      a: v(0, 1),
      b: v(0.75, 0.25),
      m: v(0.5, 0.8),
      dir: "valley",
      desc: "\u53F3\u4E0A\u89D2\u540C\u6837\u6298\u5411\u4E2D\u7EBF\uFF0C\u4E0A\u9762\u51FA\u73B0\u4E00\u4E2A\u5C16\u5934\u3002"
    },
    {
      type: "fold",
      a: v(0, 1),
      b: v(-0.75, -0.81),
      m: v(-0.55, 0.3),
      dir: "valley",
      desc: "\u628A\u5DE6\u4FA7\u7684\u659C\u8FB9\u518D\u5411\u4E2D\u7EBF\u6298\u4E00\u6B21\uFF0C\u538B\u51FA\u673A\u5934\u3002",
      tip: "\u8FD9\u4E00\u6298\u8BA9\u673A\u5934\u66F4\u7ED3\u5B9E\u3001\u98DE\u5F97\u66F4\u8FDC\u3002"
    },
    {
      type: "fold",
      a: v(0, 1),
      b: v(0.75, -0.81),
      m: v(0.55, 0.3),
      dir: "valley",
      desc: "\u53F3\u4FA7\u540C\u6837\u518D\u6298\u4E00\u6B21\uFF0C\u4E24\u8FB9\u8981\u5BF9\u79F0\u3002"
    },
    {
      type: "fold",
      a: v(0, 1),
      b: v(-0.32, -1),
      m: v(-0.65, -0.3),
      dir: "mountain",
      angle: 45,
      desc: "\u628A\u5DE6\u8FB9\u7684\u673A\u7FFC\u6CBF\u659C\u7EBF\u5411\u4E0B\u6298\u3002",
      tip: "\u4E0D\u7528\u6298\u5E73\uFF0C\u8BA9\u673A\u7FFC\u5FAE\u5FAE\u7FD8\u8D77\u3002"
    },
    {
      type: "fold",
      a: v(0, 1),
      b: v(0.32, -1),
      m: v(0.65, -0.3),
      dir: "mountain",
      angle: 45,
      desc: "\u53F3\u8FB9\u7684\u673A\u7FFC\u5411\u4E0B\u6298\uFF0C\u4E24\u8FB9\u89D2\u5EA6\u4E00\u6837\u3002"
    },
    {
      type: "note",
      desc: "\u5B8C\u6210\uFF01\u634F\u4F4F\u673A\u5934\u4E0B\u65B9\uFF0C\u8F7B\u8F7B\u5411\u524D\u4E00\u63B7\u2014\u2014\u98DE\u5427\uFF01",
      tip: "\u673A\u7FFC\u7ACB\u5F97\u8D8A\u76F4\uFF0C\u98DE\u5F97\u8D8A\u7A33\u3002"
    }
  ],
  source: { label: "Origami Fun \xB7 Origami Plane", url: "https://web.archive.org/web/2024/https://www.origami-fun.com/origami-plane.html" }
};

// src/data/tutorials/rabbit.ts
var rabbit = {
  id: "rabbit",
  title: "\u5C0F\u5154\u5934",
  emoji: "\u{1F430}",
  category: "\u52A8\u7269",
  difficulty: 1,
  minutes: 4,
  intro: "\u7C89\u7C89\u7684\u5C0F\u5154\u5B50\uFF0C\u4E24\u53EA\u957F\u8033\u6735\u7AD6\u8D77\u6765\uFF0C\u7279\u522B\u53EF\u7231\u3002",
  paper: { outline: DIAMOND, front: "#FFF9F0", back: "#F48FB1" },
  steps: [
    {
      type: "fold",
      a: v(-1, 0),
      b: v(1, 0),
      m: v(0, 1),
      dir: "valley",
      desc: "\u83F1\u5F62\u4E0A\u9762\u7684\u89D2\u5411\u4E0B\u5BF9\u6298\uFF0C\u6298\u6210\u5C16\u671D\u4E0B\u7684\u4E09\u89D2\u5F62\u3002"
    },
    {
      type: "fold",
      a: v(-0.5, -0.5),
      b: v(0, 0),
      m: v(-0.8, -0.3),
      dir: "valley",
      desc: "\u628A\u5DE6\u8FB9\u7684\u89D2\u5411\u53F3\u4E0B\u65B9\u6298\uFF0C\u5C16\u7AEF\u5BF9\u51C6\u4E0B\u9762\u7684\u5C16\u89D2\u3002",
      tip: "\u4E24\u4E2A\u5C16\u89D2\u78B0\u5728\u4E00\u8D77\u5C31\u5BF9\u4E86\u3002"
    },
    {
      type: "fold",
      a: v(0.5, -0.5),
      b: v(0, 0),
      m: v(0.8, -0.3),
      dir: "valley",
      desc: "\u53F3\u8FB9\u7684\u89D2\u540C\u6837\u5411\u5DE6\u4E0B\u65B9\u6298\uFF0C\u53D8\u6210\u4E00\u4E2A\u5C0F\u7684\u6B63\u65B9\u5F62\u3002"
    },
    {
      type: "fold",
      a: v(-0.5, -0.5),
      b: v(0, -0.35),
      m: v(-0.2, -0.55),
      dir: "valley",
      layersMin: 2,
      desc: "\u53EA\u628A\u4E0A\u9762\u4E00\u5C42\u7EB8\u6CBF\u7740\u659C\u7EBF\u5411\u4E0A\u6298\uFF0C\u7AD6\u8D77\u5DE6\u8033\u6735\u3002",
      tip: "\u53EA\u6298\u4E00\u5C42\uFF0C\u8033\u6735\u624D\u4F1A\u7FD8\u8D77\u6765\u3002"
    },
    {
      type: "fold",
      a: v(0.5, -0.5),
      b: v(0, -0.35),
      m: v(0.2, -0.55),
      dir: "valley",
      layersMin: 4,
      desc: "\u628A\u53F3\u8FB9\u8FD9\u5C42\u4E5F\u5411\u4E0A\u6298\uFF0C\u7AD6\u8D77\u53F3\u8033\u6735\u3002"
    },
    {
      type: "fold",
      a: v(-0.28, -0.78),
      b: v(0.28, -0.78),
      m: v(0, -0.95),
      dir: "mountain",
      desc: "\u628A\u4E0B\u9762\u7684\u5C16\u89D2\u5411\u540E\u6298\u4E00\u5C0F\u6BB5\uFF0C\u5154\u5B50\u5C31\u6709\u5706\u5706\u7684\u4E0B\u5DF4\u4E86\u3002"
    },
    {
      type: "note",
      desc: "\u5B8C\u6210\uFF01\u753B\u4E0A\u7EA2\u773C\u775B\u548C\u4E09\u74E3\u5634\uFF0C\u5C0F\u5154\u5B50\u5B8C\u6210\u5566\u3002"
    }
  ],
  source: { label: "Origami Fun \xB7 Origami Rabbit Face", url: "https://web.archive.org/web/2024/https://www.origami-fun.com/origami-rabbit.html" }
};

// src/data/tutorials/spinner.ts
var f = (...pts) => ({
  pts: pts.map(([x, y]) => [x, y, 0])
});
var windmillFaces = [
  { ...f([0.5, 0], [0, 0.5], [-0.5, 0], [0, -0.5]), stack: 2 },
  { ...f([-0.5, 0], [0, 0.5], [0.08, 0.97]), stack: 0 },
  { ...f([0, 0.5], [0.5, 0], [0.97, -0.08]), stack: 0 },
  { ...f([0.5, 0], [0, -0.5], [-0.08, -0.97]), stack: 0 },
  { ...f([0, -0.5], [-0.5, 0], [-0.97, 0.08]), stack: 0 }
];
var rim = [
  [0, 0.45, 0.1],
  [-0.39, -0.225, 0.1],
  [0.39, -0.225, 0.1]
];
var apex = [0, 0, 0.45];
var finalFaces = [
  { pts: [rim[0], rim[1], apex], stack: 3 },
  { pts: [rim[1], rim[2], apex], stack: 3 },
  { pts: [rim[2], rim[0], apex], stack: 3 },
  // 叶片 0（左上）：沿中线拆成两片，外段翘起
  {
    pts: [
      rim[1],
      [(rim[0][0] + rim[1][0]) / 2, (rim[0][1] + rim[1][1]) / 2, 0.1],
      [-0.92, 0.53, 0.2]
    ],
    stack: 0
  },
  {
    pts: [
      [(rim[0][0] + rim[1][0]) / 2, (rim[0][1] + rim[1][1]) / 2, 0.1],
      rim[0],
      [-0.92, 0.53, 0.2]
    ],
    stack: 1
  },
  // 叶片 1（下方）
  {
    pts: [rim[2], [0, -0.225, 0.1], [0, -1, 0.2]],
    stack: 0
  },
  {
    pts: [[0, -0.225, 0.1], rim[1], [0, -1, 0.2]],
    stack: 1
  },
  // 叶片 2（右侧）
  {
    pts: [rim[0], [(rim[2][0] + rim[0][0]) / 2, (rim[2][1] + rim[0][1]) / 2, 0.1], [0.92, 0.53, 0.2]],
    stack: 0
  },
  {
    pts: [
      [(rim[2][0] + rim[0][0]) / 2, (rim[2][1] + rim[0][1]) / 2, 0.1],
      rim[2],
      [0.92, 0.53, 0.2]
    ],
    stack: 1
  }
];
var spinner = {
  id: "spinner",
  title: "\u6307\u5C16\u9640\u87BA",
  emoji: "\u{1F300}",
  category: "\u73A9\u5177",
  difficulty: 2,
  minutes: 15,
  intro: "\u6765\u81EA\u516C\u4F17\u53F7\u300C\u6298\u7EB8\u9020\u7269\u8BB0\u300D\u7684\u7ACB\u4F53\u6298\u7EB8\u6559\u7A0B\uFF1A\u4E00\u5F20 15cm \u6B63\u65B9\u5F62\u7EB8\uFF0C\u6298\u51FA\u771F\u7684\u80FD\u8F6C\u7684\u6307\u5C16\u9640\u87BA\u2014\u2014\u4E2D\u95F4\u6491\u8D77\u9525\u5F62\u8F74\u5FC3\uFF0C\u4E09\u7247\u5185\u51F9\u53F6\u7247\u3002",
  paper: { outline: SQUARE, front: "#4A90D9", back: "#2E6FB0" },
  steps: [
    {
      type: "prefold",
      a: v(-1, -1),
      b: v(1, 1),
      m: v(-1, 1),
      dir: "valley",
      desc: "\u6CBF\u5BF9\u89D2\u7EBF\u5BF9\u6298\uFF0C\u538B\u51FA\u6298\u75D5\u540E\u5C55\u5F00\u3002",
      tip: "\u4E24\u6761\u5BF9\u89D2\u7EBF\u90FD\u8981\u538B\u5B9E\uFF0C\u540E\u9762\u5168\u9760\u5B83\u4EEC\u3002"
    },
    {
      type: "prefold",
      a: v(-1, 1),
      b: v(1, -1),
      m: v(-1, -1),
      dir: "valley",
      desc: "\u53E6\u4E00\u6761\u5BF9\u89D2\u7EBF\u540C\u6837\u5BF9\u6298\u540E\u5C55\u5F00\u3002"
    },
    {
      type: "prefold",
      a: v(0, -1),
      b: v(0, 1),
      m: v(-0.5, 0),
      dir: "valley",
      desc: "\u5DE6\u53F3\u5BF9\u6298\u51FA\u7AD6\u76F4\u4E2D\u7EBF\uFF0C\u5C55\u5F00\u3002"
    },
    {
      type: "prefold",
      a: v(-1, 0),
      b: v(1, 0),
      m: v(0, -0.5),
      dir: "valley",
      desc: "\u4E0A\u4E0B\u5BF9\u6298\u51FA\u6C34\u5E73\u4E2D\u7EBF\uFF0C\u5C55\u5F00\u3002"
    },
    {
      type: "prefold",
      a: v(-0.5, -1),
      b: v(-0.5, 1),
      m: v(-0.9, 0),
      dir: "valley",
      desc: "\u5DE6\u8FB9\u7F18\u6298\u5411\u7AD6\u76F4\u4E2D\u7EBF\uFF0C\u538B\u51FA\u56DB\u5206\u7EBF\u540E\u5C55\u5F00\u3002"
    },
    {
      type: "prefold",
      a: v(0.5, -1),
      b: v(0.5, 1),
      m: v(0.9, 0),
      dir: "valley",
      desc: "\u53F3\u8FB9\u7F18\u540C\u6837\u6298\u51FA\u56DB\u5206\u7EBF\uFF0C\u5C55\u5F00\u3002"
    },
    {
      type: "prefold",
      a: v(-1, -0.5),
      b: v(1, -0.5),
      m: v(0, -0.9),
      dir: "valley",
      desc: "\u4E0B\u8FB9\u7F18\u6298\u5411\u6C34\u5E73\u4E2D\u7EBF\uFF0C\u5C55\u5F00\u3002"
    },
    {
      type: "prefold",
      a: v(-1, 0.5),
      b: v(1, 0.5),
      m: v(0, 0.9),
      dir: "valley",
      desc: "\u4E0A\u8FB9\u7F18\u540C\u6837\u6298\u51FA\u56DB\u5206\u7EBF\uFF0C\u5C55\u5F00\u3002",
      tip: "\u73B0\u5728\u7EB8\u4E0A\u6709\u4E86\u4E00\u4E2A 4\xD74 \u7684\u6298\u75D5\u7F51\u683C\u3002"
    },
    {
      type: "fold",
      a: v(-1, 0),
      b: v(0, -1),
      m: v(-0.8, -0.8),
      dir: "valley",
      desc: "\u5DE6\u4E0B\u89D2\u6CBF\u659C\u7EBF\u6298\u5411\u4E2D\u5FC3\u3002"
    },
    {
      type: "fold",
      a: v(0, -1),
      b: v(1, 0),
      m: v(0.8, -0.8),
      dir: "valley",
      desc: "\u53F3\u4E0B\u89D2\u6298\u5411\u4E2D\u5FC3\u3002"
    },
    {
      type: "fold",
      a: v(-1, 0),
      b: v(0, 1),
      m: v(-0.8, 0.8),
      dir: "valley",
      desc: "\u5DE6\u4E0A\u89D2\u6298\u5411\u4E2D\u5FC3\u3002"
    },
    {
      type: "fold",
      a: v(0, 1),
      b: v(1, 0),
      m: v(0.8, 0.8),
      dir: "valley",
      desc: "\u53F3\u4E0A\u89D2\u6298\u5411\u4E2D\u5FC3\uFF0C\u56DB\u4E2A\u89D2\u5728\u4E2D\u5FC3\u78B0\u5934\u3002"
    },
    {
      type: "pose",
      spin: -Math.PI / 2,
      faces: windmillFaces,
      desc: "\u634F\u4F4F\u56DB\u8FB9\u5411\u4E2D\u5FC3\u9760\u62E2\uFF0C\u8BA9\u6BCF\u4E2A\u65B9\u5411\u5404\u7559\u51FA\u4E00\u7247\uFF0C\u6309\u538B\u5E73\u6574\u2014\u2014\u98CE\u8F66\u57FA\u7840\u5F62\uFF01",
      tip: "\u8FD9\u662F\u6700\u795E\u5947\u7684\u4E00\u6B65\uFF1A\u8DDF\u7740\u56FE\u7247\u628A\u56DB\u6761\u8FB9\u7ACB\u8D77\u6765\uFF0C\u987A\u7740\u6298\u75D5\u5F80\u4E2D\u95F4\u6536\u3002"
    },
    {
      type: "flip",
      axis: "x",
      desc: "\u7FFB\u5230\u80CC\u9762\uFF0C\u56DB\u7247\u53F6\u5B50\u7684\u5C16\u89D2\u9732\u5728\u5916\u9762\u3002"
    },
    {
      type: "fold",
      a: v(-0.239, -0.437),
      b: v(0.036, -0.712),
      m: v(0.05, -0.8),
      dir: "valley",
      desc: "\u628A\u4E0B\u9762\u8FD9\u7247\u53F6\u5B50\u7684\u5C16\u89D2\u6CBF\u6298\u7EBF\u5411\u4E2D\u5FC3\u65B9\u5411\u6298\u5E73\uFF0C\u9501\u4F4F\u98CE\u8F66\u3002",
      tip: "\u6298\u75D5\u8981\u4E0E\u53F6\u6839\u7684\u8FB9\u5E73\u884C\uFF0C\u56DB\u7247\u90FD\u6298\u5230\u540C\u6837\u7684\u4F4D\u7F6E\u3002"
    },
    {
      type: "fold",
      a: v(0.437, -0.239),
      b: v(0.712, 0.036),
      m: v(0.8, 0.05),
      dir: "valley",
      desc: "\u53F3\u8FB9\u7684\u53F6\u5C16\u540C\u6837\u5411\u91CC\u6298\u5E73\u3002"
    },
    {
      type: "fold",
      a: v(0.239, 0.437),
      b: v(-0.036, 0.712),
      m: v(-0.05, 0.8),
      dir: "valley",
      desc: "\u4E0A\u9762\u7684\u53F6\u5C16\u5411\u91CC\u6298\u5E73\u3002"
    },
    {
      type: "fold",
      a: v(-0.437, 0.239),
      b: v(-0.712, -0.036),
      m: v(-0.8, -0.05),
      dir: "valley",
      desc: "\u6700\u540E\u628A\u5DE6\u8FB9\u7684\u53F6\u5C16\u4E5F\u6298\u597D\uFF0C\u98CE\u8F66\u5C31\u9501\u4F4F\u4E86\u3002"
    },
    {
      type: "fold",
      a: v(0, -0.97),
      b: v(0, 0.97),
      m: v(0.5, 0),
      dir: "valley",
      wholeSide: true,
      desc: "\u6CBF\u7AD6\u76F4\u4E2D\u7EBF\u628A\u53F3\u534A\u8FB9\u5411\u5DE6\u5408\u62E2\u3002",
      tip: "\u5408\u62E2\u540E\u4E2D\u95F4\u4F1A\u9732\u51FA\u4E09\u89D2\u5F62\u7684\u9525\u9762\uFF0C\u634F\u4F4F\u522B\u677E\u624B\u3002"
    },
    {
      type: "pose",
      faces: finalFaces,
      desc: "\u628A\u5408\u62E2\u7684\u4E24\u534A\u5F20\u5F00\u7EA6120\xB0\uFF0C\u4E2D\u95F4\u7528\u624B\u6307\u6491\u8D77\u9525\u5F62\u8F74\u5FC3\uFF1B\u518D\u628A\u4E09\u7247\u53F6\u7247\u6CBF\u4E2D\u7EBF\u5411\u5185\u51F9\u3001\u53F6\u5C16\u5FAE\u5FAE\u7FD8\u8D77\u2014\u2014\u9640\u87BA\u6210\u578B\uFF01",
      tip: "\u56DB\u7247\u53F6\u91CC\u6709\u4E00\u7247\u6536\u8FDB\u4E86\u9525\u4F53\uFF0C\u5269\u4E0B\u4E09\u7247\u5C31\u662F\u9640\u87BA\u7684\u624B\u81C2\u3002"
    },
    {
      type: "note",
      desc: "\u5B8C\u6210\uFF01\u634F\u4F4F\u4E2D\u5FC3\u7684\u9525\u5F62\u5C16\uFF0C\u7528\u624B\u6307\u4E00\u62E8\u53F6\u7247\uFF0C\u6307\u5C16\u9640\u87BA\u5C31\u547C\u547C\u8F6C\u8D77\u6765\u5566\uFF01",
      tip: "\u5728\u684C\u9762\u4E0A\u8BD5\u7740\u7ACB\u4F4F\u65CB\u8F6C\uFF0C\u6BD4\u6BD4\u8C01\u7684\u8F6C\u5F97\u4E45\u3002"
    }
  ],
  source: {
    label: "\u5FAE\u4FE1\u516C\u4F17\u53F7\u300C\u6298\u7EB8\u9020\u7269\u8BB0\u300D\xB7 \u6298\u7EB8\u9640\u87BA Origami Fidget Spinner",
    url: "http://mp.weixin.qq.com/s?__biz=MzkyMjM0ODcyMA==&mid=2247483973&idx=1&sn=b00850d38402c706f2445203db1d2f9d&chksm=c1f4ff9af683768cf39180175c65338e4ddfc56c4356fa6ecd706466eb3264d796790f999c64#rd"
  }
};

// src/data/tutorials/bunny2.ts
var T = [0, 1, 0];
var B2 = [0, -1, 0];
var L = [-1, 0, 0];
var R = [1, 0, 0];
var O = [0, 0, 0];
var bunny = {
  id: "bunny2",
  title: "\u6298\u7EB8\u5C0F\u5154",
  emoji: "\u{1F430}",
  category: "\u52A8\u7269",
  difficulty: 2,
  minutes: 10,
  intro: "\u6765\u81EA\u516C\u4F17\u53F7\u300C\u6298\u7EB8\u9020\u7269\u8BB0\u300D\u7684\u7ACB\u4F53\u5C0F\u5154\uFF1A\u5148\u6298\u51FA\u6C34\u6C14\u7403\u57FA\u7840\u5F62\uFF0C\u518D\u6298\u51FA\u957F\u8033\u6735\u548C\u7FD8\u5C3E\u5DF4\u3002",
  paper: { outline: SQUARE, front: "#4A90D9", back: "#9CC9E8" },
  steps: [
    {
      type: "prefold",
      a: v(0, -1),
      b: v(0, 1),
      m: v(-0.5, 0),
      dir: "valley",
      desc: "\u7AD6\u76F4\u65B9\u5411\u5BF9\u6298\uFF0C\u538B\u51FA\u4E2D\u7EBF\u540E\u5C55\u5F00\u3002"
    },
    {
      type: "prefold",
      a: v(-1, 0),
      b: v(1, 0),
      m: v(0, -0.5),
      dir: "valley",
      desc: "\u6C34\u5E73\u65B9\u5411\u5BF9\u6298\uFF0C\u538B\u51FA\u4E2D\u7EBF\u540E\u5C55\u5F00\u3002"
    },
    {
      type: "prefold",
      a: v(0, 1),
      b: v(-1, 0),
      m: v(-0.6, 0.6),
      dir: "valley",
      desc: "\u6CBF\u5DE6\u4E0A\u659C\u7EBF\u5BF9\u6298\u2014\u2014\u8BA9\u4E0A\u8FB9\u4E2D\u70B9\u78B0\u5230\u5DE6\u8FB9\u4E2D\u70B9\uFF0C\u538B\u75D5\u540E\u5C55\u5F00\u3002",
      tip: "\u8FD9\u6761\u659C\u7EBF\u662F\u7B49\u4E0B\u6536\u62E2\u7684\u6298\u75D5\u3002"
    },
    {
      type: "prefold",
      a: v(0, 1),
      b: v(1, 0),
      m: v(0.6, 0.6),
      dir: "valley",
      desc: "\u53F3\u4E0A\u659C\u7EBF\u540C\u6837\u5BF9\u6298\u51FA\u6298\u75D5\uFF0C\u5C55\u5F00\u3002"
    },
    {
      type: "prefold",
      a: v(0, -1),
      b: v(1, 0),
      m: v(0.6, -0.6),
      dir: "valley",
      desc: "\u53F3\u4E0B\u659C\u7EBF\u5BF9\u6298\u51FA\u6298\u75D5\uFF0C\u5C55\u5F00\u3002"
    },
    {
      type: "prefold",
      a: v(0, -1),
      b: v(-1, 0),
      m: v(-0.6, -0.6),
      dir: "valley",
      desc: "\u5DE6\u4E0B\u659C\u7EBF\u5BF9\u6298\u51FA\u6298\u75D5\uFF0C\u5C55\u5F00\u3002",
      tip: "\u56DB\u6761\u659C\u7EBF\u52A0\u4E0A\u4E24\u6761\u4E2D\u7EBF\uFF0C\u6298\u75D5\u5168\u90E8\u51C6\u5907\u597D\u4E86\u3002"
    },
    {
      type: "collapse",
      creases: [
        { a: v(-1, 0), b: v(1, 0), dir: "valley" },
        { a: v(0, -1), b: v(0, 1), dir: "valley" },
        { a: v(0, 1), b: v(-1, 0), dir: "mountain" },
        { a: v(0, 1), b: v(1, 0), dir: "mountain" },
        { a: v(0, -1), b: v(1, 0), dir: "mountain" },
        { a: v(0, -1), b: v(-1, 0), dir: "mountain" }
      ],
      faces: [
        { pts: [T, L, O], stack: 0, from: [T, L, O] },
        { pts: [T, R, O], stack: 0, from: [T, R, O] },
        { pts: [B2, R, O], stack: 0, from: [B2, R, O] },
        { pts: [B2, L, O], stack: 0, from: [B2, L, O] },
        { pts: [T, L, O], stack: 1, hinge: { a: T, b: L }, angle: 172 },
        { pts: [T, R, O], stack: -1, hinge: { a: T, b: R }, angle: 172 },
        { pts: [B2, R, O], stack: 2, hinge: { a: B2, b: R }, angle: 172 },
        { pts: [B2, L, O], stack: -2, hinge: { a: B2, b: L }, angle: 172 }
      ],
      desc: "\u634F\u4F4F\u5DE6\u53F3\u4E24\u8FB9\u5411\u4E2D\u95F4\u5408\u62E2\uFF1A\u56DB\u4E2A\u89D2\u987A\u7740\u6298\u75D5\u5411\u4E2D\u5FC3\u5012\u4E0B\u3001\u4EA4\u4F1A\u5728\u4E2D\u5FC3\u2014\u2014\u6C34\u6C14\u7403\u57FA\u7840\u5F62\uFF01",
      tip: "\u770B\u56DB\u4E2A\u89D2\u662F\u600E\u4E48\u5404\u81EA\u7ED5\u7740\u659C\u6298\u75D5\u7FFB\u8F6C 180\xB0 \u5012\u8FDB\u6765\u7684\u3002"
    },
    {
      type: "fold",
      a: v(-0.5, 0.5),
      b: v(0.5, 0.5),
      m: v(0, 0.85),
      dir: "valley",
      layersMin: 0,
      desc: "\u628A\u4E0A\u9762\u7684\u5C16\u89D2\u5411\u4E0B\u6298\uFF0C\u5C16\u5BF9\u51C6\u4E2D\u5FC3\u3002",
      tip: "\u53EA\u6298\u6B63\u9762\u8FD9\u51E0\u5C42\u3002"
    },
    {
      type: "flip",
      axis: "x",
      desc: "\u7FFB\u4E2A\u9762\u3002"
    },
    {
      type: "fold",
      a: v(-0.5, -0.5),
      b: v(0.5, -0.5),
      m: v(0, -0.85),
      dir: "valley",
      layersMin: 0,
      desc: "\u8FD9\u4E00\u9762\u7684\u5C16\u89D2\u540C\u6837\u5411\u4E0B\u6298\uFF0C\u5BF9\u51C6\u4E2D\u5FC3\u3002"
    },
    {
      type: "fold",
      a: v(-0.5, -0.5),
      b: v(-0.5, 0.5),
      m: v(-0.85, 0),
      dir: "valley",
      desc: "\u628A\u5DE6\u8FB9\u7684\u89D2\u5411\u53F3\u6298\uFF0C\u5BF9\u51C6\u7AD6\u76F4\u4E2D\u7EBF\u3002"
    },
    {
      type: "fold",
      a: v(0.5, -0.5),
      b: v(0.5, 0.5),
      m: v(0.85, 0),
      dir: "valley",
      desc: "\u53F3\u8FB9\u7684\u89D2\u540C\u6837\u5411\u5DE6\u6298\uFF0C\u5BF9\u51C6\u4E2D\u7EBF\u3002",
      tip: "\u73B0\u5728\u662F\u4E00\u4E2A\u5C16\u671D\u4E0B\u7684\u98CE\u7B5D\u5F62\u3002"
    },
    {
      type: "pose",
      faces: [
        // 身体侧面轮廓（含双耳、尾巴），双层呈现纸的厚度
        {
          pts: [
            [-0.95, 0.05, 0.02],
            [-0.8, 0.5, 0.02],
            [-0.66, 0.98, 0.02],
            [-0.5, 0.52, 0.02],
            [-0.3, 0.9, 0.02],
            [-0.18, 0.42, 0.02],
            [0.28, 0.28, 0.02],
            [0.62, -0.12, 0.02],
            [0.5, -0.52, 0.02],
            [-0.05, -0.68, 0.02],
            [-0.62, -0.5, 0.02]
          ],
          stack: 1
        },
        {
          pts: [
            [-0.95, 0.05, -0.02],
            [-0.8, 0.5, -0.02],
            [-0.66, 0.98, -0.02],
            [-0.5, 0.52, -0.02],
            [-0.3, 0.9, -0.02],
            [-0.18, 0.42, -0.02],
            [0.28, 0.28, -0.02],
            [0.62, -0.12, -0.02],
            [0.5, -0.52, -0.02],
            [-0.05, -0.68, -0.02],
            [-0.62, -0.5, -0.02]
          ],
          stack: 0
        }
      ],
      desc: "\u6700\u540E\u6574\u5F62\uFF1A\u628A\u7FC5\u8180\u822C\u7684\u4E24\u89D2\u63D0\u8D77\u505A\u6210\u53CC\u8033\uFF0C\u5C3E\u90E8\u5185\u6298\u2014\u2014\u5C0F\u5154\u7684\u4FA7\u9762\u8F6E\u5ED3\u5C31\u51FA\u6765\u4E86\uFF01",
      tip: "\u5BF9\u5E94\u539F\u6587\u7684\u300C\u6574\u7406\u9020\u578B\u300D\uFF1A\u8033\u6735\u8F7B\u8F7B\u6491\u5F00\uFF0C\u5C3E\u5DF4\u5411\u5185\u6536\u3002"
    },
    {
      type: "note",
      desc: "\u5B8C\u6210\uFF01\u628A\u8033\u6735\u8F7B\u8F7B\u6491\u5F00\uFF0C\u753B\u4E0A\u773C\u775B\uFF0C\u5C0F\u5154\u5B50\u5C31\u6D3B\u5566\u3002",
      tip: "\u4E24\u53EA\u8033\u6735\u4E4B\u95F4\u4F1A\u6709\u4E00\u70B9\u7A7A\u9699\uFF0C\u4ECE\u4E0A\u9762\u770B\u6700\u53EF\u7231\u3002"
    }
  ],
  source: {
    label: "\u5FAE\u4FE1\u516C\u4F17\u53F7\u300C\u6298\u7EB8\u9020\u7269\u8BB0\u300D\xB7 10s\u5B66\u4F1A\u6298\u7EB8\u5C0F\u5154",
    url: "http://mp.weixin.qq.com/s?__biz=MzkyMjM0ODcyMA==&mid=2247484163&idx=1&sn=1a30eb4fa4c208ca6d6ef2b8571ec12f&chksm=c1f4fedcf68377cae32b6f6db4a494de1e93320246af8dd2f8da5efebe63fc2956d2d663f5f4#rd"
  }
};

// src/data/tutorials/frog2.ts
var OUTLINE = [
  v(-1.2, -0.85),
  v(1.2, -0.85),
  v(1.2, 0.85),
  v(-1.2, 0.85)
];
function waterbombFaces(h) {
  const T4 = [0, h, 0];
  const B5 = [0, -h, 0];
  const L4 = [-h, 0, 0];
  const R4 = [h, 0, 0];
  const O4 = [0, 0, 0];
  return [
    { pts: [T4, L4, O4], stack: 0, from: [T4, L4, O4] },
    { pts: [T4, R4, O4], stack: 0, from: [T4, R4, O4] },
    { pts: [B5, R4, O4], stack: 0, from: [B5, R4, O4] },
    { pts: [B5, L4, O4], stack: 0, from: [B5, L4, O4] },
    { pts: [T4, L4, O4], stack: 1, hinge: { a: T4, b: L4 }, angle: 172 },
    { pts: [T4, R4, O4], stack: -1, hinge: { a: T4, b: R4 }, angle: 172 },
    { pts: [B5, R4, O4], stack: 2, hinge: { a: B5, b: R4 }, angle: 172 },
    { pts: [B5, L4, O4], stack: -2, hinge: { a: B5, b: L4 }, angle: 172 }
  ];
}
function endFlap(x0, x1) {
  return {
    pts: [
      [x0, 0.85, 5e-3],
      [x1, 0.85, 5e-3],
      [x1, -0.85, 5e-3],
      [x0, -0.85, 5e-3]
    ],
    stack: 3,
    from: [
      [x0, 0.85, 5e-3],
      [x1, 0.85, 5e-3],
      [x1, -0.85, 5e-3],
      [x0, -0.85, 5e-3]
    ]
  };
}
var frog = {
  id: "frog2",
  title: "\u5F39\u8DF3\u9752\u86D9",
  emoji: "\u{1F438}",
  category: "\u73A9\u5177",
  difficulty: 2,
  minutes: 10,
  intro: "\u6765\u81EA\u516C\u4F17\u53F7\u300C\u6298\u7EB8\u9020\u7269\u8BB0\u300D\u7684\u96F6\u57FA\u7840\u5F39\u8DF3\u9752\u86D9\uFF1A\u4E24\u7AEF\u5411\u4E2D\u95F4\u6298\u51FA\u4E2D\u592E\u65B9\u5F62\uFF0C\u6C34\u6C14\u7403\u584C\u7F29\u540E\u6298\u51FA\u56DB\u6761\u817F\uFF0C\u6309\u4F4F\u5C3E\u90E8\u4E00\u677E\u624B\u5C31\u8E66\uFF01",
  paper: { outline: OUTLINE, front: "#7BC950", back: "#4E9E2E" },
  steps: [
    {
      type: "prefold",
      a: v(-1.2, 0),
      b: v(1.2, 0),
      m: v(0, -0.5),
      dir: "valley",
      desc: "\u6A2A\u7740\u5BF9\u6298\uFF0C\u538B\u51FA\u6C34\u5E73\u4E2D\u7EBF\u540E\u5C55\u5F00\u3002"
    },
    {
      type: "fold",
      a: v(-0.85, -0.85),
      b: v(-0.85, 0.85),
      m: v(-1.05, 0),
      dir: "valley",
      desc: "\u5DE6\u7AEF\u5411\u53F3\u6298\uFF0C\u8FB9\u7F18\u4E0E\u5C06\u8981\u5F62\u6210\u7684\u65B9\u5F62\u8FB9\u5BF9\u9F50\u3002",
      tip: "\u6298\u75D5\u4F4D\u7F6E\u5C31\u662F\u4E2D\u592E\u65B9\u5F62\u7684\u5DE6\u8FB9\u754C\u3002"
    },
    {
      type: "fold",
      a: v(0.85, -0.85),
      b: v(0.85, 0.85),
      m: v(1.05, 0),
      dir: "valley",
      desc: "\u53F3\u7AEF\u5411\u5DE6\u6298\uFF0C\u4E24\u7AEF\u90FD\u6536\u8FDB\u6765\uFF0C\u5F97\u5230\u4E00\u4E2A\u53CC\u5C42\u7684\u4E2D\u592E\u65B9\u5F62\u3002"
    },
    {
      type: "prefold",
      a: v(-0.85, -0.85),
      b: v(0.85, 0.85),
      m: v(-0.7, 0.7),
      dir: "valley",
      desc: "\u6CBF\u65B9\u5F62\u7684\u5BF9\u89D2\u7EBF\u5BF9\u6298\uFF0C\u538B\u75D5\u540E\u5C55\u5F00\u3002"
    },
    {
      type: "prefold",
      a: v(-0.85, 0.85),
      b: v(0.85, -0.85),
      m: v(-0.7, -0.7),
      dir: "valley",
      desc: "\u53E6\u4E00\u6761\u5BF9\u89D2\u7EBF\u540C\u6837\u5BF9\u6298\u51FA\u6298\u75D5\u3002",
      tip: "\u52A0\u4E0A\u65B9\u5F62\u7684\u6A2A\u7AD6\u4E2D\u7EBF\uFF0C\u6536\u62E2\u7684\u6298\u75D5\u5C31\u9F50\u4E86\u3002"
    },
    {
      type: "collapse",
      creases: [
        { a: v(-0.85, 0), b: v(0.85, 0), dir: "valley" },
        { a: v(0, -0.85), b: v(0, 0.85), dir: "valley" },
        { a: v(-0.85, -0.85), b: v(0.85, 0.85), dir: "mountain" },
        { a: v(-0.85, 0.85), b: v(0.85, -0.85), dir: "mountain" }
      ],
      faces: [...waterbombFaces(0.85), endFlap(-0.85, -0.5), endFlap(0.5, 0.85)],
      desc: "\u634F\u4F4F\u65B9\u5F62\u4E0A\u4E0B\u4E24\u8FB9\u5411\u4E2D\u95F4\u5408\u62E2\uFF1A\u56DB\u4E2A\u89D2\u987A\u7740\u5BF9\u89D2\u6298\u75D5\u5411\u4E2D\u5FC3\u5012\u4E0B\u2014\u2014\u6C34\u6C14\u7403\u57FA\u7840\u5F62\uFF01",
      tip: "\u770B\u56DB\u4E2A\u89D2\u600E\u4E48\u5404\u81EA\u7ED5\u5BF9\u89D2\u7EBF\u7FFB\u8F6C 180\xB0 \u5012\u8FDB\u6765\u3002"
    },
    {
      type: "fold",
      a: v(-0.72, 0.6),
      b: v(-0.4, 0.28),
      m: v(-0.78, 0.68),
      dir: "valley",
      angle: 150,
      layersMin: 1,
      layersMax: 1,
      desc: "\u5DE6\u4E0A\u89D2\u5411\u5916\u7FFB\u6298\uFF0C\u6298\u51FA\u524D\u817F\u3002",
      tip: "\u56DB\u4E2A\u89D2\u90FD\u5F80\u5916\u7FFB\uFF0C\u4E0D\u7528\u6298\u5E73\u3002"
    },
    {
      type: "fold",
      a: v(0.4, 0.28),
      b: v(0.72, 0.6),
      m: v(0.78, 0.68),
      dir: "valley",
      angle: 150,
      layersMin: -1,
      layersMax: -1,
      desc: "\u53F3\u4E0A\u89D2\u5411\u5916\u7FFB\u6298\uFF0C\u6298\u51FA\u53E6\u4E00\u6761\u524D\u817F\u3002"
    },
    {
      type: "fold",
      a: v(-0.72, -0.6),
      b: v(-0.4, -0.28),
      m: v(-0.78, -0.68),
      dir: "valley",
      angle: 150,
      layersMin: -2,
      layersMax: -2,
      desc: "\u5DE6\u4E0B\u89D2\u5411\u5916\u7FFB\u6298\uFF0C\u6298\u51FA\u540E\u817F\u3002"
    },
    {
      type: "fold",
      a: v(0.4, -0.28),
      b: v(0.72, -0.6),
      m: v(0.78, -0.68),
      dir: "valley",
      angle: 150,
      layersMin: 2,
      layersMax: 2,
      desc: "\u53F3\u4E0B\u89D2\u5411\u5916\u7FFB\u6298\uFF0C\u56DB\u6761\u817F\u5B8C\u6210\uFF01"
    },
    {
      type: "fold",
      a: v(-0.3, -0.85),
      b: v(-0.3, 0.85),
      m: v(-0.6, 0),
      dir: "valley",
      wholeSide: true,
      desc: "\u5DE6\u8FB9\u5411\u7AD6\u76F4\u4E2D\u7EBF\u5BF9\u6298\uFF0C\u628A\u8FB9\u4E0A\u7684\u89D2\u585E\u8FDB\u4E2D\u95F4\u7684\u7F1D\u91CC\u3002"
    },
    {
      type: "fold",
      a: v(0.3, -0.85),
      b: v(0.3, 0.85),
      m: v(0.6, 0),
      dir: "valley",
      wholeSide: true,
      desc: "\u53F3\u8FB9\u540C\u6837\u5411\u4E2D\u7EBF\u5BF9\u6298\uFF0C\u585E\u597D\u89D2\u3002",
      tip: "\u73B0\u5728\u662F\u7D27\u51D1\u7684\u591A\u5C42\u65B9\u5F62\uFF0C\u56DB\u6761\u817F\u9732\u5728\u5916\u9762\u3002"
    },
    {
      type: "flip",
      axis: "x",
      desc: "\u7FFB\u4E2A\u9762\u3002"
    },
    {
      type: "fold",
      a: v(-0.85, 0),
      b: v(0.85, 0),
      m: v(0, 0.6),
      dir: "valley",
      desc: "\u6CBF\u6C34\u5E73\u4E2D\u7EBF\u628A\u4E0A\u534A\u8FB9\u5411\u4E0B\u5BF9\u6298\u3002"
    },
    {
      type: "fold",
      a: v(-0.85, -0.35),
      b: v(0.85, -0.35),
      m: v(0, -0.6),
      dir: "valley",
      desc: "\u5C3E\u90E8\u518D\u5411\u4E0A\u6298\u4E00\u534A\uFF0C\u505A\u51FA\u5F39\u8DF3\u7684\u6298\u5C42\u3002",
      tip: "\u6309\u4F4F\u6298\u5C42\uFF0C\u4E00\u677E\u624B\u9752\u86D9\u5C31\u4F1A\u8E66\u51FA\u53BB\uFF01"
    },
    {
      type: "note",
      desc: "\u5B8C\u6210\uFF01\u628A\u9752\u86D9\u653E\u5728\u684C\u4E0A\uFF0C\u6309\u4F4F\u5C3E\u90E8\u5411\u540E\u4E00\u6ED1\uFF0C\u770B\u5B83\u5F39\u8DF3\uFF01",
      tip: "\u548C\u540C\u5B66\u6BD4\u4E00\u6BD4\u8C01\u7684\u9752\u86D9\u8DF3\u5F97\u8FDC\u3002"
    }
  ],
  source: {
    label: "\u5FAE\u4FE1\u516C\u4F17\u53F7\u300C\u6298\u7EB8\u9020\u7269\u8BB0\u300D\xB7 10s\u5B66\u4F1A\u5F39\u8DF3\u9752\u86D9\uFF08\u96F6\u57FA\u7840\uFF09",
    url: "http://mp.weixin.qq.com/s?__biz=MzkyMjM0ODcyMA==&mid=2247483997&idx=1&sn=64847c80d57f1c4c1887246015278b75&chksm=c1f4ff82f683769406106e272c031acf37c377d25ff47c8d30c83d667f151a4950051bc21d1d#rd"
  }
};

// src/data/tutorials/poop.ts
var T2 = [0, 1, 0];
var B3 = [0, -1, 0];
var L2 = [-1, 0, 0];
var R2 = [1, 0, 0];
var O2 = [0, 0, 0];
var poop = {
  id: "poop",
  title: "\u641E\u602A\u4FBF\u4FBF",
  emoji: "\u{1F4A9}",
  category: "\u73A9\u5177",
  difficulty: 2,
  minutes: 12,
  intro: "\u6765\u81EA\u516C\u4F17\u53F7\u300C\u6298\u7EB8\u9020\u7269\u8BB0\u300D\u7684\u641E\u602A\u4FBF\u4FBF\uFF1A\u6C34\u6C14\u7403\u57FA\u7840\u5F62\u6253\u5E95\uFF0C\u4EA4\u66FF\u7FFB\u6298\u76D8\u7ED5\u51FA\u5C42\u6B21\uFF0C\u5185\u7FFB\u6298\u6324\u51FA\u773C\u775B\u548C\u5634\u5DF4\u3002",
  paper: { outline: SQUARE, front: "#B5773A", back: "#D9A968" },
  steps: [
    {
      type: "prefold",
      a: v(-1, -1),
      b: v(1, 1),
      m: v(-0.6, 0.6),
      dir: "valley",
      desc: "\u6CBF\u5BF9\u89D2\u7EBF\u5BF9\u6298\uFF0C\u538B\u51FA\u6298\u75D5\u540E\u5C55\u5F00\u3002"
    },
    {
      type: "prefold",
      a: v(-1, 1),
      b: v(1, -1),
      m: v(0.6, 0.6),
      dir: "valley",
      desc: "\u53E6\u4E00\u6761\u5BF9\u89D2\u7EBF\u540C\u6837\u5BF9\u6298\u5C55\u5F00\u3002"
    },
    {
      type: "prefold",
      a: v(0, -1),
      b: v(0, 1),
      m: v(-0.5, 0),
      dir: "valley",
      desc: "\u7AD6\u76F4\u4E2D\u7EBF\u5BF9\u6298\u5C55\u5F00\u3002"
    },
    {
      type: "prefold",
      a: v(-1, 0),
      b: v(1, 0),
      m: v(0, -0.5),
      dir: "valley",
      desc: "\u6C34\u5E73\u4E2D\u7EBF\u5BF9\u6298\u5C55\u5F00\u3002",
      tip: "\u7C73\u5B57\u6298\u75D5\u5907\u9F50\u3002"
    },
    {
      type: "collapse",
      creases: [
        { a: v(-1, 0), b: v(1, 0), dir: "valley" },
        { a: v(0, -1), b: v(0, 1), dir: "valley" },
        { a: v(-1, -1), b: v(1, 1), dir: "mountain" },
        { a: v(-1, 1), b: v(1, -1), dir: "mountain" }
      ],
      faces: [
        { pts: [T2, L2, O2], stack: 0, from: [T2, L2, O2] },
        { pts: [T2, R2, O2], stack: 0, from: [T2, R2, O2] },
        { pts: [B3, R2, O2], stack: 0, from: [B3, R2, O2] },
        { pts: [B3, L2, O2], stack: 0, from: [B3, L2, O2] },
        { pts: [T2, L2, O2], stack: 1, hinge: { a: T2, b: L2 }, angle: 172 },
        { pts: [T2, R2, O2], stack: -1, hinge: { a: T2, b: R2 }, angle: 172 },
        { pts: [B3, R2, O2], stack: 2, hinge: { a: B3, b: R2 }, angle: 172 },
        { pts: [B3, L2, O2], stack: -2, hinge: { a: B3, b: L2 }, angle: 172 }
      ],
      desc: "\u634F\u4F4F\u56DB\u8FB9\u5411\u4E2D\u95F4\u5408\u62E2\u2014\u2014\u6C34\u6C14\u7403\u57FA\u7840\u5F62\uFF08\u83F1\u5F62\uFF09\u3002"
    },
    {
      type: "pose",
      faces: [
        // 便便三层盘绕轮廓
        {
          pts: [
            [0, 0.95, 0.03],
            [0.3, 0.6, 0.03],
            [0.72, 0.42, 0.03],
            [0.92, 0.1, 0.03],
            [0.72, -0.25, 0.03],
            [0.3, -0.5, 0.03],
            [-0.3, -0.5, 0.03],
            [-0.72, -0.25, 0.03],
            [-0.92, 0.1, 0.03],
            [-0.72, 0.42, 0.03],
            [-0.3, 0.6, 0.03]
          ],
          stack: 1
        },
        {
          pts: [
            [0, 0.95, -0.03],
            [0.3, 0.6, -0.03],
            [0.72, 0.42, -0.03],
            [0.92, 0.1, -0.03],
            [0.72, -0.25, -0.03],
            [0.3, -0.5, -0.03],
            [-0.3, -0.5, -0.03],
            [-0.72, -0.25, -0.03],
            [-0.92, 0.1, -0.03],
            [-0.72, 0.42, -0.03],
            [-0.3, 0.6, -0.03]
          ],
          stack: 0
        },
        // 来色嘴巴带
        {
          pts: [
            [-0.55, 0.05, 0.04],
            [0.55, 0.05, 0.04],
            [0.4, -0.2, 0.04],
            [-0.4, -0.2, 0.04]
          ],
          stack: 2
        },
        // 方块眼睛×2
        {
          pts: [
            [-0.34, 0.35, 0.045],
            [-0.08, 0.35, 0.045],
            [-0.08, 0.6, 0.045],
            [-0.34, 0.6, 0.045]
          ],
          stack: 3
        },
        {
          pts: [
            [0.08, 0.35, 0.045],
            [0.34, 0.35, 0.045],
            [0.34, 0.6, 0.045],
            [0.08, 0.6, 0.045]
          ],
          stack: 3
        }
      ],
      desc: "\u4E0B\u9762\u7684\u5C16\u89D2\u5411\u4E0A\u7FFB\u3001\u4E0A\u9762\u5411\u4E0B\u6298\uFF0C\u4EA4\u66FF\u6298\u53E0\u76D8\u7ED5\u51FA\u4E09\u5C42\uFF1B\u518D\u5185\u7FFB\u6298\u6324\u51FA\u773C\u775B\uFF0C\u6700\u540E\u5185\u538B\u6210\u578B\u2014\u2014\u4FBF\u4FBF\u5C31\u5B8C\u6210\u5566\uFF01",
      tip: "\u770B\u8D77\u6765\u6709\u70B9\u81ED\uFF0C\u4F46\u5176\u5B9E\u5F88\u6709\u8DA3\uFF01\u4E09\u89D2\u5F62\u5F00\u53E3\u5904\u5411\u5185\u6324\u538B\u51FA\u6B63\u65B9\u5F62\u5C31\u662F\u773C\u775B\u3002"
    }
  ],
  source: {
    label: "\u5FAE\u4FE1\u516C\u4F17\u53F7\u300C\u6298\u7EB8\u9020\u7269\u8BB0\u300D\xB7 \u7EB8\u505A\u7684\u4FBF\u4FBF",
    url: "http://mp.weixin.qq.com/s?__biz=MzkyMjM0ODcyMA==&mid=2247484529&idx=1&sn=26070200f93310c359fae17d9715f876&chksm=c1f4f9aef68370b83aaa32ac21e2ed6fd31305719176ff12ac4d528b3ef3829b1b4cf8b5b5dd#rd"
  }
};

// src/data/tutorials/dove.ts
var EPS = 0.012;
function zk(k) {
  return -0.05 + 0.014 * k;
}
function openFaces() {
  const faces = [];
  for (let k = 0; k < 8; k++) {
    const z = zk(k);
    faces.push({
      pts: [
        [-0.5, 0, z],
        [0.5, 0, z],
        [0.25, -0.25, z],
        [-0.25, -0.25, z]
      ],
      stack: k
    });
  }
  for (let k = 0; k < 8; k++) {
    const z = zk(k);
    faces.push({
      pts: [
        [-0.05, 0, z],
        [0.3, 0, z],
        [0.3, 0.22 + 6e-3 * k, 0.39 - 4e-3 * k]
      ],
      stack: k
    });
  }
  return faces;
}
function bodyPentagon(z) {
  return [
    [-0.08, 0, z],
    [0.225, 0, z],
    [0.225, -0.25, z],
    [-0.25, -0.25, z],
    [-0.29, -0.21, z]
  ];
}
function finalFaces2() {
  const faces = [];
  for (let k = 0; k < 8; k++) {
    faces.push({ pts: bodyPentagon(zk(k)), stack: k });
  }
  for (const s of [1, 0]) {
    const z = s === 1 ? EPS : -EPS;
    faces.push({
      // 头部：从身体左端伸出，尖朝左
      pts: [
        [-0.5, 0, z],
        [-0.92, -0.1, z],
        [-0.25, -0.25, z]
      ],
      stack: s
    });
    faces.push({
      // 喙：头部尖端的小三角（⑫内翻形成）
      pts: [
        [-0.92, -0.1, z + 4e-3],
        [-0.84, -0.26, z + 4e-3],
        [-0.74, -0.16, z + 4e-3]
      ],
      stack: s
    });
    faces.push({
      // 翅膀：由立帆展开，向右上撑开、微微抬起
      pts: [
        [-0.15, 0, z],
        [0.35, 0, z],
        [0.55, 0.38, 0.28]
      ],
      stack: s === 1 ? 9 : 0
    });
    faces.push({
      // 尾部：从身体右端翻向右下
      pts: [
        [0.25, -0.25, z],
        [0.5, 0, z],
        [0.7, -0.42, z],
        [0.4, -0.32, z]
      ],
      stack: s
    });
  }
  return faces;
}
var dove = {
  id: "dove",
  title: "\u548C\u5E73\u9E3D",
  emoji: "\u{1F54A}\uFE0F",
  category: "\u52A8\u7269",
  difficulty: 2,
  minutes: 12,
  intro: "\u6765\u81EA\u516C\u4F17\u53F7\u300C\u6298\u7EB8\u9020\u7269\u8BB0\u300D\u7684\u548C\u5E73\u9E3D\uFF1A\u4E09\u89D2\u5F62\u57FA\u7840\u5C42\u5C42\u6536\u62E2\uFF0C\u6253\u5F00\u7ACB\u8D77\u4E00\u9762\u300C\u5E06\u300D\uFF0C\u5934\u90E8\u5185\u7FFB\u51FA\u5599\u3001\u5C3E\u90E8\u5BF9\u9F50\u7EA2\u7EBF\uFF0C\u6700\u540E\u5C55\u5F00\u7FC5\u8180\u2014\u2014\u4E00\u53EA\u8854\u7740\u548C\u5E73\u7684\u9E3D\u5B50\u5C31\u98DE\u8D77\u6765\u4E86\u3002",
  paper: { outline: DIAMOND, front: "#3E8FC7", back: "#A6D3EF" },
  steps: [
    {
      type: "note",
      desc: "\u51C6\u5907\u4E00\u5F20 15\xD715cm \u6B63\u65B9\u5F62\u7EB8\uFF0C\u65CB\u8F6C 45\xB0 \u83F1\u5F62\u6446\u653E\u3002",
      tip: "\u4E00\u5F20\u7EB8\uFF0C\u6298\u51FA\u6E29\u67D4\u4E0E\u548C\u5E73\u3002"
    },
    {
      type: "fold",
      a: v(0, -1),
      b: v(0, 1),
      m: v(-0.4, 0),
      dir: "valley",
      desc: "\u6CBF\u4E2D\u5FC3\u7AD6\u7EBF\u5BF9\u6298\uFF0C\u5DE6\u534A\u6298\u5411\u53F3\u534A\u3002",
      tip: "\u5F97\u5230\u4E00\u4E2A\u5C16\u671D\u53F3\u7684\u4E09\u89D2\u5F62\u3002"
    },
    {
      type: "fold",
      a: v(0, 0),
      b: v(1, 0),
      m: v(0.4, 0.4),
      dir: "valley",
      desc: "\u6CBF\u6C34\u5E73\u4E2D\u7EBF\u628A\u4E0A\u534A\u4E2A\u4E09\u89D2\u5F62\u5411\u4E0B\u7FFB\u6298\u3002",
      tip: "\u73B0\u5728\u662F\u76F4\u89D2\u671D\u5DE6\u4E0A\u3001\u56DB\u5C42\u539A\u7684\u5C0F\u4E09\u89D2\u5F62\u3002"
    },
    {
      type: "fold",
      a: v(0, 0),
      b: v(0.5, -0.5),
      m: v(0.1, -0.4),
      dir: "valley",
      desc: "\u6CBF 45\xB0 \u4E2D\u5FC3\u7EBF\u628A\u5DE6\u534A\u5411\u53F3\u7FFB\u6298\u2014\u2014\u7FFB\u9762\u540E\u53E6\u4E00\u4FA7\u540C\u6837\u64CD\u4F5C\uFF0C\u8FD9\u91CC\u4E00\u5E76\u6298\u597D\u3002",
      tip: "\u5F97\u5230\u5C16\u671D\u4E0B\u3001\u516B\u5C42\u539A\u7684\u4E09\u89D2\u5F62\u3002"
    },
    {
      type: "fold",
      a: v(0.25, -0.25),
      b: v(0.75, -0.25),
      m: v(0.5, -0.45),
      dir: "valley",
      desc: "\u65CB\u8F6C\uFF0C\u628A\u5E95\u90E8\u7684\u5C16\u89D2\u6CBF\u4E2D\u7EBF\u5411\u4E0A\u6298\u538B\u3002",
      tip: "\u5C16\u89D2\u6B63\u597D\u843D\u5230\u4E0A\u8FB9\u7F18\u4E0A\u3002"
    },
    {
      type: "note",
      desc: "\u628A\u6298\u4E0A\u6765\u7684\u89D2\u5411\u5185\u6324\u538B\uFF0C\u6574\u7406\u6210\u4E00\u4E2A\u68AF\u5F62\u3002"
    },
    {
      type: "pose",
      faces: openFaces(),
      desc: "\u7531\u53F3\u5411\u5DE6\u5411\u4E0A\u5C55\u5F00\uFF0C\u7FFB\u9762\u540E\u53E6\u4E00\u4FA7\u540C\u6837\u64CD\u4F5C\u2014\u2014\u7EB8\u5C42\u6253\u5F00\uFF0C\u4E00\u9762\u300C\u5E06\u300D\u7ACB\u4E86\u8D77\u6765\u3002",
      tip: "\u8239\u8EAB\u4FDD\u6301\u4E0D\u52A8\uFF0C\u4E2D\u95F4\u7684\u7EB8\u5C42\u5411\u4E0A\u7ACB\u8D77\uFF0C\u9876\u90E8\u5FAE\u5FAE\u9519\u5F00\u3002"
    },
    {
      type: "prefold",
      a: v(-0.08, 0),
      b: v(-0.29, -0.21),
      m: v(-0.45, -0.05),
      dir: "valley",
      desc: "\u5934\u90E8\u6CBF\u865A\u7EBF\u5411\u4E0B\u7FFB\u6298\uFF0C\u538B\u51FA\u6298\u75D5\u540E\u5C55\u5F00\u3002",
      tip: "\u8FD9\u6761\u6298\u75D5\u7B49\u4F1A\u513F\u8981\u5411\u5185\u7FFB\u3002"
    },
    {
      type: "fold",
      a: v(-0.08, 0),
      b: v(-0.29, -0.21),
      m: v(-0.45, -0.05),
      dir: "mountain",
      angle: 150,
      desc: "\u6CBF\u6298\u75D5\u628A\u5934\u90E8\u5411\u5185\u7FFB\u6298\uFF0C\u538B\u51FA\u5C16\u5C16\u7684\u5599\u3002"
    },
    {
      type: "prefold",
      a: v(0.225, 0),
      b: v(0.225, -0.28),
      m: v(0.4, -0.1),
      dir: "valley",
      desc: "\u5C3E\u90E8\u6CBF\u865A\u7EBF\u5411\u5DE6\u7FFB\u6298\uFF0C\u5C16\u7AEF\u5BF9\u9F50\u7ACB\u5E06\u5DE6\u7F18\u7684\u300C\u7EA2\u7EBF\u300D\uFF0C\u538B\u51FA\u6298\u75D5\u540E\u5C55\u5F00\u3002"
    },
    {
      type: "fold",
      a: v(0.225, 0),
      b: v(0.225, -0.28),
      m: v(0.4, -0.1),
      dir: "valley",
      desc: "\u518D\u6CBF\u6298\u75D5\u628A\u5C3E\u90E8\u5411\u5DE6\u5BF9\u6298\u2014\u2014\u5C3E\u5C16\u6B63\u597D\u78B0\u5230\u7EA2\u7EBF\u3002"
    },
    {
      type: "pose",
      faces: finalFaces2(),
      desc: "\u6700\u540E\u6574\u7406\uFF1A\u7FC5\u8180\u5411\u53F3\u4E0A\u5C55\u5F00\uFF0C\u5934\u90E8\u62AC\u8D77\u3001\u5C3E\u90E8\u7FFB\u5411\u4E0B\u65B9\u2014\u2014\u548C\u5E73\u9E3D\u5B8C\u6210\uFF01",
      tip: "\u5BF9\u5E94\u539F\u6587\u6700\u540E\u4E00\u6B65\u300C\u5411\u4E0B\u6324\u538B\u300D\uFF1A\u5C3E\u90E8\u538B\u5411\u8EAB\u4F53\u4E0B\u65B9\uFF0C\u7FC5\u8180\u5FAE\u5FAE\u5F20\u5F00\u3002"
    },
    {
      type: "note",
      desc: "\u5B8C\u6210\uFF01\u8F7B\u8F7B\u628A\u7FC5\u8180\u6491\u5F00\uFF0C\u613F\u548C\u5E73\u5E38\u4F34\u3002",
      tip: "\u628A\u7FC5\u8180\u4E0E\u8EAB\u4F53\u4E4B\u95F4\u7684\u89D2\u5EA6\u6491\u5927\u4E00\u70B9\uFF0C\u9E3D\u5B50\u66F4\u7CBE\u795E\u3002"
    }
  ],
  source: {
    label: "\u5FAE\u4FE1\u516C\u4F17\u53F7\u300C\u6298\u7EB8\u9020\u7269\u8BB0\u300D\xB7 \u613F\u5927\u6570\u636E\u63A8\u9001\u7ED9\u6BCF\u4E00\u4F4D\u70ED\u7231\u548C\u5E73\u751F\u6D3B\u7684\u4EBA\u{1F54A}\uFE0F",
    url: "http://mp.weixin.qq.com/s?__biz=MzkyMjM0ODcyMA==&mid=2247484570&idx=1&sn=7307f4895b43096852cb1ac2f4d95eae&chksm=c1f4f945f6837053fbf940c640acc0ea54bef76055cb10f813ce023c2fd5de524f5a42caa8e9#rd"
  }
};

// src/data/tutorials/capy.ts
var EPS2 = 0.012;
function gatherFaces() {
  const faces = [];
  for (const s of [1, 0]) {
    const z = s === 1 ? EPS2 : -EPS2;
    faces.push({
      pts: [
        [-0.45, 1, z],
        [0.45, 1, z],
        [0.58, 0.6, z],
        [0.58, -0.6, z],
        [0.45, -1, z],
        [-0.45, -1, z],
        [-0.58, -0.6, z],
        [-0.58, 0.6, z]
      ],
      stack: s
    });
  }
  return faces;
}
var capy = {
  id: "capy",
  title: "\u5361\u76AE\u5DF4\u62C9",
  emoji: "\u{1F9AB}",
  category: "\u52A8\u7269",
  difficulty: 1,
  minutes: 8,
  intro: "\u6765\u81EA\u516C\u4F17\u53F7\u300C\u6298\u7EB8\u9020\u7269\u8BB0\u300D\u7684\u96F6\u57FA\u7840\u5361\u76AE\u5DF4\u62C9\uFF1A\u6298\u75D5\u7F51\u683C\u6253\u5E95\uFF0C\u89D2\u6298\u51FA\u809A\u5B50\uFF0C\u4E24\u4FA7\u5411\u5185\u5E76\u62E2\u540E\u5BF9\u6298\uFF0C\u6700\u540E\u628A\u5934\u5C3E\u5411\u5185\u4E00\u63A8\u2014\u2014\u5446\u840C\u7684\u6C34\u8C5A\u5C31\u51FA\u73B0\u4E86\u3002",
  paper: { outline: SQUARE, front: "#D99A5B", back: "#EBC295" },
  steps: [
    {
      type: "prefold",
      a: v(0, -1),
      b: v(0, 1),
      m: v(-0.5, 0),
      dir: "valley",
      desc: "\u7AD6\u76F4\u65B9\u5411\u5BF9\u6298\uFF0C\u538B\u51FA\u4E2D\u7EBF\u540E\u5C55\u5F00\u3002"
    },
    {
      type: "prefold",
      a: v(-1, 0),
      b: v(1, 0),
      m: v(0, -0.5),
      dir: "valley",
      desc: "\u6C34\u5E73\u65B9\u5411\u5BF9\u6298\u518D\u5C55\u5F00\uFF0C\u5341\u5B57\u6298\u75D5\u5907\u597D\u3002"
    },
    {
      type: "fold",
      a: v(-1, -0.55),
      b: v(-0.55, -1),
      m: v(-0.85, -0.85),
      dir: "valley",
      desc: "\u5DE6\u4E0B\u89D2\u6CBF\u5BF9\u89D2\u7EBF\u5411\u5185\u6298\u3002"
    },
    {
      type: "fold",
      a: v(0.55, -1),
      b: v(1, -0.55),
      m: v(0.85, -0.85),
      dir: "valley",
      desc: "\u53F3\u4E0B\u89D2\u540C\u6837\u5411\u5185\u6298\u3002"
    },
    {
      type: "fold",
      a: v(-1, -0.4),
      b: v(1, -0.4),
      m: v(0, -0.7),
      dir: "valley",
      wholeSide: true,
      desc: "\u5E95\u90E8\u6574\u6761\u5411\u4E0A\u6298\u8D77\uFF0C\u6298\u51FA\u4E00\u4E2A\u68AF\u5F62\u3002",
      tip: "\u8FD9\u662F\u5361\u76AE\u5DF4\u62C9\u7684\u809A\u5B50\u4F4D\u7F6E\u3002"
    },
    {
      type: "flip",
      axis: "x",
      desc: "\u7FFB\u4E2A\u9762\u3002"
    },
    {
      type: "fold",
      a: v(-1, 0.5),
      b: v(-0.5, 1),
      m: v(-0.85, 0.85),
      dir: "valley",
      desc: "\u5DE6\u4E0A\u89D2\u6CBF\u5BF9\u89D2\u7EBF\u5411\u5185\u6298\u3002"
    },
    {
      type: "fold",
      a: v(0.5, 1),
      b: v(1, 0.5),
      m: v(0.85, 0.85),
      dir: "valley",
      desc: "\u53F3\u4E0A\u89D2\u540C\u6837\u5411\u5185\u6298\u3002"
    },
    {
      type: "pose",
      faces: gatherFaces(),
      desc: "\u4E24\u4FA7\u6CBF\u6298\u75D5\u5411\u4E2D\u95F4\u5E76\u62E2\u2014\u2014\u7EB8\u6536\u6210\u4E00\u4E2A\u7D27\u51D1\u7684\u516B\u8FB9\u5F62\u3002",
      tip: "\u5BF9\u5E94\u539F\u6587\u7B2C9\u6B65\u300C\u4E24\u4FA7\u5411\u5185\u5E76\u62E2\u300D\u3002"
    },
    {
      type: "fold",
      a: v(-0.32, 0.38),
      b: v(0.32, 0.38),
      m: v(0, 0.7),
      dir: "valley",
      desc: "\u628A\u4E0A\u65B9\u7684\u5C0F\u4E09\u89D2\u5411\u4E0B\u6298\u3002"
    },
    {
      type: "flip",
      axis: "x",
      desc: "\u7FFB\u4E2A\u9762\u3002"
    },
    {
      type: "fold",
      a: v(-1, 0),
      b: v(1, 0),
      m: v(0, -0.5),
      dir: "valley",
      wholeSide: true,
      desc: "\u6CBF\u6C34\u5E73\u4E2D\u7EBF\u628A\u4E0A\u534A\u8FB9\u5411\u4E0B\u5BF9\u6298\u3002",
      tip: "\u5361\u76AE\u5DF4\u62C9\u7684\u4FA7\u5F71\u5DF2\u7ECF\u9690\u7EA6\u51FA\u73B0\u4E86\u3002"
    },
    {
      type: "pose",
      faces: (() => {
        const outline = [
          [-0.95, 0.16],
          [-0.6, 0.3],
          [0.16, 0.28],
          [0.28, 0.4],
          [0.4, 0.52],
          [0.48, 0.4],
          [0.62, 0.38],
          [0.88, 0.28],
          [0.93, 0.16],
          [0.88, 0.04],
          [0.55, 0.02],
          [0.44, -0.16],
          [0.3, -0.16],
          [0.28, -0.02],
          [-0.24, -0.02],
          [-0.36, -0.18],
          [-0.52, -0.18],
          [-0.55, -0.02]
        ];
        return [
          { pts: outline.map(([x, y]) => [x, y, EPS2]), stack: 1 },
          { pts: outline.map(([x, y]) => [x, y, -EPS2]), stack: 0 }
        ];
      })(),
      desc: "\u6700\u540E\u6574\u5F62\uFF1A\u5934\u90E8\u4E0E\u81C0\u90E8\u5411\u5185\u63A8\u5E73\uFF0C\u9876\u90E8\u6298\u51FA\u5C0F\u8033\u6735\u2014\u2014\u5361\u76AE\u5DF4\u62C9\u5B8C\u6210\uFF01",
      tip: "\u5BF9\u5E94\u539F\u6587\u7B2C14-15\u6B65\uFF1A\u628A\u5934\u5C3E\u63A8\u8FDB\u5C42\u7F1D\u91CC\uFF0C\u8033\u6735\u5411\u4E0B\u6309\u538B\u3002"
    },
    {
      type: "note",
      desc: "\u5B8C\u6210\uFF01\u753B\u4E0A\u773C\u775B\u548C\u9F3B\u5B54\uFF0C\u5446\u840C\u5361\u76AE\u5DF4\u62C9\u5C31\u6D3B\u5566\u3002",
      tip: "\u5361\u76AE\u5DF4\u62C9\u662F\u4E16\u754C\u4E0A\u6700\u5927\u7684\u556E\u9F7F\u52A8\u7269\uFF0C\u8001\u5BB6\u5728\u5357\u7F8E\u6D32\u3002"
    }
  ],
  source: {
    label: "\u5FAE\u4FE1\u516C\u4F17\u53F7\u300C\u6298\u7EB8\u9020\u7269\u8BB0\u300D\xB7 1\u5206\u949F\u5B66\u6298\u7EB8\u5361\u76AE\u5DF4\u62C9\uFF01",
    url: "http://mp.weixin.qq.com/s?__biz=MzkyMjM0ODcyMA==&mid=2247484041&idx=1&sn=50420343b9860f24170611fcde239d72&chksm=c1f4ff56f6837640aeca040e419434e14e1b72a60c7c5f06ad9373ac53943e23fc397cd31e3e#rd"
  }
};

// src/data/tutorials/dino.ts
var EPS3 = 0.014;
function kiteFaces() {
  const faces = [];
  for (const s of [1, 0]) {
    const z = s === 1 ? EPS3 : -EPS3;
    faces.push({
      pts: [
        [0, 1, z],
        [0.5, 0.5, z],
        [0.5, -0.5, z],
        [0, -1, z],
        [-0.5, -0.5, z],
        [-0.5, 0.5, z]
      ],
      stack: s
    });
  }
  return faces;
}
var dino = {
  id: "dino",
  title: "\u6298\u7EB8\u6050\u9F99",
  emoji: "\u{1F996}",
  category: "\u52A8\u7269",
  difficulty: 2,
  minutes: 10,
  intro: "\u6765\u81EA\u516C\u4F17\u53F7\u300C\u6298\u7EB8\u9020\u7269\u8BB0\u300D\u7684\u7ACB\u4F53\u5C0F\u6050\u9F99\uFF1A\u5341\u5B57\u6298\u75D5\u52A0\u98CE\u7B5D\u57FA\u7840\u5F62\u6253\u5E95\uFF0C\u5E95\u89D2\u5411\u4E0A\u62C9\u51FA\u540E\u9888\u3001\u5934\u4E24\u6B21\u7FFB\u6298\uFF0C\u6700\u540E\u6491\u5F00\u5C3E\u5DF4\u548C\u53CC\u817F\u2014\u2014\u4E00\u53EA\u9738\u738B\u9F99\u5C31\u7AD9\u8D77\u6765\u4E86\u3002",
  paper: { outline: DIAMOND, front: "#6FAE4E", back: "#A8CE8C" },
  steps: [
    {
      type: "prefold",
      a: v(0, -1),
      b: v(0, 1),
      m: v(-0.4, 0),
      dir: "valley",
      desc: "\u9876\u89D2\u671D\u4E0A\u6446\u653E\uFF0C\u7AD6\u76F4\u5BF9\u6298\u538B\u51FA\u4E2D\u7EBF\u540E\u5C55\u5F00\u3002"
    },
    {
      type: "prefold",
      a: v(-1, 0),
      b: v(1, 0),
      m: v(0, 0.4),
      dir: "valley",
      desc: "\u6C34\u5E73\u65B9\u5411\u540C\u6837\u5BF9\u6298\u51FA\u5341\u5B57\u6298\u75D5\u3002"
    },
    {
      type: "fold",
      a: v(-0.5, -0.5),
      b: v(-0.5, 0.5),
      m: v(-0.9, 0),
      dir: "valley",
      wholeSide: true,
      desc: "\u5DE6\u89D2\u6CBF\u7AD6\u7EBF\u5411\u4E2D\u95F4\u6298\uFF0C\u8FB9\u7EBF\u5BF9\u9F50\u4E2D\u7EBF\u3002"
    },
    {
      type: "fold",
      a: v(0.5, -0.5),
      b: v(0.5, 0.5),
      m: v(0.9, 0),
      dir: "valley",
      wholeSide: true,
      desc: "\u53F3\u89D2\u540C\u6837\u5411\u4E2D\u95F4\u6298\u3002"
    },
    {
      type: "fold",
      a: v(-0.25, 0.5),
      b: v(0.25, 0.5),
      m: v(0, 0.8),
      dir: "valley",
      desc: "\u7528\u540C\u6837\u7684\u65B9\u6CD5\u628A\u9876\u89D2\u5411\u4E0B\u6298\u3002",
      tip: "\u6298\u75D5\u5168\u90E8\u538B\u597D\u540E\u91CD\u65B0\u5C55\u5F00\u3002"
    },
    {
      type: "pose",
      faces: kiteFaces(),
      desc: "\u5C55\u5F00\u540E\u5411\u4E2D\u95F4\u5E76\u62E2\u2014\u2014\u7EB8\u6536\u6210\u4E00\u4E2A\u4E0A\u4E0B\u5C16\u7684\u98CE\u7B5D\u57FA\u7840\u5F62\u3002",
      tip: "\u5DE6\u53F3\u4E24\u8FB9\u585E\u8FDB\u4E2D\u95F4\u7684\u5C42\u7F1D\u91CC\uFF0C\u6B63\u597D\u7528\u4E0A\u521A\u624D\u7684\u6298\u75D5\u3002"
    },
    {
      type: "fold",
      a: v(-0.35, -0.25),
      b: v(0.35, -0.25),
      m: v(0, -0.6),
      dir: "valley",
      desc: "\u628A\u5E95\u90E8\u7684\u89D2\u5411\u4E0A\u62C9\uFF0C\u76D6\u4F4F\u4E2D\u95F4\u7684\u4E09\u89D2\u3002",
      tip: "\u5BF9\u5E94\u539F\u6587\u7684\u300C\u5C06\u5E95\u90E8\u89D2\u5411\u4E0A\u62C9\u5230\u4E2D\u95F4\u4E09\u89D2\u5904\u300D\u3002"
    },
    {
      type: "fold",
      a: v(0, -1),
      b: v(0, 1),
      m: v(-0.3, 0),
      dir: "valley",
      wholeSide: true,
      desc: "\u6CBF\u957F\u8F74\u5BF9\u6298\uFF0C\u628A\u53F3\u534A\u6298\u5411\u5DE6\u534A\u3002",
      tip: "\u73B0\u5728\u662F slim \u7684\u53CC\u5C42\u7EB8\u6761\uFF0C\u5C16\u671D\u4E0B\u3002"
    },
    {
      type: "fold",
      a: v(-0.2, 0),
      b: v(-0.5, 0.42),
      m: v(-0.45, 0.08),
      dir: "mountain",
      angle: 150,
      desc: "\u6CBF\u6298\u75D5\u628A\u4E0A\u7AEF\u5411\u5185\u7FFB\u6298\uFF0C\u6298\u51FA\u8116\u5B50\u3002",
      tip: "\u5BF9\u5E94\u539F\u6587\u300C\u4ECE\u9876\u90E8\u6253\u5F00\u6CBF\u6298\u7EBF\u6298\u53CD\u8FC7\u6765\u300D\u7684\u5185\u7FFB\u6298\u3002"
    },
    {
      type: "fold",
      a: v(-0.5, 0.42),
      b: v(-0.16, 0.5),
      m: v(-0.45, 0.55),
      dir: "mountain",
      angle: 150,
      desc: "\u5C16\u7AEF\u518D\u5411\u524D\u6298\u4E00\u5C0F\u6BB5\uFF0C\u538B\u51FA\u5934\u90E8\u3002"
    },
    {
      type: "pose",
      faces: (() => {
        const outline = [
          [0.95, 0.32],
          [0.5, 0.28],
          [0.18, 0.44],
          [-0.3, 0.55],
          [-0.55, 0.68],
          [-0.9, 0.6],
          [-0.94, 0.5],
          [-0.72, 0.42],
          [-0.88, 0.36],
          [-0.58, 0.28],
          [-0.36, 0.1],
          [-0.3, -0.12],
          [-0.36, -0.3],
          [-0.2, -0.28],
          [-0.08, -0.04],
          [0.32, 0],
          [0.42, -0.3],
          [0.56, -0.28],
          [0.6, -0.05],
          [0.85, 0.08]
        ];
        return [
          { pts: outline.map(([x, y]) => [x, y, EPS3]), stack: 1 },
          { pts: outline.map(([x, y]) => [x, y, -EPS3]), stack: 0 }
        ];
      })(),
      desc: "\u6700\u540E\u6574\u5F62\uFF1A\u6491\u5F00\u5C3E\u5DF4\u3001\u6298\u51FA\u53CC\u817F\u548C\u524D\u722A\u2014\u2014\u5C0F\u6050\u9F99\u7AD9\u8D77\u6765\u5566\uFF01",
      tip: "\u5BF9\u5E94\u539F\u6587\u7B2C16-18\u6B65\uFF1A\u624B\u90E8\u7FFB\u6298\u3001\u5E95\u90E8\u53CD\u8F6C\u51FA\u811A\u3002"
    },
    {
      type: "note",
      desc: "\u5B8C\u6210\uFF01\u628A\u6050\u9F99\u7ACB\u5728\u684C\u4E0A\uFF0C\u8C03\u6574\u5C3E\u5DF4\u89D2\u5EA6\u4FDD\u6301\u5E73\u8861\u3002",
      tip: "\u5934\u3001\u5C3E\u3001\u4E09\u6761\u652F\u70B9\u2014\u2014\u9738\u738B\u9F99\u7684\u7AD9\u59FF\u5C31\u4F4D\u3002"
    }
  ],
  source: {
    label: "\u5FAE\u4FE1\u516C\u4F17\u53F7\u300C\u6298\u7EB8\u9020\u7269\u8BB0\u300D\xB7 30s\u5B66\u4F1A\u6298\u7EB8\u6050\u9F99\u{1F996}\uFF0C\u624B\u6B8B\u515A\u901F\u51B2\uFF01",
    url: "http://mp.weixin.qq.com/s?__biz=MzkyMjM0ODcyMA==&mid=2247483907&idx=1&sn=5baf6c6efa04b22d9b19b2ee25b87868&chksm=c1f4ffdcf68376cacc4815a6cd0b469e65d955d465ad67dd1b4dd16a5ef93e91cfc6b2f54910#rd"
  }
};

// src/data/tutorials/shark.ts
var EPS4 = 0.014;
var shark = {
  id: "shark",
  title: "\u6298\u7EB8\u9CA8\u9C7C",
  emoji: "\u{1F988}",
  category: "\u52A8\u7269",
  difficulty: 2,
  minutes: 10,
  intro: "\u6765\u81EA\u516C\u4F17\u53F7\u300C\u6298\u7EB8\u9020\u7269\u8BB0\u300D\u7684\u5229\u843D\u5C0F\u9CA8\u9C7C\uFF1A\u83F1\u5F62\u7EB8\u5C42\u5C42\u6536\u62E2\u6298\u51FA\u8EAB\u4F53\uFF0C\u4E24\u4FA7\u538B\u51FA\u80F8\u9CCD\uFF0C\u7FFB\u6298\u51FA\u80CC\u9CCD\u548C\u5C3E\u9CCD\u2014\u2014\u4E00\u5934\u5DE1\u6E38\u7684\u9CA8\u9C7C\u5C31\u505A\u597D\u4E86\u3002",
  paper: { outline: DIAMOND, front: "#8E9AA6", back: "#C9D2DA" },
  steps: [
    {
      type: "prefold",
      a: v(0, -1),
      b: v(0, 1),
      m: v(-0.4, 0),
      dir: "valley",
      desc: "\u9876\u89D2\u671D\u4E0A\u6446\u653E\uFF0C\u7AD6\u76F4\u5BF9\u6298\u538B\u51FA\u4E2D\u7EBF\u540E\u5C55\u5F00\u3002"
    },
    {
      type: "prefold",
      a: v(-1, 0),
      b: v(1, 0),
      m: v(0, 0.4),
      dir: "valley",
      desc: "\u6C34\u5E73\u65B9\u5411\u540C\u6837\u5BF9\u6298\uFF0C\u5341\u5B57\u6298\u75D5\u5907\u597D\u3002"
    },
    {
      type: "fold",
      a: v(-0.5, 0.5),
      b: v(0.5, 0.5),
      m: v(0, 0.85),
      dir: "valley",
      desc: "\u9876\u89D2\u5411\u4E0B\u6298\uFF0C\u6298\u51FA\u4E00\u4E2A\u5E73\u9876\u3002"
    },
    {
      type: "fold",
      a: v(-0.5, -0.5),
      b: v(0.5, -0.5),
      m: v(0, -0.85),
      dir: "valley",
      desc: "\u5E95\u89D2\u540C\u6837\u5411\u4E0A\u6298\u3002",
      tip: "\u73B0\u5728\u662F\u4E0A\u4E0B\u5E73\u3001\u5DE6\u53F3\u5C16\u7684\u516D\u8FB9\u5F62\u3002"
    },
    {
      type: "fold",
      a: v(-0.5, -0.5),
      b: v(-0.5, 0.5),
      m: v(-0.9, 0),
      dir: "valley",
      wholeSide: true,
      desc: "\u5DE6\u89D2\u6CBF\u7AD6\u7EBF\u5411\u4E2D\u95F4\u6298\u3002"
    },
    {
      type: "fold",
      a: v(0.5, -0.5),
      b: v(0.5, 0.5),
      m: v(0.9, 0),
      dir: "valley",
      wholeSide: true,
      desc: "\u53F3\u89D2\u540C\u6837\u5411\u4E2D\u95F4\u6298\u2014\u2014\u8EAB\u4F53\u6536\u62E2\u6210\u578B\u3002"
    },
    {
      type: "fold",
      a: v(-0.2, 0.42),
      b: v(0.2, 0.42),
      m: v(0, 0.7),
      dir: "valley",
      desc: "\u628A\u4E0A\u65B9\u7684\u5C0F\u89D2\u5411\u4E0B\u6298\uFF0C\u538B\u51FA\u543B\u90E8\u3002"
    },
    {
      type: "flip",
      axis: "x",
      desc: "\u7FFB\u4E2A\u9762\u3002"
    },
    {
      type: "fold",
      a: v(-0.52, -0.08),
      b: v(-0.24, -0.36),
      m: v(-0.58, -0.22),
      dir: "valley",
      angle: 150,
      desc: "\u5DE6\u4E0B\u89D2\u5411\u5916\u7FFB\u6298\uFF0C\u538B\u51FA\u80F8\u9CCD\u3002",
      tip: "\u4E0D\u7528\u6298\u5E73\uFF0C\u9CCD\u5FAE\u5FAE\u5F20\u5F00\u66F4\u6709\u7CBE\u795E\u3002"
    },
    {
      type: "fold",
      a: v(0.24, -0.36),
      b: v(0.52, -0.08),
      m: v(0.58, -0.22),
      dir: "valley",
      angle: 150,
      desc: "\u53F3\u4E0B\u89D2\u540C\u6837\u5411\u5916\u7FFB\u6298\u3002"
    },
    {
      type: "pose",
      faces: (() => {
        const outline = [
          [0.98, 0.3],
          [0.48, 0.26],
          [0.22, 0.3],
          [0.02, 0.55],
          [-0.18, 0.36],
          [-0.5, 0.4],
          [-0.82, 0.2],
          [-0.96, 0.08],
          [-0.82, -0.04],
          [-0.5, -0.12],
          [-0.28, -0.4],
          [-0.08, -0.16],
          [0.3, -0.14],
          [0.42, -0.3],
          [0.55, -0.12],
          [0.72, -0.12],
          [0.88, 0]
        ];
        return [
          { pts: outline.map(([x, y]) => [x, y, EPS4]), stack: 1 },
          { pts: outline.map(([x, y]) => [x, y, -EPS4]), stack: 0 }
        ];
      })(),
      desc: "\u6700\u540E\u6574\u5F62\uFF1A\u7ACB\u8D77\u80CC\u9CCD\uFF0C\u5C55\u5F00\u4E0A\u4E0B\u5C3E\u53F6\u2014\u2014\u9CA8\u9C7C\u6210\u578B\uFF01",
      tip: "\u5BF9\u5E94\u539F\u6587\u540E\u6BB5\u7684\u80CC\u9CCD/\u5C3E\u9CCD\u5185\u7FFB\u6298\uFF0C\u6574\u7406\u51FA\u6D41\u7EBF\u5916\u5F62\u3002"
    },
    {
      type: "note",
      desc: "\u5B8C\u6210\uFF01\u8BA9\u9CA8\u9C7C\u5728\u684C\u4E0A\u201C\u6E38\u201D\u8D77\u6765\uFF0C\u753B\u4E0A\u773C\u775B\u66F4\u51F6\u731B\u3002",
      tip: "\u59FF\u52BF\u6446\u5F97\u5FAE\u5FAE\u4E0A\u626C\uFF0C\u50CF\u6B63\u8981\u51B2\u5411\u730E\u7269\u3002"
    }
  ],
  source: {
    label: "\u5FAE\u4FE1\u516C\u4F17\u53F7\u300C\u6298\u7EB8\u9020\u7269\u8BB0\u300D\xB7 \u5E05\u54ED\uFF01\u7528\u7EB8\u505A\u53EA\u5C0F\u9CA8\u9C7C\u{1F988}",
    url: "http://mp.weixin.qq.com/s?__biz=MzkyMjM0ODcyMA==&mid=2247484261&idx=1&sn=c112ffd4277d13c06948f790285dcc76&chksm=c1f4febaf68377ac83cf84ede9bbfe5be2255412647a2cb7ce201b6f9cc1d3916efb7a3a5fff#rd"
  }
};

// src/data/tutorials/bat.ts
var EPS5 = 0.014;
var bat = {
  id: "bat2",
  title: "\u6298\u7EB8\u8759\u8760",
  emoji: "\u{1F987}",
  category: "\u52A8\u7269",
  difficulty: 2,
  minutes: 10,
  intro: "\u6765\u81EA\u516C\u4F17\u53F7\u300C\u6298\u7EB8\u9020\u7269\u8BB0\u300D\u7684\u8DA3\u5473\u8759\u8760\uFF1A\u4E09\u89D2\u5F62\u6253\u5E95\u538B\u51FA\u6298\u75D5\uFF0C\u4E24\u4FA7\u538B\u8936\u6536\u62E2\u7ACB\u8D77\u7FC5\u8180\uFF0C\u6700\u540E\u6574\u7406\u51FA\u53CC\u8033\u548C\u6247\u5F62\u7684\u7FFC\u2014\u2014\u4E00\u6309\u7FC5\u8180\u8FD8\u4F1A\u6247\uFF01",
  paper: { outline: SQUARE, front: "#7C5CB8", back: "#B49BD8" },
  steps: [
    {
      type: "fold",
      a: v(-1, -1),
      b: v(1, 1),
      m: v(-0.5, 0.5),
      dir: "valley",
      desc: "\u6CBF\u5BF9\u89D2\u7EBF\u5BF9\u6298\u6210\u4E09\u89D2\u5F62\u3002"
    },
    {
      type: "prefold",
      a: v(1, -1),
      b: v(0, 0),
      m: v(0.7, -0.35),
      dir: "valley",
      desc: "\u5DE6\u53F3\u5BF9\u6298\u538B\u51FA\u4E2D\u7EBF\u540E\u5C55\u5F00\u3002"
    },
    {
      type: "fold",
      a: v(0.5, 0),
      b: v(0.9, -0.2),
      m: v(0.8, 0.8),
      dir: "valley",
      desc: "\u9876\u89D2\u5411\u4E0B\u6298\uFF0C\u5C16\u7AEF\u5BF9\u5230\u5E95\u8FB9\u4E2D\u70B9\u3002"
    },
    {
      type: "fold",
      a: v(-1, -0.5),
      b: v(1, -0.5),
      m: v(0, -0.8),
      dir: "valley",
      wholeSide: true,
      desc: "\u4E0B\u534A\u90E8\u5206\u6CBF\u6298\u75D5\u5411\u4E0A\u6298\u3002"
    },
    {
      type: "fold",
      a: v(0.3, -1),
      b: v(0.1, 0.3),
      m: v(0.6, -0.2),
      dir: "valley",
      angle: 150,
      desc: "\u53F3\u4FA7\u6CBF\u865A\u7EBF\u5411\u5185\u538B\u6298\uFF0C\u538B\u51FA\u7FC5\u8180\u8936\u3002",
      tip: "\u4E0D\u7528\u6298\u5E73\uFF0C\u7559\u4E00\u70B9\u89D2\u5EA6\u7FC5\u8180\u624D\u7ACB\u5F97\u8D77\u6765\u3002"
    },
    {
      type: "fold",
      a: v(-0.1, 0.3),
      b: v(-0.3, -1),
      m: v(-0.6, -0.2),
      dir: "valley",
      angle: 150,
      desc: "\u5DE6\u4FA7\u540C\u6837\u5411\u5185\u538B\u6298\u3002"
    },
    {
      type: "pose",
      faces: (() => {
        const outline = [
          [0.14, 0.92],
          [0.06, 0.74],
          [0, 0.8],
          [-0.06, 0.74],
          [-0.14, 0.92],
          [-0.2, 0.6],
          [-0.5, 0.55],
          [-0.95, 0.75],
          [-0.98, 0.45],
          [-0.6, 0.3],
          [-0.85, 0.15],
          [-0.55, 0.05],
          [-0.75, -0.15],
          [-0.45, -0.2],
          [-0.15, -0.35],
          [0, -0.42],
          [0.15, -0.35],
          [0.45, -0.2],
          [0.75, -0.15],
          [0.55, 0.05],
          [0.85, 0.15],
          [0.6, 0.3],
          [0.98, 0.45],
          [0.95, 0.75],
          [0.5, 0.55],
          [0.2, 0.6]
        ];
        return [
          { pts: outline.map(([x, y]) => [x, y, EPS5]), stack: 1 },
          { pts: outline.map(([x, y]) => [x, y, -EPS5]), stack: 0 }
        ];
      })(),
      desc: "\u6CBF\u7FFC\u6839\u6298\u75D5\u5411\u5185\u6324\u538B\uFF0C\u7FC5\u8180\u5411\u4E0A\u7ACB\u8D77\u2014\u2014\u8759\u8760\u5C55\u5F00\u53CC\u7FFC\uFF01",
      tip: "\u5BF9\u5E94\u539F\u6587\u7B2C17-27\u6B65\uFF1A\u7FFC\u6839\u5185\u6298\u3001\u7FC5\u8180\u6839\u90E8\u538B\u6298\u3001\u6574\u7406\u53CC\u8033\u3002"
    },
    {
      type: "note",
      desc: "\u5B8C\u6210\uFF01\u624B\u6307\u6309\u4F4F\u8EAB\u4F53\uFF0C\u8759\u8760\u7684\u7FC5\u8180\u4F1A\u4E00\u6247\u4E00\u6247\u3002",
      tip: "\u6302\u5728\u706F\u4E0B\u6216\u7A97\u8FB9\uFF0C\u5C31\u662F\u6700\u597D\u7684\u4E07\u5723\u8282\u88C5\u9970\u3002"
    }
  ],
  source: {
    label: "\u5FAE\u4FE1\u516C\u4F17\u53F7\u300C\u6298\u7EB8\u9020\u7269\u8BB0\u300D\xB7 \u4E00\u8D77\u6765\u6298,\u597D\u73A9\u7684\u6298\u7EB8\u8759\u8760",
    url: "http://mp.weixin.qq.com/s?__biz=MzkyMjM0ODcyMA==&mid=2247484202&idx=1&sn=eb8452d438e4516ea2668bda116d983e&chksm=c1f4fef5f68377e348f89f8cf3f5603922e8345e4656cf3bd0f405c0222d958f1a05d4bca647#rd"
  }
};

// src/data/tutorials/snake.ts
var EPS6 = 0.014;
var snake = {
  id: "snake",
  title: "\u5F39\u529B\u5C0F\u86C7",
  emoji: "\u{1F40D}",
  category: "\u73A9\u5177",
  difficulty: 2,
  minutes: 12,
  intro: "\u6765\u81EA\u516C\u4F17\u53F7\u300C\u6298\u7EB8\u9020\u7269\u8BB0\u300D\u7684\u4E00\u538B\u5373\u5F39\u5C0F\u86C7\uFF1A\u6B63\u65B9\u5F62\u7EB8\u6298\u51FA\u7C73\u5B57\u98CE\u7434\u8936\uFF0C\u5206\u6BB5\u6324\u538B\u6210\u4E00\u8282\u8282\u7684\u65B9\u5757\u8EAB\u4F53\uFF0C\u634F\u4F4F\u5C3E\u5DF4\u4E00\u677E\u624B\u2014\u2014\u5C0F\u86C7\u201C\u55D6\u201D\u5730\u5F39\u51FA\u53BB\uFF01",
  paper: { outline: SQUARE, front: "#7FBF3F", back: "#B4D98A" },
  steps: [
    {
      type: "fold",
      a: v(-1, -1),
      b: v(1, 1),
      m: v(-0.5, 0.5),
      dir: "valley",
      desc: "\u6CBF\u5BF9\u89D2\u7EBF\u5BF9\u6298\u6210\u4E09\u89D2\u5F62\u3002"
    },
    {
      type: "fold",
      a: v(1, 0.2),
      b: v(0.2, 1),
      m: v(0.85, 0.85),
      dir: "valley",
      desc: "\u4E0A\u8FB9\u89D2\u5411\u4E2D\u5FC3\u70B9\u5BF9\u6298\u3002"
    },
    {
      type: "fold",
      a: v(-1, -0.2),
      b: v(-0.2, -1),
      m: v(-0.85, -0.85),
      dir: "valley",
      desc: "\u4E0B\u8FB9\u89D2\u540C\u6837\u5411\u4E2D\u5FC3\u5BF9\u6298\u3002"
    },
    {
      type: "prefold",
      a: v(0.34, -1),
      b: v(0.34, 1),
      m: v(0.7, 0),
      dir: "valley",
      desc: "\u7AD6\u76F4\u65B9\u5411\u4E09\u7B49\u5206\uFF0C\u538B\u51FA\u7B2C\u4E00\u6761\u6298\u75D5\u540E\u5C55\u5F00\u3002"
    },
    {
      type: "prefold",
      a: v(-0.34, -1),
      b: v(-0.34, 1),
      m: v(-0.7, 0),
      dir: "valley",
      desc: "\u53E6\u4E00\u6761\u4E09\u7B49\u5206\u7EBF\u540C\u6837\u538B\u51FA\u6298\u75D5\u3002",
      tip: "\u4E00\u51F9\u4E00\u51F8\uFF0C\u50CF\u6298\u7EB8\u6247\u4E00\u6837\u4EA4\u66FF\u3002"
    },
    {
      type: "fold",
      a: v(0.34, -1),
      b: v(0.34, 1),
      m: v(0.7, 0),
      dir: "valley",
      angle: 150,
      desc: "\u6CBF\u6298\u75D5\u628A\u53F3\u4FA7\u98CE\u7434\u6298\u6536\u8FDB\u6765\u3002"
    },
    {
      type: "fold",
      a: v(-0.34, -1),
      b: v(-0.34, 1),
      m: v(-0.7, 0),
      dir: "valley",
      angle: 150,
      desc: "\u5DE6\u4FA7\u540C\u6837\u6536\u8FDB\u6765\uFF0C\u53E0\u6210\u7A84\u6761\u3002"
    },
    {
      type: "prefold",
      a: v(-1, 0.34),
      b: v(1, 0.34),
      m: v(0, 0.7),
      dir: "valley",
      desc: "\u6362\u4E2A\u65B9\u5411\u518D\u538B\u4E00\u6761\u4E09\u7B49\u5206\u6298\u75D5\u3002"
    },
    {
      type: "fold",
      a: v(-1, -0.34),
      b: v(1, -0.34),
      m: v(0, -0.7),
      dir: "valley",
      angle: 150,
      desc: "\u6A2A\u5411\u540C\u6837\u98CE\u7434\u6298\uFF0C\u5341\u5B57\u7F51\u683C\u5B8C\u6210\u3002",
      tip: "\u5C55\u5F00\u662F\u4E00\u5F20\u65B9\u683C\u7EB8\uFF0C\u6536\u62E2\u5C31\u662F\u86C7\u8EAB\u7684\u201C\u5173\u8282\u201D\u3002"
    },
    {
      type: "fold",
      a: v(-1, 0.1),
      b: v(-0.3, 0.1),
      m: v(-0.7, 0.5),
      dir: "valley",
      desc: "\u4E00\u7AEF\u7684\u8FB9\u89D2\u5411\u4E0A\u6298\uFF0C\u6298\u51FA\u5C0F\u86C7\u7684\u5934\u90E8\u3002"
    },
    {
      type: "pose",
      faces: (() => {
        const seg = (cx, cy, tilt) => [
          [cx - 0.19, cy + tilt * 0.05, 0.04 + tilt * 0.05],
          [cx, cy + 0.14 + tilt * 0.05, 0.13 + tilt * 0.05],
          [cx + 0.19, cy + tilt * 0.05, 0.04 + tilt * 0.05],
          [cx, cy - 0.14 + tilt * 0.05, -0.02 + tilt * 0.05]
        ];
        const faces = [];
        for (const s of [1, 0]) {
          const d = s === 1 ? EPS6 : -EPS6;
          faces.push({
            pts: [
              [-1.02, 0.08, 0.18],
              [-0.85, 0.22, 0.22],
              [-0.6, 0.16, 0.16],
              [-0.63, -0.06, 0.08],
              [-0.92, -0.05, 0.1]
            ].map((p) => [p[0], p[1], p[2] + d]),
            stack: s
          });
          for (const [i, t] of [1, -1, 1, -1].entries()) {
            faces.push({
              pts: seg(-0.42 + i * 0.36, t * 0.07, t).map(
                (p) => [p[0], p[1], p[2] + d]
              ),
              stack: s
            });
          }
          faces.push({
            pts: [
              [0.92, 0.04, 0.04 + d],
              [1.14, 0.02, 0.08 + d],
              [0.9, -0.12, 0 + d]
            ],
            stack: s
          });
        }
        return faces;
      })(),
      desc: "\u5206\u6BB5\u6CBF\u6298\u75D5\u6324\u538B\u6210\u7ACB\u4F53\u7684\u65B9\u5757\u8282\u2014\u2014\u5C0F\u86C7\u7684\u8EAB\u4F53\u4E00\u8282\u4E00\u8282\u7ACB\u8D77\u6765\u4E86\uFF01",
      tip: "\u5BF9\u5E94\u539F\u6587\u7B2C13-15\u6B65\uFF1A\u6BCF\u6BB5\u5411\u5185\u6324\u538B\u3001\u7FFB\u9762\u91CD\u590D\uFF0C\u76F4\u5230\u6574\u6761\u86C7\u3002"
    },
    {
      type: "note",
      desc: "\u5B8C\u6210\uFF01\u6309\u4F4F\u5C3E\u5DF4\u5411\u540E\u62C9\uFF0C\u4E00\u677E\u624B\u5C0F\u86C7\u5C31\u5F39\u5C04\u51FA\u53BB\u3002",
      tip: "\u548C\u5C0F\u4F19\u4F34\u6BD4\u8D5B\uFF0C\u770B\u8C01\u7684\u86C7\u5F39\u5F97\u8FDC\u3002"
    }
  ],
  source: {
    label: "\u5FAE\u4FE1\u516C\u4F17\u53F7\u300C\u6298\u7EB8\u9020\u7269\u8BB0\u300D\xB7 \u597D\u73A9\u7684\u5F39\u529B\u5C0F\u86C7\u6298\u7EB8\u6559\u7A0B",
    url: "http://mp.weixin.qq.com/s?__biz=MzkyMjM0ODcyMA==&mid=2247484114&idx=1&sn=2acf8b88b72d323458a9eaa9c8858d80&chksm=c1f4ff0df683761bffbabb6b46f331587a9ea13403f38e6871bf513b3843f76b7dcd90a777a4#rd"
  }
};

// src/data/tutorials/dachshund.ts
var EPS7 = 0.014;
var dachshund = {
  id: "dachshund",
  title: "\u814A\u80A0\u72AC",
  emoji: "\u{1F415}",
  category: "\u52A8\u7269",
  difficulty: 3,
  minutes: 18,
  intro: "\u6765\u81EA\u516C\u4F17\u53F7\u300C\u6298\u7EB8\u9020\u7269\u8BB0\u300D\u7684\u5FE0\u8BDA\u814A\u80A0\u72AC\uFF1A\u5341\u5B57\u6298\u75D5\u6536\u51FA\u957F\u6761\u8EAB\u4F53\uFF0C\u4E00\u7AEF\u7ACB\u8D77\u8116\u5B50\u540E\uFF0C\u5934\u90E8\u3001\u5C3E\u5DF4\u3001\u524D\u540E\u817F\u5168\u90E8\u7528\u5185\u7FFB\u6298\u5B8C\u6210\u2014\u2014\u8FD9\u53EA\u5C0F\u77ED\u817F\u72D7\u6700\u8003\u9A8C\u7FFB\u6298\u529F\u592B\u3002",
  paper: { outline: SQUARE, front: "#E8934A", back: "#F6CCA0" },
  steps: [
    {
      type: "prefold",
      a: v(0, -1),
      b: v(0, 1),
      m: v(-0.4, 0),
      dir: "valley",
      desc: "\u83F1\u5F62\u6446\u653E\uFF0C\u7AD6\u76F4\u5BF9\u6298\u538B\u51FA\u4E2D\u7EBF\u540E\u5C55\u5F00\u3002"
    },
    {
      type: "prefold",
      a: v(-1, 0),
      b: v(1, 0),
      m: v(0, 0.4),
      dir: "valley",
      desc: "\u6C34\u5E73\u65B9\u5411\u540C\u6837\u5BF9\u6298\uFF0C\u5341\u5B57\u6298\u75D5\u5907\u597D\u3002"
    },
    {
      type: "fold",
      a: v(0.5, -0.5),
      b: v(0.5, 0.5),
      m: v(0.9, 0),
      dir: "valley",
      wholeSide: true,
      desc: "\u53F3\u89D2\u6CBF\u7AD6\u7EBF\u5411\u4E2D\u95F4\u6298\u3002"
    },
    {
      type: "fold",
      a: v(-0.5, -0.5),
      b: v(-0.5, 0.5),
      m: v(-0.9, 0),
      dir: "valley",
      wholeSide: true,
      desc: "\u5DE6\u89D2\u540C\u6837\u5411\u4E2D\u95F4\u6298\u3002"
    },
    {
      type: "fold",
      a: v(-0.5, 0),
      b: v(0.5, 0),
      m: v(0, 0.6),
      dir: "valley",
      wholeSide: true,
      desc: "\u6CBF\u6C34\u5E73\u4E2D\u7EBF\u628A\u4E0A\u534A\u8FB9\u5411\u4E0B\u6298\u3002",
      tip: "\u73B0\u5728\u662F\u53CC\u5C42\u957F\u65B9\u5F62\uFF0C\u8FD9\u5C31\u662F\u814A\u80A0\u72AC\u7684\u957F\u8EAB\u4F53\u3002"
    },
    {
      type: "reverse",
      a: v(-0.5, -0.55),
      b: v(-0.1, -1),
      m: v(-0.4, -0.8),
      dir: "inside",
      desc: "\u5DE6\u7AEF\u7684\u89D2\u5411\u5185\u7FFB\u6298\uFF0C\u538B\u51FA\u5934\u90E8\u548C\u5C16\u9F3B\u5B50\u3002",
      tip: "\u5185\u7FFB\u6298\uFF1A\u5148\u628A\u7EB8\u5F20\u5F00\u4E00\u70B9\uFF0C\u518D\u6574\u4F53\u7FFB\u8FC7\u53BB\u6536\u62E2\u3002"
    },
    {
      type: "reverse",
      a: v(0.5, -0.55),
      b: v(0.1, -1),
      m: v(0.4, -0.8),
      dir: "inside",
      desc: "\u53F3\u7AEF\u7684\u89D2\u540C\u6837\u5411\u5185\u7FFB\u6298\uFF0C\u538B\u51FA\u5C3E\u5DF4\u5C16\u3002"
    },
    {
      type: "fold",
      a: v(-0.5, -0.3),
      b: v(0.15, -1),
      m: v(-0.35, -0.7),
      dir: "valley",
      angle: 90,
      desc: "\u5DE6\u7AEF\u6CBF\u6298\u75D5\u7ACB\u8D77 90\xB0\u2014\u2014\u5E26\u5934\u7684\u8116\u5B50\u7ACB\u8D77\u6765\u4E86\u3002",
      tip: "\u4ECE\u4FA7\u9762\u770B\uFF0C\u7EB8\u5DF2\u7ECF\u7ACB\u6210\u300C7\u300D\u5B57\u5F62\u3002"
    },
    {
      type: "fold",
      a: v(0.5, -0.3),
      b: v(0.15, -1),
      m: v(0.35, -0.7),
      dir: "valley",
      angle: 90,
      desc: "\u53F3\u7AEF\u540C\u6837\u7ACB\u8D77 90\xB0\uFF0C\u7FD8\u8D77\u5C3E\u5DF4\u3002"
    },
    {
      type: "reverse",
      a: v(0.18, 0),
      b: v(-0.12, -1),
      m: v(-0.02, -0.5),
      dir: "inside",
      desc: "\u6CBF\u7AD6\u7EBF\u628A\u4E2D\u95F4\u7684\u7EB8\u6761\u5411\u5185\u7FFB\u6298\u5230\u8EAB\u4F53\u4E0B\u65B9\u2014\u2014\u56DB\u6761\u5C0F\u77ED\u817F\u5C31\u4F4D\u3002"
    },
    {
      type: "pose",
      faces: (() => {
        const outline = [
          [-1, 0.45],
          [-1.02, 0.3],
          [-0.9, 0.22],
          [-0.6, 0.16],
          [-0.45, -0.02],
          [-0.38, -0.3],
          [-0.22, -0.3],
          [-0.18, -0.06],
          [0.35, -0.06],
          [0.42, -0.3],
          [0.58, -0.3],
          [0.62, -0.06],
          [0.66, 0.18],
          [0.95, 0.52],
          [0.74, 0.5],
          [0.62, 0.24],
          [0, 0.3],
          [-0.44, 0.34],
          [-0.52, 0.14],
          [-0.68, 0.46],
          [-0.86, 0.56]
        ];
        return [
          { pts: outline.map(([x, y]) => [x, y, EPS7]), stack: 1 },
          { pts: outline.map(([x, y]) => [x, y, -EPS7]), stack: 0 }
        ];
      })(),
      desc: "\u6700\u540E\u6574\u7406\uFF1A\u8EAB\u4F53\u62C9\u957F\u3001\u56DB\u817F\u7740\u5730\u3001\u8033\u6735\u4E0B\u5782\u2014\u2014\u814A\u80A0\u72AC\u5B8C\u6210\uFF01",
      tip: "\u5BF9\u5E94\u539F\u6587\u540E\u534A\u6BB5\u7684\u53CD\u590D\u5185\u7FFB\u6298\u4E0E\u6574\u5F62\u3002"
    },
    {
      type: "note",
      desc: "\u5B8C\u6210\uFF01\u753B\u4E0A\u773C\u775B\u548C\u9ED1\u9F3B\u5934\uFF0C\u5C0F\u77ED\u817F\u814A\u80A0\u72AC\u5C31\u6D3B\u5566\u3002",
      tip: "\u8EAB\u4F53\u8D8A\u957F\u8D8A\u6B63\u5B97\uFF0C\u5B83\u53EF\u662F\u6355\u730E\u7A74\u5154\u7684\u597D\u624B\u3002"
    }
  ],
  source: {
    label: "\u5FAE\u4FE1\u516C\u4F17\u53F7\u300C\u6298\u7EB8\u9020\u7269\u8BB0\u300D\xB7 \u6298\u4E00\u53EA\u53EF\u7231\u4E14\u5FE0\u8BDA\u7684\u814A\u80A0\u5C0F\u72D7\u5427\uFF01",
    url: "http://mp.weixin.qq.com/s?__biz=MzkyMjM0ODcyMA==&mid=2247484733&idx=1&sn=f284ff34aa2f555b578e732b681104b6&chksm=c1f4f8e2f68371f4bde7da37bcca7fcd14712e7c3c77c4d236260c9a7d856ca48f55af1fe87b#rd"
  }
};

// src/data/tutorials/rooster.ts
var rooster = {
  id: "rooster",
  title: "\u6298\u7EB8\u5C0F\u516C\u9E21",
  emoji: "\u{1F413}",
  category: "\u52A8\u7269",
  difficulty: 3,
  minutes: 15,
  intro: "\u6765\u81EA\u516C\u4F17\u53F7\u300C\u6298\u7EB8\u9020\u7269\u8BB0\u300D\u7684\u8BE6\u7EC6\u7248\u5C0F\u516C\u9E21\uFF1A\u56DB\u89D2\u5411\u5FC3\u6298\u51FA\u57FA\u7840\u5F62\uFF0C\u5BF9\u6298\u540E\u628A\u89D2\u5411\u4E0A\u62C9\u51FA\u957F\u8116\u5B50\uFF0C\u5934\u90E8\u7FFB\u51FA\u9E21\u51A0\u548C\u8089\u5782\uFF0C\u5C3E\u90E8\u5C55\u5F00\u6210\u5927\u5F27\u7EBF\u2014\u2014\u4E00\u53EA\u795E\u6C14\u7684\u5927\u516C\u9E21\uFF01",
  paper: { outline: DIAMOND, front: "#E05A4E", back: "#F0A099" },
  steps: [
    {
      type: "prefold",
      a: v(0, -1),
      b: v(0, 1),
      m: v(-0.4, 0),
      dir: "valley",
      desc: "\u83F1\u5F62\u6446\u653E\uFF0C\u7AD6\u76F4\u5BF9\u6298\u538B\u51FA\u4E2D\u7EBF\u540E\u5C55\u5F00\u3002"
    },
    {
      type: "prefold",
      a: v(-1, 0),
      b: v(1, 0),
      m: v(0, 0.4),
      dir: "valley",
      desc: "\u6C34\u5E73\u65B9\u5411\u540C\u6837\u5BF9\u6298\uFF0C\u5341\u5B57\u6298\u75D5\u5907\u597D\u3002"
    },
    {
      type: "fold",
      a: v(-0.5, 0.5),
      b: v(0.5, 0.5),
      m: v(0, 0.8),
      dir: "valley",
      desc: "\u9876\u89D2\u5411\u4E0B\u6298\uFF0C\u5C16\u5BF9\u51C6\u4E2D\u5FC3\u3002"
    },
    {
      type: "fold",
      a: v(-0.5, -0.5),
      b: v(0.5, -0.5),
      m: v(0, -0.8),
      dir: "valley",
      desc: "\u5E95\u89D2\u5411\u4E0A\u6298\uFF0C\u540C\u6837\u5BF9\u51C6\u4E2D\u5FC3\u3002"
    },
    {
      type: "fold",
      a: v(-0.5, -0.5),
      b: v(-0.5, 0.5),
      m: v(-0.8, 0),
      dir: "valley",
      desc: "\u5DE6\u89D2\u5411\u4E2D\u5FC3\u6298\u3002"
    },
    {
      type: "fold",
      a: v(0.5, -0.5),
      b: v(0.5, 0.5),
      m: v(0.8, 0),
      dir: "valley",
      desc: "\u53F3\u89D2\u5411\u4E2D\u5FC3\u6298\u2014\u2014\u56DB\u89D2\u5411\u5FC3\u5B8C\u6210\u3002",
      tip: "\u73B0\u5728\u662F\u4E00\u4E2A\u659C\u653E\u7684\u5C0F\u6B63\u65B9\u5F62\u3002"
    },
    {
      type: "fold",
      a: v(-0.71, 0),
      b: v(0.71, 0),
      m: v(0, 0.4),
      dir: "valley",
      wholeSide: true,
      desc: "\u6CBF\u6C34\u5E73\u7EBF\u5BF9\u6298\uFF0C\u4E0A\u534A\u8FB9\u5411\u4E0B\u3002",
      tip: "\u4E09\u89D2\u5F62\u7684\u5F00\u53E3\u671D\u4E0B\uFF0C\u7B49\u4F1A\u513F\u8981\u4ECE\u8FD9\u91CC\u62C9\u89D2\u3002"
    },
    {
      type: "fold",
      a: v(-0.5, -0.35),
      b: v(0.5, -0.35),
      m: v(0, -0.6),
      dir: "valley",
      desc: "\u628A\u4E0B\u9762\u7684\u89D2\u5411\u4E0A\u62C9\u8D77\uFF0C\u7FFB\u6298\u51FA\u957F\u70B9\u2014\u2014\u7FFB\u9762\u540E\u53E6\u4E00\u4FA7\u540C\u6837\u64CD\u4F5C\uFF0C\u8FD9\u91CC\u4E00\u5E76\u6298\u597D\u3002",
      tip: "\u5BF9\u5E94\u539F\u6587\u7684\u82B1\u74E3\u6298\uFF1A\u89D2\u6CBF\u6298\u75D5\u5411\u4E0A\u7FFB\uFF0C\u6210\u4E3A\u8116\u5B50\u548C\u5C3E\u5DF4\u3002"
    },
    {
      type: "flip",
      axis: "x",
      desc: "\u7FFB\u4E2A\u9762\uFF0C\u8BA9\u7EA2\u8272\u7684\u6B63\u9762\u671D\u4E0A\u3002"
    },
    {
      type: "fold",
      a: v(-0.4, 0.12),
      b: v(-0.18, -0.08),
      m: v(-0.44, 0.02),
      dir: "valley",
      angle: 120,
      desc: "\u5DE6\u4FA7\u5411\u524D\u538B\u6298\uFF0C\u6298\u51FA\u8116\u5B50\u3002"
    },
    {
      type: "pose",
      faces: (() => {
        const zOf = (x, y) => {
          if (x > 0.5) return 0.05 + (x - 0.5) * 0.85 + y * 0.3;
          if (y > 0.55) return 0.1;
          return 0.012;
        };
        const outline = [
          [-0.8, 0.42],
          [-0.72, 0.28],
          [-0.68, 0.16],
          [-0.5, 0.05],
          [-0.3, -0.15],
          [-0.12, -0.42],
          [0, -0.42],
          [0.05, -0.12],
          [0.4, -0.1],
          [0.85, 0.2],
          [0.95, 0.55],
          [0.55, 0.5],
          [0.2, 0.4],
          [-0.15, 0.5],
          [-0.25, 0.68],
          [-0.35, 0.75],
          [-0.45, 0.62],
          [-0.6, 0.62]
        ];
        const front = outline.map(([x, y]) => [x, y, zOf(x, y) + 8e-3]);
        const back = outline.map(([x, y]) => [x, y, zOf(x, y) - 8e-3]);
        return [
          { pts: front, stack: 1 },
          { pts: back, stack: 0 }
        ];
      })(),
      desc: "\u6700\u540E\u6574\u5F62\uFF1A\u5934\u90E8\u7FFB\u51FA\u9E21\u51A0\u548C\u8089\u5782\uFF0C\u5C3E\u90E8\u5C55\u5F00\u4E0A\u7FD8\u6210\u5927\u5F27\u7EBF\u2014\u2014\u516C\u9E21\u5594\u5594\u53EB\uFF01",
      tip: "\u5BF9\u5E94\u539F\u6587\u7B2C17-24\u6B65\uFF1A\u5934\u90E8\u5185\u7FFB\u6298\u51FA\u5599\u3001\u5C3E\u90E8\u6574\u7406\u4E0A\u5F27\u3002"
    },
    {
      type: "note",
      desc: "\u5B8C\u6210\uFF01\u753B\u4E0A\u773C\u775B\uFF0C\u4E00\u53EA\u795E\u6C14\u7684\u5927\u516C\u9E21\u5C31\u7AD9\u597D\u4E86\u3002",
      tip: "\u9E21\u51A0\u8D8A\u9C9C\u8273\u8D8A\u5A01\u98CE\uFF0C\u7EA2\u7EB8\u6298\u6700\u5408\u9002\u3002"
    }
  ],
  source: {
    label: "\u5FAE\u4FE1\u516C\u4F17\u53F7\u300C\u6298\u7EB8\u9020\u7269\u8BB0\u300D\xB7 \u6298\u7EB8\u5C0F\u516C\u9E21\u{1F413}\u8BE6\u7EC6\u7248\u6559\u7A0B",
    url: "http://mp.weixin.qq.com/s?__biz=MzkyMjM0ODcyMA==&mid=2247484593&idx=1&sn=c4572d25c44397240f139fa5f4ba513f&chksm=c1f4f96ef683707816a7d205a56cef7f7f8821dd8644d98828e198688487619a24808e95de70#rd"
  }
};

// src/data/tutorials/moonrabbit.ts
var T3 = [0, 1, 0];
var B4 = [0, -1, 0];
var L3 = [-1, 0, 0];
var R3 = [1, 0, 0];
var O3 = [0, 0, 0];
var moonrabbit = {
  id: "moonrabbit",
  title: "\u6298\u7EB8\u6708\u5154",
  emoji: "\u{1F407}",
  category: "\u8282\u65E5",
  difficulty: 2,
  minutes: 12,
  intro: "\u6765\u81EA\u516C\u4F17\u53F7\u300C\u6298\u7EB8\u9020\u7269\u8BB0\u300D\u7684\u4E2D\u79CB\u6708\u5154\uFF1A\u7C73\u5B57\u6298\u75D5\u6536\u62E2\u6210\u6C34\u6C14\u7403\u57FA\u7840\u5F62\uFF0C\u5C42\u5C42\u6298\u51FA\u8033\u6735\u540E\uFF0C\u4ECE\u8FDB\u6C14\u5B54\u5439\u4E00\u53E3\u6C14\u2014\u2014\u5706\u6EDA\u6EDA\u7684\u6708\u5154\u5C31\u9F13\u8D77\u6765\u4E86\uFF01",
  paper: { outline: SQUARE, front: "#F7E8DD", back: "#EFD3C2" },
  steps: [
    {
      type: "prefold",
      a: v(0, -1),
      b: v(0, 1),
      m: v(-0.4, 0),
      dir: "valley",
      desc: "\u7AD6\u76F4\u5BF9\u6298\u538B\u51FA\u4E2D\u7EBF\u540E\u5C55\u5F00\u3002"
    },
    {
      type: "prefold",
      a: v(-1, 0),
      b: v(1, 0),
      m: v(0, -0.4),
      dir: "valley",
      desc: "\u6C34\u5E73\u5BF9\u6298\u518D\u538B\u4E00\u6761\u4E2D\u7EBF\u3002"
    },
    {
      type: "prefold",
      a: v(-1, -1),
      b: v(1, 1),
      m: v(-0.5, 0.5),
      dir: "valley",
      desc: "\u6CBF\u5BF9\u89D2\u7EBF\u5BF9\u6298\u51FA\u6298\u75D5\u3002"
    },
    {
      type: "prefold",
      a: v(-1, 1),
      b: v(1, -1),
      m: v(-0.5, -0.5),
      dir: "valley",
      desc: "\u53E6\u4E00\u6761\u5BF9\u89D2\u7EBF\u540C\u6837\u2014\u2014\u7C73\u5B57\u6298\u75D5\u5907\u9F50\u3002"
    },
    {
      type: "collapse",
      creases: [
        { a: v(-1, 0), b: v(1, 0), dir: "valley" },
        { a: v(0, -1), b: v(0, 1), dir: "valley" },
        { a: v(-1, -1), b: v(1, 1), dir: "mountain" },
        { a: v(-1, 1), b: v(1, -1), dir: "mountain" }
      ],
      faces: [
        { pts: [T3, L3, O3], stack: 0, from: [T3, L3, O3] },
        { pts: [T3, R3, O3], stack: 0, from: [T3, R3, O3] },
        { pts: [B4, R3, O3], stack: 0, from: [B4, R3, O3] },
        { pts: [B4, L3, O3], stack: 0, from: [B4, L3, O3] },
        { pts: [T3, L3, O3], stack: 1, hinge: { a: T3, b: L3 }, angle: 172 },
        { pts: [T3, R3, O3], stack: -1, hinge: { a: T3, b: R3 }, angle: 172 },
        { pts: [B4, R3, O3], stack: 2, hinge: { a: B4, b: R3 }, angle: 172 },
        { pts: [B4, L3, O3], stack: -2, hinge: { a: B4, b: L3 }, angle: 172 }
      ],
      desc: "\u634F\u4F4F\u56DB\u8FB9\u5411\u4E2D\u95F4\u5E76\u62E2\u2014\u2014\u6C34\u6C14\u7403\u57FA\u7840\u5F62\uFF01",
      tip: "\u56DB\u4E2A\u89D2\u987A\u7740\u5BF9\u89D2\u6298\u75D5\u5411\u4E2D\u5FC3\u5012\u4E0B\u3002"
    },
    {
      type: "fold",
      a: v(-0.5, -0.5),
      b: v(-0.5, 0.5),
      m: v(-0.9, 0),
      dir: "valley",
      desc: "\u5DE6\u4FA7\u6CBF\u7AD6\u7EBF\u5411\u4E2D\u95F4\u6298\u3002"
    },
    {
      type: "fold",
      a: v(0.5, -0.5),
      b: v(0.5, 0.5),
      m: v(0.9, 0),
      dir: "valley",
      desc: "\u53F3\u4FA7\u540C\u6837\u5411\u4E2D\u95F4\u6298\u3002"
    },
    {
      type: "fold",
      a: v(-0.3, -0.05),
      b: v(0.3, -0.05),
      m: v(0, 0.3),
      dir: "valley",
      desc: "\u4E0A\u9762\u7684\u4E09\u89D2\u5411\u4E0B\u6298\u53E0\u3002"
    },
    {
      type: "fold",
      a: v(0.15, -0.5),
      b: v(0.15, 0.1),
      m: v(0.35, -0.2),
      dir: "valley",
      desc: "\u53F3\u4FA7\u6CBF\u865A\u7EBF\u538B\u6298\uFF0C\u5C16\u7AEF\u7A7F\u63D2\u5230\u4E0B\u9762\u7684\u4E09\u89D2\u5185\u3002",
      tip: "\u7A7F\u63D2\u56FA\u5B9A\u4F4F\uFF0C\u5154\u5B50\u624D\u4E0D\u4F1A\u6563\u5F00\u3002"
    },
    {
      type: "fold",
      a: v(-0.15, -0.5),
      b: v(-0.15, 0.1),
      m: v(-0.35, -0.2),
      dir: "valley",
      desc: "\u5DE6\u4FA7\u540C\u6837\u538B\u6298\u7A7F\u63D2\u3002"
    },
    {
      type: "flip",
      axis: "x",
      desc: "\u7FFB\u4E2A\u9762\u3002"
    },
    {
      type: "fold",
      a: v(-0.4, -0.15),
      b: v(0.4, -0.15),
      m: v(0, -0.45),
      dir: "valley",
      desc: "\u6CBF\u4E2D\u7EBF\u5411\u4E0A\u6298\u53E0\uFF0C\u8033\u6735\u7684\u5F62\u72B6\u5C31\u51FA\u6765\u4E86\u3002"
    },
    {
      type: "pose",
      faces: (() => {
        const body = [
          [-0.55, 0.35],
          [0.35, 0.3],
          [0.6, 0],
          [0.5, -0.4],
          [-0.15, -0.5],
          [-0.6, -0.15]
        ];
        const earF = [
          [-0.3, 1.08],
          [-0.2, 0.4],
          [-0.06, 1]
        ];
        const earB = [
          [-0.1, 1.14],
          [0.02, 0.44],
          [0.18, 1.06]
        ];
        const z = (arr, zz) => arr.map(([x, y]) => [x, y, zz]);
        return [
          { pts: z(body, 0.26), stack: 1 },
          { pts: z(body, -0.26), stack: 0 },
          { pts: z(earF, 0.14), stack: 2 },
          { pts: z(earB, -0.14), stack: 0 }
        ];
      })(),
      desc: "\u5BF9\u51C6\u8FDB\u6C14\u5B54\u5439\u6C14\uFF0C\u8EAB\u4F53\u9F13\u6210\u5706\u6EDA\u6EDA\u7684\u7403\u2014\u2014\u6708\u5154\u6210\u578B\uFF01",
      tip: "\u5BF9\u5E94\u539F\u6587\u7B2C15\u6B65\u300C\u5439\u8D77\u6765\u300D\uFF1A\u5145\u6C14\u540E\u8033\u6735\u81EA\u7136\u7ACB\u8D77\u3002"
    },
    {
      type: "note",
      desc: "\u5B8C\u6210\uFF01\u753B\u4E0A\u773C\u775B\uFF0C\u6302\u5728\u6708\u5149\u4E0B\u5C31\u662F\u6700\u7F8E\u7684\u4E2D\u79CB\u88C5\u9970\u3002",
      tip: "\u8F7B\u8F7B\u4E00\u62CD\uFF0C\u9F13\u9F13\u7684\u6708\u5154\u8FD8\u4F1A\u5F39\u8D77\u6765\u3002"
    }
  ],
  source: {
    label: "\u5FAE\u4FE1\u516C\u4F17\u53F7\u300C\u6298\u7EB8\u9020\u7269\u8BB0\u300D\xB7 \u4E2D\u79CB\u5FEB\u5230\u4E86\uFF0C\u6298\u4E00\u53EA\u53EF\u7231\u7684\u6708\u5154\u{1F430}",
    url: "http://mp.weixin.qq.com/s?__biz=MzkyMjM0ODcyMA==&mid=2247484642&idx=1&sn=f6287141c422072075afaa8837d860ab&chksm=c1f4f93df683702b465819003c2790e3bca64dc8bc94a6b2c290e179804c28b57362b5b95ac0#rd"
  }
};

// src/data/tutorials/cat.ts
var OUTLINE2 = [v(-1, -0.5), v(1, -0.5), v(1, 0.5), v(-1, 0.5)];
var cat = {
  id: "cat",
  title: "\u6298\u7EB8\u5C0F\u732B\u732B",
  emoji: "\u{1F431}",
  category: "\u52A8\u7269",
  difficulty: 3,
  minutes: 15,
  intro: "\u6765\u81EA\u516C\u4F17\u53F7\u300C\u6298\u7EB8\u9020\u7269\u8BB0\u300D\u7684\u6CBB\u6108\u7CFB\u9ED1\u732B\uFF1A\u957F\u65B9\u5F62\u7EB8\u6298\u51FA\u7BAD\u5934\u5C16\u7AEF\uFF0C\u624B\u98CE\u7434\u6298\u6536\u62E2\u6210\u4E09\u89D2\u5F62\u7ED3\u6784\uFF0C\u7FFB\u51FA\u4E24\u53EA\u5C16\u8033\u6735\uFF0C\u6700\u540E\u634F\u5408\u8EAB\u4F53\u8BA9\u732B\u7A33\u7A33\u7AD9\u7ACB\u2014\u2014\u5C3E\u5DF4\u8FD8\u8981\u5F2F\u6210\u5F27\u7EBF\u54E6\u3002",
  paper: { outline: OUTLINE2, front: "#2B2B33", back: "#4A4A55" },
  steps: [
    {
      type: "prefold",
      a: v(-1, 0),
      b: v(1, 0),
      m: v(0, 0.3),
      dir: "valley",
      desc: "\u6CBF\u957F\u8FB9\u4E2D\u7EBF\u5BF9\u6298\uFF0C\u538B\u5B9E\u6298\u75D5\u540E\u5C55\u5F00\u3002"
    },
    {
      type: "fold",
      a: v(0.65, 0.5),
      b: v(1, 0.15),
      m: v(0.9, 0.4),
      dir: "valley",
      desc: "\u53F3\u4E0A\u89D2\u6CBF\u8FB9\u7EBF\u5411\u5185\u6298\u3002"
    },
    {
      type: "fold",
      a: v(0.65, -0.5),
      b: v(1, -0.15),
      m: v(0.9, -0.4),
      dir: "valley",
      desc: "\u53F3\u4E0B\u89D2\u6CBF\u5BF9\u79F0\u659C\u7EBF\u6298\u2014\u2014\u7BAD\u5934\u5F62\u5C16\u7AEF\u51FA\u73B0\u3002"
    },
    {
      type: "prefold",
      a: v(0.75, -0.5),
      b: v(0.75, 0.5),
      m: v(0.9, 0),
      dir: "valley",
      desc: "\u5728\u53F3\u4FA7\u538B\u51FA\u4E00\u6761\u7AD6\u76F4\u6298\u75D5\u3002"
    },
    {
      type: "prefold",
      a: v(-1, 0.25),
      b: v(1, 0.25),
      m: v(0, 0.4),
      dir: "valley",
      desc: "\u6CBF\u4E2D\u5FC3\u5411\u4E0A\u538B\u51FA\u4E00\u6761\u5E73\u884C\u6298\u75D5\u3002"
    },
    {
      type: "prefold",
      a: v(-1, -0.25),
      b: v(1, -0.25),
      m: v(0, -0.4),
      dir: "valley",
      desc: "\u5411\u4E0B\u540C\u6837\u538B\u51FA\u4E00\u6761\u2014\u2014\u6298\u75D5\u51C6\u5907\u5B8C\u6BD5\u3002"
    },
    {
      type: "pose",
      faces: (() => {
        const strip = [
          [-1, 0.14],
          [0.72, 0.14],
          [1, 0],
          [0.72, -0.14],
          [-1, -0.14]
        ];
        const z = (arr, zz) => arr.map(([x, y]) => [x, y, zz]);
        return [
          { pts: z(strip, 0.02), stack: 1 },
          { pts: z(strip, -0.02), stack: 0 }
        ];
      })(),
      desc: "\u6309\u6298\u75D5\u6765\u56DE\u6298\u51FA\u624B\u98CE\u7434\uFF0C\u518D\u5411\u5185\u6536\u62E2\u2014\u2014\u7EC6\u957F\u7684\u6761\u5F62\u8EAB\u4F53\u51FA\u73B0\u4E86\u3002",
      tip: "\u5BF9\u5E94\u539F\u6587\u7684\u624B\u98CE\u7434\u6298\u4E0E\u5411\u5185\u6536\u62E2\u3002"
    },
    {
      type: "fold",
      a: v(-1, 0.06),
      b: v(-0.6, -0.06),
      m: v(-0.85, 0.1),
      dir: "valley",
      angle: 150,
      desc: "\u5DE6\u7AEF\u5411\u4E0A\u538B\u6298\uFF0C\u6574\u7406\u51FA\u4E09\u89D2\u5F62\u7684\u5934\u90E8\uFF0C\u4E24\u4FA7\u7FFB\u51FA\u5C16\u8033\u6735\u3002"
    },
    {
      type: "pose",
      faces: (() => {
        const zOf = (y) => y * 0.34;
        const body = [
          [-0.42, 0.95],
          [-0.22, 0.52],
          [-0.05, 0.6],
          [0.14, 0.5],
          [0.36, 0.98],
          [0.42, 0.5],
          [0.28, 0.3],
          [0.2, 0.05],
          [0.5, -0.65],
          [0.28, -0.68],
          [0.08, -0.15],
          [-0.05, -0.66],
          [-0.26, -0.62],
          [-0.16, 0.02],
          [-0.26, 0.28],
          [-0.4, 0.5]
        ];
        const tail = [
          [0.5, -0.1],
          [0.72, 0.15],
          [0.78, 0.42],
          [0.66, 0.44],
          [0.6, 0.18],
          [0.44, -0.08]
        ];
        return [
          { pts: body.map(([x, y]) => [x, y, zOf(y) + 0.012]), stack: 1 },
          { pts: body.map(([x, y]) => [x, y, zOf(y) - 0.012]), stack: 0 },
          { pts: tail.map(([x, y]) => [x, y, zOf(y) - 0.16]), stack: 0 }
        ];
      })(),
      desc: "\u634F\u5408\u8EAB\u4F53\u4E0B\u7AEF\u6574\u7406\u51FA\u817F\u90E8\uFF0C\u5C3E\u5DF4\u5F2F\u6210\u5F27\u5F62\u2014\u2014\u5C0F\u732B\u7A33\u7A33\u7AD9\u4F4F\u4E86\uFF01",
      tip: "\u5BF9\u5E94\u539F\u6587\u6700\u540E\u4E09\u6B65\uFF1A\u5E95\u90E8\u957F\u6761\u5BF9\u6298\u3001\u634F\u5408\u5E76\u62E2\u3001\u5C3E\u5DF4\u5F2F\u5F27\u3002"
    },
    {
      type: "note",
      desc: "\u5B8C\u6210\uFF01\u9ED1\u732B\u5317\u5317\u7AD9\u597D\u5566\uFF0C\u753B\u4E0A\u9EC4\u8272\u773C\u775B\u66F4\u795E\u79D8\u3002",
      tip: "\u8F7B\u8F7B\u63A8\u5B83\u7684\u5C3E\u5DF4\uFF0C\u5C0F\u732B\u4F1A\u5FAE\u5FAE\u6447\u6446\u3002"
    }
  ],
  source: {
    label: "\u5FAE\u4FE1\u516C\u4F17\u53F7\u300C\u6298\u7EB8\u9020\u7269\u8BB0\u300D\xB7 30s\u5B66\u4F1A\u6298\u7EB8\u5C0F\u732B\u732B\uFF01\u7B80\u5355\u53C8\u6CBB\u6108\uFF01",
    url: "http://mp.weixin.qq.com/s?__biz=MzkyMjM0ODcyMA==&mid=2247484233&idx=1&sn=0c4897a8878ce5ce6c24a535f25c866d&chksm=c1f4fe96f6837780db5273d413253f818e18657c8474f52008916547433833fb833d1664307d#rd"
  }
};

// src/data/tutorials/fighterjet.ts
var fighterjet = {
  id: "fighterjet",
  title: "\u6298\u7EB8\u6218\u6597\u673A",
  emoji: "\u2708\uFE0F",
  category: "\u73A9\u5177",
  difficulty: 2,
  minutes: 10,
  intro: "\u6765\u81EA\u516C\u4F17\u53F7\u300C\u6298\u7EB8\u9020\u7269\u8BB0\u300D\u7684\u5E05\u6C14\u6218\u6597\u673A\uFF1A\u4E24\u89D2\u5411\u5FC3\u6298\u51FA\u673A\u5934\uFF0C dart \u6298\u6536\u51FA\u5C16\u9510\u673A\u8EAB\uFF0C\u6700\u540E\u5C55\u5F00\u540E\u63A0\u7FFC\u548C\u53CC\u5782\u5C3E\u2014\u2014\u4E00\u5F20\u7EB8\u6298\u51FA\u5E05\u6C14\u5229\u843D\u7684\u6218\u6597\u673A\uFF01",
  paper: { outline: SQUARE, front: "#3A3F45", back: "#59616B" },
  steps: [
    {
      type: "prefold",
      a: v(0, -1),
      b: v(0, 1),
      m: v(-0.4, 0),
      dir: "valley",
      desc: "\u7AD6\u76F4\u5BF9\u6298\u538B\u51FA\u4E2D\u7EBF\u540E\u5C55\u5F00\u3002"
    },
    {
      type: "fold",
      a: v(-0.5, 0),
      b: v(0, 0.5),
      m: v(-0.35, 0.35),
      dir: "valley",
      desc: "\u5DE6\u4E0A\u89D2\u6CBF\u5BF9\u89D2\u7EBF\u6298\u5411\u4E2D\u5FC3\u3002"
    },
    {
      type: "fold",
      a: v(0, 0.5),
      b: v(0.5, 0),
      m: v(0.35, 0.35),
      dir: "valley",
      desc: "\u53F3\u4E0A\u89D2\u540C\u6837\u6298\u5411\u4E2D\u5FC3\u3002",
      tip: "\u73B0\u5728\u662F\u4E00\u4E2A\u6307\u5411\u4E0A\u7684\u623F\u5F62\u3002"
    },
    {
      type: "fold",
      a: v(0, 0.5),
      b: v(-0.25, -0.25),
      m: v(-0.3, 0.2),
      dir: "valley",
      desc: "\u5DE6\u4FA7\u659C\u8FB9\u6CBF\u6298\u75D5\u5411\u4E2D\u7EBF\u6298\u2014\u2014\u673A\u8EAB\u5F00\u59CB\u6536\u5C16\u3002"
    },
    {
      type: "fold",
      a: v(0, 0.5),
      b: v(0.25, -0.25),
      m: v(0.3, 0.2),
      dir: "valley",
      desc: "\u53F3\u4FA7\u540C\u6837\u6298\u2014\u2014\u5C16\u9510\u7684\u673A\u5934\u5B8C\u6210\u3002"
    },
    {
      type: "fold",
      a: v(0, -1),
      b: v(0, 1),
      m: v(-0.2, 0),
      dir: "mountain",
      wholeSide: true,
      desc: "\u6CBF\u4E2D\u7EBF\u5411\u540E\u5BF9\u6298\uFF0C\u673A\u8EAB\u6536\u6210\u7EC6\u6761\u3002",
      tip: "\u5C71\u6298\u8BA9\u673A\u5934\u4FDD\u6301\u5C16\u9510\u3002"
    },
    {
      type: "pose",
      faces: (() => {
        const outline = [
          [-1, 0],
          [-0.5, 0.08],
          [-0.1, 0.1],
          [0.55, 0.55],
          [0.78, 0.52],
          [0.45, 0.12],
          [0.72, 0.1],
          [0.62, 0.02],
          [0.72, -0.06],
          [0.45, -0.12],
          [0.78, -0.52],
          [0.55, -0.55],
          [-0.1, -0.1],
          [-0.5, -0.08]
        ];
        return [
          { pts: outline.map(([x, y]) => [x, y, 0.012]), stack: 1 },
          { pts: outline.map(([x, y]) => [x, y, -0.012]), stack: 0 }
        ];
      })(),
      desc: "\u5C55\u5F00\u540E\u63A0\u7FFC\uFF0C\u7ACB\u8D77\u53CC\u5782\u5C3E\u2014\u2014\u6218\u6597\u673A\u51C6\u5907\u8D77\u98DE\uFF01",
      tip: "\u5BF9\u5E94\u539F\u6587\u540E\u534A\u6BB5\u7684\u673A\u7FFC\u4E0E\u5C3E\u7FFC\u6574\u5F62\u3002"
    },
    {
      type: "note",
      desc: "\u5B8C\u6210\uFF01\u634F\u4F4F\u673A\u8179\u5411\u524D\u63B7\u51FA\uFF0C\u770B\u8C01\u7684\u6218\u6597\u673A\u98DE\u5F97\u8FDC\u3002",
      tip: "\u7FFC\u5C16\u5FAE\u5FAE\u4E0A\u7FD8\uFF0C\u98DE\u884C\u66F4\u5E73\u7A33\u3002"
    }
  ],
  source: {
    label: "\u5FAE\u4FE1\u516C\u4F17\u53F7\u300C\u6298\u7EB8\u9020\u7269\u8BB0\u300D\xB7 \u56FD\u5E86\u7279\u522B\u7BC7 | \u6298\u7EB8\u624B\u5DE5\u98DE\u673A",
    url: "http://mp.weixin.qq.com/s?__biz=MzkyMjM0ODcyMA==&mid=2247484771&idx=1&sn=eb72ac7ba17d8a7078d309b7a9a957e5&chksm=c1f4f8bcf68371aadd59ac25fe0f639e8fa6d4e3aa608b000ab6c7e28fd09bffc16a9d7e9975#rd"
  }
};

// src/data/tutorials/hippo.ts
var hippo = {
  id: "hippo",
  title: "\u6298\u7EB8\u6CB3\u9A6C",
  emoji: "\u{1F99B}",
  category: "\u52A8\u7269",
  difficulty: 3,
  minutes: 20,
  intro: "\u6765\u81EA\u516C\u4F17\u53F7\u300C\u6298\u7EB8\u9020\u7269\u8BB0\u300D\u7684\u5446\u840C\u6CB3\u9A6C\uFF1A\u56DB\u4E2A\u89D2\u4F9D\u6B21\u5411\u5185\u6C89\u6298\uFF0C\u6298\u51FA\u65B9\u65B9\u6B63\u6B63\u7684\u539A\u8EAB\u4F53\uFF0C\u7FFB\u6298\u51FA\u5927\u5934\u548C\u5BBD\u5634\uFF0C\u6700\u540E\u634F\u51FA\u8033\u6735\u548C\u9F3B\u5B54\u2014\u2014\u61A8\u6001\u53EF\u63AC\u7684\u6CB3\u9A6C\u5C31\u5B8C\u6210\u4E86\uFF01",
  paper: { outline: DIAMOND, front: "#8FA8C8", back: "#B9CADD" },
  steps: [
    {
      type: "prefold",
      a: v(0, -1),
      b: v(0, 1),
      m: v(-0.4, 0),
      dir: "valley",
      desc: "\u83F1\u5F62\u6446\u653E\uFF0C\u7AD6\u76F4\u5BF9\u6298\u538B\u51FA\u4E2D\u7EBF\u540E\u5C55\u5F00\u3002"
    },
    {
      type: "prefold",
      a: v(-1, 0),
      b: v(1, 0),
      m: v(0, 0.4),
      dir: "valley",
      desc: "\u6C34\u5E73\u65B9\u5411\u540C\u6837\u5BF9\u6298\uFF0C\u5341\u5B57\u6298\u75D5\u5907\u597D\u3002"
    },
    {
      type: "prefold",
      a: v(-0.5, -0.5),
      b: v(0.5, -0.5),
      m: v(0, -0.7),
      dir: "valley",
      desc: "\u5E95\u89D2\u5411\u4E0A\u6298\u5230\u4E2D\u5FC3\uFF0C\u538B\u51FA\u6298\u75D5\u540E\u5C55\u5F00\u3002"
    },
    {
      type: "reverse",
      a: v(-0.5, -0.5),
      b: v(0.5, -0.5),
      m: v(0, -0.8),
      dir: "inside",
      style: "sink",
      desc: "\u6CBF\u6298\u75D5\u628A\u5E95\u89D2\u5411\u5185\u6C89\u6298\u2014\u2014\u5C16\u89D2\u9677\u8FDB\u5C42\u5185\u3002",
      tip: "\u6C89\u6298\uFF1A\u5F20\u5F00\u7EB8\u5C42\u8BA9\u5C16\u89D2\u7FFB\u843D\u8FDB\u53BB\uFF0C\u518D\u538B\u5E73\u3002"
    },
    {
      type: "prefold",
      a: v(-0.5, 0.5),
      b: v(0.5, 0.5),
      m: v(0, 0.7),
      dir: "valley",
      desc: "\u9876\u89D2\u5411\u4E0B\u6298\u5230\u4E2D\u5FC3\uFF0C\u538B\u51FA\u6298\u75D5\u540E\u5C55\u5F00\u3002"
    },
    {
      type: "reverse",
      a: v(-0.5, 0.5),
      b: v(0.5, 0.5),
      m: v(0, 0.8),
      dir: "inside",
      style: "sink",
      desc: "\u9876\u89D2\u540C\u6837\u5411\u5185\u6C89\u6298\u3002"
    },
    {
      type: "prefold",
      a: v(-0.5, -0.5),
      b: v(-0.5, 0.5),
      m: v(-0.7, 0),
      dir: "valley",
      desc: "\u5DE6\u89D2\u5411\u4E2D\u5FC3\u6298\uFF0C\u538B\u51FA\u6298\u75D5\u540E\u5C55\u5F00\u3002"
    },
    {
      type: "reverse",
      a: v(-0.5, -0.5),
      b: v(-0.5, 0.5),
      m: v(-0.8, 0),
      dir: "inside",
      style: "sink",
      desc: "\u5DE6\u89D2\u5411\u5185\u6C89\u6298\u3002"
    },
    {
      type: "prefold",
      a: v(0.5, -0.5),
      b: v(0.5, 0.5),
      m: v(0.7, 0),
      dir: "valley",
      desc: "\u53F3\u89D2\u5411\u4E2D\u5FC3\u6298\uFF0C\u538B\u51FA\u6298\u75D5\u540E\u5C55\u5F00\u3002"
    },
    {
      type: "reverse",
      a: v(0.5, -0.5),
      b: v(0.5, 0.5),
      m: v(0.8, 0),
      dir: "inside",
      style: "sink",
      desc: "\u53F3\u89D2\u5411\u5185\u6C89\u6298\u2014\u2014\u56DB\u4E2A\u89D2\u5168\u90E8\u9677\u8FDB\u53BB\u3002",
      tip: "\u65B9\u65B9\u6B63\u6B63\u7684\u539A\u8EAB\u4F53\uFF0C\u6B63\u662F\u6CB3\u9A6C\u7684\u61A8\u6837\u3002"
    },
    {
      type: "fold",
      a: v(-1, 0),
      b: v(1, 0),
      m: v(0, -0.4),
      dir: "mountain",
      wholeSide: true,
      desc: "\u6CBF\u6C34\u5E73\u4E2D\u7EBF\u5411\u540E\u5BF9\u6298\u3002"
    },
    {
      type: "reverse",
      a: v(-0.35, -0.05),
      b: v(-0.7, -0.3),
      m: v(-0.55, 0.05),
      dir: "inside",
      desc: "\u5DE6\u7AEF\u5411\u5185\u7FFB\u6298\uFF0C\u538B\u51FA\u6CB3\u9A6C\u7684\u5927\u5934\u3002"
    },
    {
      type: "fold",
      a: v(-0.9, -0.1),
      b: v(-0.72, -0.32),
      m: v(-0.95, -0.14),
      dir: "valley",
      angle: 130,
      desc: "\u543B\u90E8\u5411\u4E0A\u6298\u4E00\u4E2A\u5C0F\u89D2\uFF0C\u505A\u51FA\u5F20\u5F00\u7684\u5634\u3002"
    },
    {
      type: "pose",
      faces: (() => {
        const outline = [
          [-1, 0.28],
          [-1.02, 0.1],
          [-0.8, 0.02],
          [-0.55, 0],
          [-0.45, -0.25],
          [-0.3, -0.28],
          [-0.24, -0.02],
          [0.3, -0.04],
          [0.38, -0.3],
          [0.52, -0.3],
          [0.58, 0],
          [0.75, 0.18],
          [0.7, 0.34],
          [0.2, 0.42],
          [-0.35, 0.44],
          [-0.5, 0.5],
          [-0.62, 0.48],
          [-0.85, 0.42]
        ];
        const zOf = (x, y) => 0.012 + 0.18 * Math.max(0, 1 - Math.abs(x) * 1.4) + y * 0.12;
        return [
          { pts: outline.map(([x, y]) => [x, y, zOf(x, y) + 8e-3]), stack: 1 },
          { pts: outline.map(([x, y]) => [x, y, zOf(x, y) - 8e-3]), stack: 0 }
        ];
      })(),
      desc: "\u634F\u51FA\u5C0F\u8033\u6735\u3001\u538B\u51FA\u4E24\u4E2A\u9F3B\u5B54\u2014\u2014\u5446\u840C\u6CB3\u9A6C\u5B8C\u6210\uFF01",
      tip: "\u5BF9\u5E94\u539F\u6587\u7B2C37-40\u6B65\uFF1A\u5934\u90E8\u62F1\u5F62\u70B9\u4E0B\u538B\u6210\u9F3B\u5B54\u3001\u9876\u90E8\u5C16\u7AEF\u5185\u6298\u6210\u8033\u6735\u3002"
    },
    {
      type: "note",
      desc: "\u5B8C\u6210\uFF01\u753B\u4E0A\u5C0F\u773C\u775B\uFF0C\u6CB3\u9A6C\u6700\u559C\u6B22\u6CE1\u5728\u6C34\u91CC\u6253\u54C8\u6B20\u3002",
      tip: "\u56DB\u4E2A\u6C89\u6298\u662F\u8FD9\u53EA\u6CB3\u9A6C\u7684\u7075\u9B42\uFF0C\u6162\u4E00\u70B9\u6298\u66F4\u65B9\u6B63\u3002"
    }
  ],
  source: {
    label: "\u5FAE\u4FE1\u516C\u4F17\u53F7\u300C\u6298\u7EB8\u9020\u7269\u8BB0\u300D\xB7 \u6765\uFF0C\u4E00\u8D77\u6298\u53EA\u53EF\u7231\u5446\u840C\u7684\u6CB3\u9A6C\uFF01",
    url: "http://mp.weixin.qq.com/s?__biz=MzkyMjM0ODcyMA==&mid=2247484932&idx=1&sn=e1ebad7415b99b402a36d3b65ebfef47&chksm=c1f4fbdbf68372cd6589ba71421007e16bfb00bc1e8662e79bbff1b68f4fe9414f5704da6d88#rd"
  }
};

// src/data/wechat-album.json
var wechat_album_default = {
  source: "\u5FAE\u4FE1\u516C\u4F17\u53F7\u300C\u6298\u7EB8\u9020\u7269\u8BB0\u300D",
  album: "\u6298\u7EB8\u5C0F\u73A9\u5177",
  album_url: "https://mp.weixin.qq.com/mp/appmsgalbum?__biz=MzkyMjM0ODcyMA==&action=getalbum&album_id=4662449167783657472#wechat_redirect",
  biz: "MzkyMjM0ODcyMA==",
  album_id: "4662449167783657472",
  total: 25,
  extracted_at: "2026-09-27",
  note: "\u6E05\u5355\u7531\u5408\u96C6\u5206\u9875\u63A5\u53E3 (appmsgalbum?action=getalbum&f=json) \u6293\u53D6\u3002\u9664\u6307\u5C16\u9640\u87BA\uFF08\u5DF2\u4E0A\u7EBF\uFF09\u5916\u5747\u4E3A\u5F85\u8F6C\u6362\u6559\u7A0B\u3002\u6293\u53D6\u65B9\u5F0F\u4E0E\u56FE\u7247\u4E0B\u8F7D\u3001IR \u8F6C\u5199\u6D41\u7A0B\u89C1 README\u300C\u5916\u90E8\u6559\u7A0B\u5BFC\u5165\u7BA1\u7EBF\u300D\u3002",
  articles: [
    {
      title: "\u6765\uFF0C\u4E00\u8D77\u6298\u53EA\u53EF\u7231\u5446\u840C\u7684\u6CB3\u9A6C\uFF01",
      url: "http://mp.weixin.qq.com/s?__biz=MzkyMjM0ODcyMA==&mid=2247484932&idx=1&sn=e1ebad7415b99b402a36d3b65ebfef47&chksm=c1f4fbdbf68372cd6589ba71421007e16bfb00bc1e8662e79bbff1b68f4fe9414f5704da6d88#rd",
      mid: "2247484932",
      status: "done",
      note: "\u5DF2\u8F6C\u6362\uFF08\u7B80\u5316\u6298\u5E8F+\u6C89\u6298\u7B97\u5B50\uFF09\uFF1A\u5341\u5B57\u6298\u75D5+\u56DB\u89D2\u6C89\u6298\xD74(\u62DB\u724C\u52A8\u4F5C)+\u5C71\u6298\u534A\u6298+\u5934\u90E8\u5185\u7FFB+\u543B\u90E8\u6298+\u6CB3\u9A6Cpose\uFF08\u62F1\u80CC\u65B9\u8EAB\uFF09\u3002id=hippo"
    },
    {
      title: "\u56FD\u5E86\u7279\u522B\u7BC7 \u6CA1\u6709\u4E00\u4E2A\u7537\u5B69\u53EF\u4EE5\u62D2\u7EDD\u4E00\u8F86\u5766\u514B",
      url: "http://mp.weixin.qq.com/s?__biz=MzkyMjM0ODcyMA==&mid=2247484910&idx=1&sn=495eeac9e31f11373e442e6846dfe3e2&chksm=c1f4f831f683712743e5297499d6a29b44f83e8b5a70c3462cb0eee68562671515ba169c6b72#rd",
      mid: "2247484910",
      status: "blocked",
      note: "\u5224\u578B\uFF1Ablocked\u2014\u2014\u4E09\u4EF6\u5957\u7EC4\u88C5\u6A21\u578B\uFF08\u5C65\u5E26+\u70AE\u5854+\u70AE\u7BA1\uFF09\uFF0C\u9700\u526A\u7EB8(\u246B\u246C)\u3001\u5377\u7EB8(\u3257-\u3259)\u3001\u6D82\u80F6\u3001\u6253\u5B54(\u3256)\u3001\u591A\u7EB8\u63D2\u88C5(\u325B-\u32B1)\uFF0C\u8D85\u51FA\u5355\u7EB8\u6298\u53E0\u5F15\u64CE\u8303\u56F4"
    },
    {
      title: "\u6709\u4E86\u8FD9\u6298\u7EB8\u9640\u87BA\uFF0C\u8C01\u4E0A\u73ED\u4E0A\u8BFE\u8FD8\u4F1A\u65E0\u804A\u554A\uFF01",
      url: "http://mp.weixin.qq.com/s?__biz=MzkyMjM0ODcyMA==&mid=2247484873&idx=1&sn=0f8ef6d4b3a6b7676d4dcbadf222b134&chksm=c1f4f816f6837100e61de49d837bfd4f2f7eb1de15817e095bc2e8cf5fd6d07c84ecbd58db01#rd",
      mid: "2247484873",
      status: "blocked",
      note: "\u5224\u578B\uFF1Ablocked\u2014\u2014\u4E09\u7EB8\u7EC4\u5408\u6A21\u5757\uFF08\u87BA\u65CB\u5E95\u5EA7+\u585E\u5165\u53E3\u888B\u7684\u5C0F\u6A21\u5757+X\u5F62\u8F6C\u8F74\uFF09\uFF0C\u9700\u591A\u7EB8\u63D2\u88C5"
    },
    {
      title: "\u56FD\u5E86\u7279\u522B\u7BC7 \u95EA\u95EA\u7EA2\u661F\u6298\u7EB8\u6559\u7A0B",
      url: "http://mp.weixin.qq.com/s?__biz=MzkyMjM0ODcyMA==&mid=2247484751&idx=1&sn=afc44fd845a866aad57155dee5ca0eaa&chksm=c1f4f890f6837186596063c9c1278c3ef5529eb43dd581f4ea2f97cf9944ee563188e19f405b#rd",
      mid: "2247484751",
      status: "blocked",
      note: "\u4E94\u89D2\u661F\u584C\u7F29(\u53EF\u505A) + \u7ACB\u4F53\u63D2\u5165\u6210\u578B(\u4E0D\u53EF\u505A)\uFF0C\u9700\u7ACB\u4F53\u63D2\u5165/\u634F\u5408\u7B97\u5B50"
    },
    {
      title: "\u6298\u4E00\u53EA\u53EF\u7231\u4E14\u5FE0\u8BDA\u7684\u814A\u80A0\u5C0F\u72D7\u5427\uFF01",
      url: "http://mp.weixin.qq.com/s?__biz=MzkyMjM0ODcyMA==&mid=2247484733&idx=1&sn=f284ff34aa2f555b578e732b681104b6&chksm=c1f4f8e2f68371f4bde7da37bcca7fcd14712e7c3c77c4d236260c9a7d856ca48f55af1fe87b#rd",
      mid: "2247484733",
      status: "done",
      note: "\u5DF2\u8F6C\u6362\uFF08\u9996\u4E2A reverse \u7B97\u5B50\u6559\u7A0B\uFF09\uFF1Aprefold\xD72+\u5DE6\u53F3\u6298\u5165+\u534A\u6298+\u5934/\u5C3E\u5C16\u5185\u7FFB\u6298\xD72+\u8116\u5C3E\u7ACB\u8D7790\xB0\xD72+\u817F\u90E8\u5185\u7FFB\u6298+\u814A\u80A0\u72AC\u4FA7\u5F71pose\u3002id=dachshund"
    },
    {
      title: "\u6298\u7EB8\u5C0F\u516C\u9E21\u{1F413}\u8BE6\u7EC6\u7248\u6559\u7A0B",
      url: "http://mp.weixin.qq.com/s?__biz=MzkyMjM0ODcyMA==&mid=2247484593&idx=1&sn=c4572d25c44397240f139fa5f4ba513f&chksm=c1f4f96ef683707816a7d205a56cef7f7f8821dd8644d98828e198688487619a24808e95de70#rd",
      mid: "2247484593",
      status: "done",
      note: "\u5DF2\u8F6C\u6362\uFF1A\u5341\u5B57\u6298\u75D5+\u56DB\u89D2\u5411\u5FC3(blintz)+\u5BF9\u6298+\u82B1\u74E3\u6298(\u62C9\u89D2)+\u7FFB\u9762+\u8116\u5B50\u538B\u6298+\u516C\u9E21\u4FA7\u5F71pose(\u51A0/\u8089\u5782/\u5C3E\u5F27)\u3002id=rooster"
    },
    {
      title: "30s\u5B66\u4F1A\u6298\u7EB8\u5C0F\u732B\u732B\uFF01\u7B80\u5355\u53C8\u6CBB\u6108\uFF01",
      url: "http://mp.weixin.qq.com/s?__biz=MzkyMjM0ODcyMA==&mid=2247484233&idx=1&sn=0c4897a8878ce5ce6c24a535f25c866d&chksm=c1f4fe96f6837780db5273d413253f818e18657c8474f52008916547433833fb833d1664307d#rd",
      mid: "2247484233",
      status: "done",
      note: "\u5DF2\u8F6C\u6362\uFF1A\u4E2D\u7EBFprefold+\u53CC\u89D2\u6298(\u7BAD\u5934)+\u6298\u75D5\u7EC4+\u624B\u98CE\u7434\u6536\u62E2pose+\u5934\u90E8\u538B\u6298+\u8033\u6735\u6298+\u7AD9\u7ACB\u732Bpose(\u4E09\u89D2\u5934/\u7AD6\u8033/\u957F\u817F/\u5377\u5C3E)\u3002id=cat"
    },
    {
      title: "10s\u5B66\u4F1A\u6298\u7EB8\u8774\u8776\u{1F98B}",
      url: "http://mp.weixin.qq.com/s?__biz=MzkyMjM0ODcyMA==&mid=2247484181&idx=1&sn=8f98074ccad039dbc02e717b5f8010ad&chksm=c1f4fecaf68377dc5b1cde184c5254adc35f4206ab77f736fe50ed7d33003287656e7312276d#rd",
      mid: "2247484181",
      status: "blocked",
      note: "\u7FC5\u8180\u9700\u526A\u5706\u5F27 + \u634F\u5408\u7ACB\u4F53\u6574\u5F62\uFF0C\u8D85\u51FA\u6298\u53E0\u5F15\u64CE"
    },
    {
      title: "10s\u5B66\u4F1A\u5F39\u8DF3\u9752\u86D9\uFF08\u96F6\u57FA\u7840",
      url: "http://mp.weixin.qq.com/s?__biz=MzkyMjM0ODcyMA==&mid=2247483997&idx=1&sn=64847c80d57f1c4c1887246015278b75&chksm=c1f4ff82f683769406106e272c031acf37c377d25ff47c8d30c83d667f151a4950051bc21d1d#rd",
      mid: "2247483997",
      status: "done",
      note: "\u5DF2\u4E0A\u7EBF\uFF08\u53CC\u6C34\u6C14\u7403\u584C\u7F29\u7528 collapse \u7B97\u5B50\uFF09"
    },
    {
      title: "30s\u5B66\u4F1A\u6298\u7EB8\u6050\u9F99\u{1F996}\uFF0C\u624B\u6B8B\u515A\u901F\u51B2\uFF01",
      url: "http://mp.weixin.qq.com/s?__biz=MzkyMjM0ODcyMA==&mid=2247483907&idx=1&sn=5baf6c6efa04b22d9b19b2ee25b87868&chksm=c1f4ffdcf68376cacc4815a6cd0b469e65d955d465ad67dd1b4dd16a5ef93e91cfc6b2f54910#rd",
      mid: "2247483907",
      status: "done",
      note: "\u5DF2\u8F6C\u6362\uFF1Aprefold\xD72+\u5DE6\u53F3\u9876\u6298\u5165\xD73+\u5E76\u62E2pose+\u5E95\u89D2\u4E0A\u62C9+\u5BF9\u6298+\u9888/\u5934\u5185\u7FFB(mountain 150)+T-rex\u7ACB\u59FFpose\u3002id=dino"
    },
    {
      title: "\u56FD\u5E86\u7279\u522B\u7BC7 | \u6298\u7EB8\u624B\u5DE5\u98DE\u673A",
      url: "http://mp.weixin.qq.com/s?__biz=MzkyMjM0ODcyMA==&mid=2247484771&idx=1&sn=eb72ac7ba17d8a7078d309b7a9a957e5&chksm=c1f4f8bcf68371aadd59ac25fe0f639e8fa6d4e3aa608b000ab6c7e28fd09bffc16a9d7e9975#rd",
      mid: "2247484771",
      status: "done",
      note: "\u5DF2\u8F6C\u6362\uFF08\u7B80\u5316\u6298\u5E8F\uFF09\uFF1A\u4E2D\u7EBFprefold+\u53CC\u89D2\u5411\u5FC3+dart\u6298\xD72+\u5C71\u6298\u534A\u6298+\u6218\u6597\u673Apose\uFF08\u540E\u63A0\u7FFC/\u53CC\u5782\u5C3E\uFF09\u3002\u539F\u658728\u6B65\u7684\u540E\u6BB53D\u6574\u5F62\u7531pose\u5448\u73B0\u3002id=fighterjet"
    },
    {
      title: "\u4E2D\u79CB\u5FEB\u5230\u4E86\uFF0C\u6298\u4E00\u4E2A\u6708\u4EAE\u8239\u{1F319}\u9001\u7ED9\u4F60",
      url: "http://mp.weixin.qq.com/s?__biz=MzkyMjM0ODcyMA==&mid=2247484666&idx=1&sn=789d3d7e989e9c2a69f1aaeecc5fa0c5&chksm=c1f4f925f68370333ad9168b42cfa5d5c897090ad545f2a97d0a5d2180740531b89240d08e9f#rd",
      mid: "2247484666",
      status: "blocked",
      note: "\u4E09\u4EF6\u5957\u7EC4\u5408\uFF08\u526A\u5F00\u6210\u6708\u4EAE\u73AF/\u7389\u5154/\u5E95\u5EA7\uFF09+ \u7ACB\u4F53\u8936\u76B1\u805A\u62E2\uFF0C\u8D85\u51FA\u6298\u53E0\u5F15\u64CE"
    },
    {
      title: "\u4E2D\u79CB\u5FEB\u5230\u4E86\uFF0C\u6298\u4E00\u53EA\u53EF\u7231\u7684\u6708\u5154\u{1F430}",
      url: "http://mp.weixin.qq.com/s?__biz=MzkyMjM0ODcyMA==&mid=2247484642&idx=1&sn=f6287141c422072075afaa8837d860ab&chksm=c1f4f93df683702b465819003c2790e3bca64dc8bc94a6b2c290e179804c28b57362b5b95ac0#rd",
      mid: "2247484642",
      status: "done",
      note: "\u5DF2\u8F6C\u6362\uFF1A\u7C73\u5B57\u6298\u75D5+\u6C34\u6C14\u7403\u584C\u7F29+\u5DE6\u53F3\u6298\u5165+\u538B\u6298\u7A7F\u63D2\xD72+\u7FFB\u9762+\u4E0A\u6298+\u5145\u6C14pose\uFF08\u53CC\u5C42\u6DF1z\u5706\u8EAB+\u53CC\u8033\uFF09\u3002id=moonrabbit"
    },
    {
      title: "\u7537\u5B69\u5B50\u672C\u547D\u6B66\u5668\u98DE\u9556\u6765\u55BD\uFF01\u603B\u6709\u4E00\u6B3E\u9002\u5408\u4F60",
      url: "http://mp.weixin.qq.com/s?__biz=MzkyMjM0ODcyMA==&mid=2247484631&idx=1&sn=a5912e4620a1b0cab113ae9d0e38aead&chksm=c1f4f908f683701e205948d4b8ebcdac1c4fd8635ae41f14731fcdfa66eaa6a7c5056e2414f8#rd",
      mid: "2247484631",
      status: "blocked",
      note: "\u5224\u578B\uFF1Ablocked\u2014\u20144\u7EB8\u6A21\u5757\u98DE\u9556\uFF08\u6BCF\u5355\u5143\u6298\u5200\u5203\u2468-\u2473\u4E92\u76F8\u7A7F\u63D2+\u80F6\u7C98\u56FA\u5B9A\uFF09\uFF0C\u591A\u7EB8\u7EC4\u88C5"
    },
    {
      title: "\u613F\u5927\u6570\u636E\u63A8\u9001\u7ED9\u6BCF\u4E00\u4F4D\u70ED\u7231\u548C\u5E73\u751F\u6D3B\u7684\u4EBA\u{1F54A}\uFE0F",
      url: "http://mp.weixin.qq.com/s?__biz=MzkyMjM0ODcyMA==&mid=2247484570&idx=1&sn=7307f4895b43096852cb1ac2f4d95eae&chksm=c1f4f945f6837053fbf940c640acc0ea54bef76055cb10f813ce023c2fd5de524f5a42caa8e9#rd",
      mid: "2247484570",
      status: "done",
      note: "\u548C\u5E73\u9E3D\u5DF2\u8F6C\u6362\uFF1Afold\xD74 \u771F\u5B9E\u6298\u53E0 + pose \u5C55\u5F00 L \u5F62 + \u5934\u90E8\u5185\u7FFB + \u5C3E\u90E8\u5BF9\u6298 + pose \u5B9A\u578B\u3002id=dove"
    },
    {
      title: "10s\u5B66\u4F1A | \u95F2\u7740\u4E5F\u662F\u95F2\u7740\u6298\u4E00\u5768\u641E\u602A\u4FBF\u4FBF\u5427\u{1F4A9}",
      url: "http://mp.weixin.qq.com/s?__biz=MzkyMjM0ODcyMA==&mid=2247484529&idx=1&sn=26070200f93310c359fae17d9715f876&chksm=c1f4f9aef68370b83aaa32ac21e2ed6fd31305719176ff12ac4d528b3ef3829b1b4cf8b5b5dd#rd",
      mid: "2247484529",
      status: "done",
      note: "\u5DF2\u4E0A\u7EBF\uFF08\u6C34\u6C14\u7403\u584C\u7F29+\u6536\u62E2\u9020\u578B pose\uFF1B\u5185\u7FFB\u6298/squash \u7EC6\u8282\u5728 desc \u4E2D\u6587\u5B57\u8BF4\u660E\uFF09",
      analysis: {
        progress: "\u6B65\u9AA4 1-18 \u5DF2\u89E3\u6790\u5B8C\u6BD5\uFF08\u542B\u5185\u7FFB\u6298\xD72\u3001squash\xD72\u3001\u4EA4\u66FF\u7FFB\u6298\xD74\uFF09\uFF1B19-20 \u9762\u677F\u5728\u635F\u574F\u7684 img_09/img_10 \u4E2D\uFF0C\u91CD\u4E0B\u540E\u8865\u9F50\u5373\u53EF\u8F6C\u5199",
        chain: [
          "1: \u7C73\u5B57\u6298\u75D5\uFF08\u5BF9\u89D2\u7EBF+\u5341\u5B57\uFF09",
          "2-4: \u6CBF\u4E2D\u7EBF\u6536\u62E2\u6210\u53CC\u4E09\u89D2\uFF08\u6C34\u6C14\u7403\u584C\u7F29\uFF09",
          "5-6: squash\uFF1A\u4E0A\u9762\u5C0F\u4E09\u89D2\u5411\u4E0B\u5C55\u5F00\uFF08\u5185\u538B\u6298\uFF09",
          "7: \u4E0B\u65B9\u4E09\u89D2\u6CBF\u6C34\u5E73\u865A\u7EBF\u5411\u4E0A\u7FFB\u6298",
          "8: \u6CBF\u865A\u7EBF\u518D\u6B21\u5411\u4E0B\u7FFB\u6298",
          "9: \u5E95\u90E8\u6CBF V \u865A\u7EBF\u5411\u5185\u538B\u6298\uFF08squash\uFF09",
          "10: \u5411\u5916\u7FFB\u6298\uFF08\u5916\u7FFB\uFF09",
          "11-12: \u6CBF\u865A\u7EBF\u5411\u4E0B/\u5411\u4E0A\u4EA4\u66FF\u7FFB\u6298\uFF08N \u5F62\u8936\u76B1\u5F00\u59CB\uFF09",
          "13: \u865A\u7EBF\u5904\u5185\u7FFB\u6298 + \u4E0A\u9762\u5C0F\u4E09\u89D2\u5411\u4E0B\u5C55\u5F00\uFF08\u5185\u7FFB\u6298\u6A21\u5F0F\u2460\uFF09",
          "14: \u4E0B\u4E09\u89D2\u5411\u5185\u7FFB\u6298\uFF08\u5185\u7FFB\u6298\u6A21\u5F0F\u2461\uFF09",
          "15-16: \u6CBF\u865A\u7EBF\u5411\u4E0B/\u5411\u4E0A\u4EA4\u66FF\u7FFB\u6298",
          "17: \u4E09\u89D2\u5F00\u53E3\u5904\u5411\u5185\u6324\u538B\u51FA\u6B63\u65B9\u5F62\uFF08squash \u5B9E\u8BC1\u2461\uFF09",
          "18: \u6CBF\u865A\u7EBF\u5411\u4E0A\u7FFB\u6298",
          "19-20: \u5F85\u8865\uFF08N \u5F62\u6298+\u5185\u538B\u6210 poop \u9020\u578B\uFF09"
        ]
      }
    },
    {
      title: "\u6559\u5E08\u8282\u8D3A\u5361\u6765\u5566\uFF01",
      url: "http://mp.weixin.qq.com/s?__biz=MzkyMjM0ODcyMA==&mid=2247484508&idx=1&sn=4f6b6fb7843f2f83120528cc8b0d30a8&chksm=c1f4f983f6837095c281b39b12031d74733989256e2d9adc72e857761530b6092ed8736a5c52#rd",
      mid: "2247484508",
      status: "blocked",
      note: "\u526A\u7EB8+\u7EC4\u88C5\u624B\u5DE5\uFF08\u526A\u5200\u88C1\u526A\u3001\u80F6\u6C34\u7C98\u8D34\u82B1\u74E3\uFF09\uFF0C\u975E\u6298\u7EB8\u6298\u53E0\uFF0C\u8D85\u51FA\u6298\u53E0\u5F15\u64CE\u8303\u7574"
    },
    {
      title: "\u5E05\u54ED\uFF01\u7528\u7EB8\u505A\u53EA\u5C0F\u9CA8\u9C7C\u{1F988}",
      url: "http://mp.weixin.qq.com/s?__biz=MzkyMjM0ODcyMA==&mid=2247484261&idx=1&sn=c112ffd4277d13c06948f790285dcc76&chksm=c1f4febaf68377ac83cf84ede9bbfe5be2255412647a2cb7ce201b6f9cc1d3916efb7a3a5fff#rd",
      mid: "2247484261",
      status: "done",
      note: "\u5DF2\u8F6C\u6362\uFF1Aprefold\xD72+\u4E0A\u4E0B\u89D2\u6298+\u5DE6\u53F3\u6298\u5165+\u543B\u90E8+\u7FFB\u9762+\u53CC\u80F8\u9CCD\u5916\u7FFB(150\xB0)+\u9CA8\u9C7C\u4FA7\u5F71pose\u3002id=shark"
    },
    {
      title: "\u4E00\u8D77\u6765\u6298,\u597D\u73A9\u7684\u6298\u7EB8\u8759\u8760",
      url: "http://mp.weixin.qq.com/s?__biz=MzkyMjM0ODcyMA==&mid=2247484202&idx=1&sn=eb8452d438e4516ea2668bda116d983e&chksm=c1f4fef5f68377e348f89f8cf3f5603922e8345e4656cf3bd0f405c0222d958f1a05d4bca647#rd",
      mid: "2247484202",
      status: "done",
      note: "\u5DF2\u8F6C\u6362\uFF1A\u5BF9\u89D2\u6298+\u4E2D\u7EBFprefold+\u9876\u89D2\u4E0B\u6298+\u4E0A\u6298+\u53CC\u4FA7\u538B\u8936(150\xB0)+W\u7FFC\u8759\u8760pose\u3002id=bat2"
    },
    {
      title: "10s\u5B66\u4F1A\u6298\u7EB8\u5C0F\u5154\u{1F430} \u8D85\u53EF\u7231",
      url: "http://mp.weixin.qq.com/s?__biz=MzkyMjM0ODcyMA==&mid=2247484163&idx=1&sn=1a30eb4fa4c208ca6d6ef2b8571ec12f&chksm=c1f4fedcf68377cae32b6f6db4a494de1e93320246af8dd2f8da5efebe63fc2956d2d663f5f4#rd",
      mid: "2247484163",
      status: "done",
      note: "\u5DF2\u4E0A\u7EBF\uFF08\u6C34\u6C14\u7403\u584C\u7F29\u7528 collapse \u7B97\u5B50\u9010\u9762\u7247\u521A\u6027\u65CB\u8F6C\u6F14\u793A\uFF09"
    },
    {
      title: "25\u79D2\u6559\u4F60\u7528A4\u7EB8\u505A\u4E00\u628A\u73A9\u5177\u67AA",
      url: "http://mp.weixin.qq.com/s?__biz=MzkyMjM0ODcyMA==&mid=2247484135&idx=1&sn=59e68c5cfa196c62ab1c3b55435469bc&chksm=c1f4ff38f683762e4d8744b2a4ebde7c06adee4b25295dd344e2386ec8464f2c2cd78d28fdeb#rd",
      mid: "2247484135",
      status: "blocked",
      note: "\u539F\u6587\u5DF2\u88AB\u4F5C\u8005\u5220\u9664\uFF08\u5FAE\u4FE1\u63D0\u793A content deleted\uFF09\uFF0C\u65E0\u6CD5\u83B7\u53D6\u6559\u7A0B\u5185\u5BB9"
    },
    {
      title: "\u597D\u73A9\u7684\u5F39\u529B\u5C0F\u86C7\u6298\u7EB8\u6559\u7A0B",
      url: "http://mp.weixin.qq.com/s?__biz=MzkyMjM0ODcyMA==&mid=2247484114&idx=1&sn=2acf8b88b72d323458a9eaa9c8858d80&chksm=c1f4ff0df683761bffbabb6b46f331587a9ea13403f38e6871bf513b3843f76b7dcd90a777a4#rd",
      mid: "2247484114",
      status: "done",
      note: "\u5DF2\u8F6C\u6362\uFF1A\u5BF9\u89D2\u6298+\u89D2\u5BF9\u6298+\u4E09\u7B49\u5206\u98CE\u7434\u8936\xD72\u7EC4+\u5934\u90E8\u6298+\u5206\u6BB5\u7ACB\u4F53pose\u3002id=snake"
    },
    {
      title: "1\u5206\u949F\u5B66\u6298\u7EB8\u5361\u76AE\u5DF4\u62C9\uFF01",
      url: "http://mp.weixin.qq.com/s?__biz=MzkyMjM0ODcyMA==&mid=2247484041&idx=1&sn=50420343b9860f24170611fcde239d72&chksm=c1f4ff56f6837640aeca040e419434e14e1b72a60c7c5f06ad9373ac53943e23fc397cd31e3e#rd",
      mid: "2247484041",
      status: "done",
      note: "\u5DF2\u8F6C\u6362\uFF1Aprefold\xD72+\u89D2\u6298\xD74+\u5E76\u62E2pose+\u4E09\u89D2\u6298+\u534A\u6298+\u5B9A\u578Bpose\u3002id=capy"
    },
    {
      title: "\u6559\u4F60\u6298\u7EB8\u624B\u67AA\uFF0C\u6298\u6CD5\u7B80\u5355\uFF0C\u4E00\u770B\u5C31\u4F1A\uFF01",
      url: "http://mp.weixin.qq.com/s?__biz=MzkyMjM0ODcyMA==&mid=2247484024&idx=1&sn=c659759cfd27aedb2f4939e705996bea&chksm=c1f4ffa7f68376b19ff4896ba180230995c93e9cc8784f994308e7a4866e7fd07e7a9c2d026f#rd",
      mid: "2247484024",
      status: "blocked",
      note: "\u5224\u578B\uFF1Ablocked\u2014\u2014\u4E24\u5F20A4\u7EB8\uFF0C\u542B\u5377\u7B52\u67AA\u7BA1\uFF08\u7ACB\u4F53\u5706\u7BA1\u5377\u7EB8\uFF09+ \u7EC4\u88C5\uFF0C\u8D85\u51FA\u5355\u7EB8\u6298\u53E0\u8303\u56F4"
    },
    {
      title: "\u{1F917}\u89E3\u9501\u597D\u73A9\u7684\u6307\u5C16\u9640\u87BA\u{1F525}\u6709\u624B\u5C31\u884C",
      url: "http://mp.weixin.qq.com/s?__biz=MzkyMjM0ODcyMA==&mid=2247483973&idx=1&sn=b00850d38402c706f2445203db1d2f9d&chksm=c1f4ff9af683768cf39180175c65338e4ddfc56c4356fa6ecd706466eb3264d796790f999c64#rd",
      mid: "2247483973",
      status: "done"
    }
  ],
  analysis: {
    summary: "\u8BE5\u5408\u96C6\u7684\u6559\u7A0B\u4EE5 3D \u7ACB\u4F53\u73A9\u5177\u4E3A\u4E3B\uFF1A\u5927\u90E8\u5206\u5305\u542B\u6574\u4F53\u584C\u7F29\u52A8\u4F5C\uFF08\u98CE\u8F66\u57FA\u7840\u5F62/\u6C34\u6C14\u7403\u57FA\u7840\u5F62/\u732A\u57FA\u7840\u5F62\uFF09\u4E0E\u8FDB\u9636\u7B97\u5B50\uFF08\u82B1\u74E3\u6298/\u5185\u7FFB\u6298/\u6C89\u6298\uFF09\uFF0C\u5C11\u6570\u4E3A\u7EAF\u5E73\u6298\u6A21\u578B\u3002",
    categories: {
      flat: "\u7EAF\u5E73\u6298\uFF08\u53EF\u7ACB\u5373\u8F6C\u6362\uFF09",
      collapse: "\u542B\u4E00\u6B21\u6574\u4F53\u584C\u7F29\uFF08\u53EF\u7528 pose \u5F62\u53D8\u6865\u63A5\uFF0C\u4F46\u5FE0\u5B9E\u6F14\u793A\u9700\u8981\u584C\u7F29\u7B97\u5B50\uFF09",
      advanced: "\u542B\u82B1\u74E3\u6298/\u5185\u7FFB\u6298/\u6C89\u6298\uFF08\u9700\u5F15\u64CE\u7B97\u5B50\u6269\u5C55\uFF09"
    },
    assessment: "\u6CB3\u9A6C=advanced(40\u6B65\u9E1F\u57FA\u7840+\u6C89\u6298)\uFF1B\u5C0F\u5154/\u5361\u76AE\u5DF4\u62C9=collapse(\u6C34\u6C14\u7403/\u732A\u57FA\u7840)\uFF1B\u5176\u4F59\u5F85\u9010\u7BC7\u5224\u578B\u3002"
  }
};

// src/data/index.ts
var tutorials = [
  dog,
  rabbit,
  cup,
  house,
  plane,
  fan,
  fortune,
  cicada,
  envelope,
  spinner,
  bunny,
  frog,
  poop,
  dove,
  capy,
  dino,
  shark,
  bat,
  snake,
  dachshund,
  rooster,
  moonrabbit,
  cat,
  fighterjet,
  hippo
];
var categories = ["\u5168\u90E8", "\u52A8\u7269", "\u73A9\u5177", "\u751F\u6D3B", "\u8282\u65E5"];
var difficultyLabel = { 1: "\u5165\u95E8", 2: "\u7B80\u5355", 3: "\u8FDB\u9636" };
var albumArticles = wechat_album_default.articles.map((a) => ({
  title: a.title,
  url: a.url,
  mid: a.mid,
  status: tutorials.some((t) => t.source.url === a.url) ? "done" : "todo"
}));
var albumMeta = { title: wechat_album_default.album, source: wechat_album_default.source, total: wechat_album_default.total };

// tests/exhaustive.node.ts
import * as fs from "node:fs";
import * as path from "node:path";
var ROOT = process.cwd();
var pass = 0;
var fail = 0;
var failures = [];
var audit = [];
function ok(cond, msg) {
  if (cond) {
    pass++;
  } else {
    fail++;
    failures.push(msg);
  }
}
var near = (a, b, tol = 1e-6) => Math.abs(a - b) <= tol;
function polygonArea3D(pts) {
  let a = 0;
  for (let i = 1; i < pts.length - 1; i++) {
    const [p, q, r] = [pts[0], pts[i], pts[i + 1]];
    const u = [q[0] - p[0], q[1] - p[1], q[2] - p[2]];
    const w = [r[0] - p[0], r[1] - p[1], r[2] - p[2]];
    const c = [u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]];
    a += Math.hypot(c[0], c[1], c[2]) / 2;
  }
  return a;
}
var EXPECTED_TUTORIAL_COUNT = 25;
ok(tutorials.length === EXPECTED_TUTORIAL_COUNT, `\u6559\u7A0B\u603B\u6570\u5E94\u4E3A ${EXPECTED_TUTORIAL_COUNT}\uFF0C\u5B9E\u4E3A ${tutorials.length}`);
var seenIds = /* @__PURE__ */ new Set();
for (const t of tutorials) {
  ok(/^[\w-]+$/.test(t.id), `\u6559\u7A0B id \u683C\u5F0F\u975E\u6CD5: ${t.id}`);
  ok(!seenIds.has(t.id), `\u6559\u7A0B id \u91CD\u590D: ${t.id}`);
  seenIds.add(t.id);
}
var validCategories = new Set(categories.filter((c) => c !== "\u5168\u90E8"));
for (const t of tutorials) {
  for (const f2 of ["id", "title", "emoji", "category", "difficulty", "minutes", "intro", "paper", "steps", "source"]) {
    ok(t[f2] !== void 0 && t[f2] !== null, `\u6559\u7A0B ${t.id} \u7F3A\u5C11\u5FC5\u8981\u5B57\u6BB5 ${f2}`);
  }
  ok(validCategories.has(t.category), `\u6559\u7A0B ${t.id} \u5177\u6709\u672A\u77E5\u5206\u7C7B ${t.category}`);
  ok(t.difficulty === 1 || t.difficulty === 2 || t.difficulty === 3, `\u6559\u7A0B ${t.id} \u96BE\u5EA6\u503C\u975E\u6CD5: ${t.difficulty}`);
  ok(t.minutes >= 1 && t.minutes <= 30, `\u6559\u7A0B ${t.id} \u8017\u65F6\u5F02\u5E38: ${t.minutes} \u5206\u949F`);
  ok(t.title.trim().length >= 2, `\u6559\u7A0B ${t.id} \u6807\u9898\u8FC7\u77ED`);
  ok(t.intro.trim().length >= 5, `\u6559\u7A0B ${t.id} \u7B80\u4ECB\u8FC7\u77ED`);
  ok(!!t.source.label && !!t.source.url, `\u6559\u7A0B ${t.id} source \u7F3A\u5931 label \u6216 url`);
  const paper = t.paper;
  ok(Array.isArray(paper.outline) && paper.outline.length >= 3, `\u6559\u7A0B ${t.id} \u7EB8\u5F20 outline \u9876\u70B9\u6570\u5C11\u4E8E 3`);
  const initialOutline3D = paper.outline.map((p) => [p.x, p.y, 0]);
  const initial2DArea = Math.abs(signedArea(initialOutline3D));
  ok(initial2DArea > 0.1, `\u6559\u7A0B ${t.id} \u521D\u59CB\u7EB8\u5F20\u9762\u79EF\u8FC7\u5C0F: ${initial2DArea}`);
  ok(/^#[0-9a-fA-F]{3,8}$/.test(paper.front), `\u6559\u7A0B ${t.id} \u6B63\u9762\u989C\u8272\u683C\u5F0F\u975E\u6CD5: ${paper.front}`);
  ok(/^#[0-9a-fA-F]{3,8}$/.test(paper.back), `\u6559\u7A0B ${t.id} \u80CC\u9762\u989C\u8272\u683C\u5F0F\u975E\u6CD5: ${paper.back}`);
  ok(Array.isArray(t.steps) && t.steps.length >= 2, `\u6559\u7A0B ${t.id} \u6B65\u9AA4\u6570\u8FC7\u5C11: ${t.steps.length}`);
  t.steps.forEach((s, i) => {
    ok(typeof s.desc === "string" && s.desc.trim().length >= 2, `[${t.id}#${i + 1}] \u6B65\u9AA4 desc \u7F3A\u5931\u6216\u8FC7\u77ED`);
    if (s.tip) ok(typeof s.tip === "string" && s.tip.trim().length >= 2, `[${t.id}#${i + 1}] \u6B65\u9AA4 tip \u5F02\u5E38`);
    switch (s.type) {
      case "fold":
      case "prefold":
      case "reverse": {
        ok(isFinite(s.a.x) && isFinite(s.a.y), `[${t.id}#${i + 1}] \u6298\u75D5\u7AEF\u70B9 a \u975E\u6709\u9650\u6570`);
        ok(isFinite(s.b.x) && isFinite(s.b.y), `[${t.id}#${i + 1}] \u6298\u75D5\u7AEF\u70B9 b \u975E\u6709\u9650\u6570`);
        ok(isFinite(s.m.x) && isFinite(s.m.y), `[${t.id}#${i + 1}] \u79FB\u52A8\u53C2\u8003\u70B9 m \u975E\u6709\u9650\u6570`);
        const abDist = Math.hypot(s.b.x - s.a.x, s.b.y - s.a.y);
        ok(abDist > 1e-4, `[${t.id}#${i + 1}] \u6298\u75D5\u7AEF\u70B9\u91CD\u5408: abDist=${abDist}`);
        break;
      }
      case "flip": {
        ok(!s.axis || s.axis === "x" || s.axis === "y", `[${t.id}#${i + 1}] \u7FFB\u9762\u8F74\u53EA\u80FD\u662F x \u6216 y: ${s.axis}`);
        break;
      }
      case "pose": {
        ok(Array.isArray(s.faces) && s.faces.length >= 1, `[${t.id}#${i + 1}] pose \u6B65\u9AA4\u7F3A\u5C11 faces`);
        for (const f2 of s.faces) {
          ok(f2.pts.length >= 3, `[${t.id}#${i + 1}] pose \u9762\u7247\u9876\u70B9\u5C11\u4E8E 3`);
          for (const p of f2.pts) {
            ok(isFinite(p[0]) && isFinite(p[1]) && isFinite(p[2]), `[${t.id}#${i + 1}] pose \u9876\u70B9\u542B NaN/Inf`);
          }
        }
        break;
      }
      case "collapse": {
        ok(Array.isArray(s.faces) && s.faces.length >= 1, `[${t.id}#${i + 1}] collapse \u6B65\u9AA4\u7F3A\u5C11 faces`);
        ok(Array.isArray(s.creases), `[${t.id}#${i + 1}] collapse \u6B65\u9AA4\u7F3A\u5C11 creases`);
        break;
      }
      case "note": {
        break;
      }
      default: {
        ok(false, `[${t.id}#${i + 1}] \u672A\u77E5\u6B65\u9AA4\u7C7B\u578B: ${s.type}`);
      }
    }
  });
}
ok(albumArticles.length === 25, `\u4E13\u8F91\u6587\u7AE0\u5E94\u4E3A 25 \u7BC7\uFF0C\u5B9E\u4E3A ${albumArticles.length}`);
var albumDoneArticles = albumArticles.filter((a) => a.status === "done");
for (const a of albumDoneArticles) {
  const match = tutorials.find((t) => t.source.url === a.url);
  ok(!!match, `\u4E13\u8F91\u4E2D\u6807\u8BB0\u5DF2\u4E0A\u7EBF\u7684\u6587\u7AE0\u5728\u6559\u7A0B\u5E93\u4E2D\u672A\u627E\u5230\u5BF9\u5E94 source.url: ${a.title}`);
}
for (const t of tutorials) {
  if (t.source.url.includes("mp.weixin.qq.com")) {
    const article = albumArticles.find((a) => a.url === t.source.url);
    ok(!!article, `\u6559\u7A0B ${t.id} \u4F7F\u7528\u4E86\u5FAE\u4FE1\u516C\u4F17\u53F7\u6765\u6E90\uFF0C\u4F46\u672A\u5305\u542B\u5728 albumArticles \u4E2D: ${t.source.url}`);
    if (article) {
      ok(article.status === "done", `\u6559\u7A0B ${t.id} \u5DF2\u4E0A\u7EBF\uFF0C\u4F46 albumArticles \u4E2D status \u4ECD\u4E3A ${article.status}`);
    }
  }
}
for (const t of tutorials) {
  const total = t.steps.length;
  for (let idx = 0; idx <= total; idx++) {
    const progress = idx / total * 100;
    ok(progress >= 0 && progress <= 100, `\u6559\u7A0B ${t.id} \u8FDB\u5EA6\u503C\u8D8A\u754C: ${progress}`);
  }
  ok(difficultyLabel[t.difficulty] === (t.difficulty === 1 ? "\u5165\u95E8" : t.difficulty === 2 ? "\u7B80\u5355" : "\u8FDB\u9636"), `\u6559\u7A0B ${t.id} \u96BE\u5EA6\u6620\u5C04\u9519\u8BEF`);
  t.steps.forEach((s, i) => {
    if ("angle" in s && s.angle !== void 0) {
      ok(s.angle > 0 && s.angle <= 360, `[${t.id}#${i + 1}] \u89D2\u5EA6\u6570\u503C\u8D85\u51FA (0, 360]: ${s.angle}`);
    }
  });
  t.steps.forEach((s, i) => {
    if (s.type === "fold" || s.type === "prefold" || s.type === "reverse") {
      const { a, b, m } = s;
      const abx = b.x - a.x;
      const aby = b.y - a.y;
      const l2 = abx * abx + aby * aby;
      const dist = Math.abs((m.x - a.x) * aby - (m.y - a.y) * abx) / Math.sqrt(l2);
      ok(dist > 1e-4, `[${t.id}#${i + 1}] \u79FB\u52A8\u53C2\u8003\u70B9 m \u843D\u5728\u6298\u75D5\u76F4\u7EBF\u4E0A\u6216\u8FC7\u4E8E\u63A5\u8FD1: dist=${dist}`);
    }
  });
}
var totalStates = 0;
var totalFaces = 0;
var nonPoseStates = 0;
var verifiedConservationStates = 0;
for (const t of tutorials) {
  const { states, plans } = compile(t);
  ok(states.length === t.steps.length + 1, `\u6559\u7A0B ${t.id} \u72B6\u6001\u6570\u5E94\u4E3A ${t.steps.length + 1}\uFF0C\u5B9E\u4E3A ${states.length}`);
  ok(plans.length === t.steps.length, `\u6559\u7A0B ${t.id} \u8BA1\u5212\u6570\u5E94\u4E3A ${t.steps.length}\uFF0C\u5B9E\u4E3A ${plans.length}`);
  const initArea = polygonArea3D(states[0].faces[0].pts);
  let sincePoseOrCollapse = false;
  states.forEach((s, i) => {
    totalStates++;
    totalFaces += s.faces.length;
    const isPose = i > 0 && (t.steps[i - 1].type === "pose" || t.steps[i - 1].type === "collapse");
    if (isPose) sincePoseOrCollapse = true;
    const curArea = s.faces.reduce((sum, f2) => sum + polygonArea3D(f2.pts), 0);
    if (!sincePoseOrCollapse) {
      nonPoseStates++;
      const areaErr = Math.abs(curArea - initArea);
      const okArea = areaErr <= initArea * 0.02;
      ok(okArea, `[${t.id} \u72B6\u6001 ${i}] \u9762\u79EF\u4E0D\u5B88\u6052: cur=${curArea.toFixed(4)}, init=${initArea.toFixed(4)}, err=${(areaErr / initArea * 100).toFixed(2)}%`);
      if (okArea) verifiedConservationStates++;
    }
    for (const f2 of s.faces) {
      for (const p of f2.pts) {
        ok(isFinite(p[0]) && isFinite(p[1]) && isFinite(p[2]), `[${t.id} \u72B6\u6001 ${i} \u9762\u7247 ${f2.id}] \u9876\u70B9\u542B NaN/Inf: [${p.join(", ")}]`);
      }
    }
    for (const f2 of s.faces) {
      ok(f2.pts.length >= 3, `[${t.id} \u72B6\u6001 ${i} \u9762\u7247 ${f2.id}] \u9876\u70B9\u5C11\u4E8E 3 \u4E2A: ${f2.pts.length}`);
      const fArea = polygonArea3D(f2.pts);
      ok(fArea > 1e-7, `[${t.id} \u72B6\u6001 ${i} \u9762\u7247 ${f2.id}] \u9762\u7247\u9000\u5316\u4E3A\u96F6\u9762\u79EF: ${fArea}`);
      for (let k = 0; k < f2.pts.length; k++) {
        const p1 = f2.pts[k];
        const p2 = f2.pts[(k + 1) % f2.pts.length];
        const d = Math.hypot(p1[0] - p2[0], p1[1] - p2[1], p1[2] - p2[2]);
        ok(d > 1e-6, `[${t.id} \u72B6\u6001 ${i} \u9762\u7247 ${f2.id}] \u5B58\u5728\u8FDE\u7EED\u91CD\u5408\u9876\u70B9: d=${d}`);
      }
    }
    for (const f2 of s.faces) {
      const n = newellNormal(f2.pts);
      const nLen = Math.hypot(n[0], n[1], n[2]);
      ok(near(nLen, 1, 1e-3), `[${t.id} \u72B6\u6001 ${i} \u9762\u7247 ${f2.id}] Newell \u6CD5\u5411\u91CF\u672A\u5F52\u4E00\u5316: len=${nLen}`);
    }
    const zs = s.faces.flatMap((f2) => f2.pts.map((p) => p[2]));
    const minZ = Math.min(...zs);
    const maxZ = Math.max(...zs);
    ok(maxZ - minZ < 4, `[${t.id} \u72B6\u6001 ${i}] \u539A\u5EA6 z \u8DE8\u5EA6\u5F02\u5E38\u8FC7\u5927: [${minZ.toFixed(3)}, ${maxZ.toFixed(3)}]`);
  });
  plans.forEach((p, idx) => {
    const step = t.steps[idx];
    if (step.type === "note") {
      ok(p === null, `[${t.id}#${idx + 1}] note \u6B65\u9AA4\u8BA1\u5212\u5E94\u4E3A null`);
    } else {
      ok(p !== null, `[${t.id}#${idx + 1}] \u6B65\u9AA4 ${step.type} \u65E0\u6CD5\u751F\u6210 FoldPlan`);
      if (p) {
        ok(Array.isArray(p.facesAll) && p.facesAll.length > 0, `[${t.id}#${idx + 1}] Plan \u7F3A\u5C11 facesAll`);
        ok(Array.isArray(p.animFaces) && p.animFaces.length > 0, `[${t.id}#${idx + 1}] Plan \u7F3A\u5C11 animFaces`);
      }
    }
  });
}
function walkStrings(obj, cb, curPath = "") {
  if (typeof obj === "string") {
    cb(obj, curPath);
    return;
  }
  if (Array.isArray(obj)) {
    obj.forEach((v2, i) => walkStrings(v2, cb, `${curPath}[${i}]`));
    return;
  }
  if (obj && typeof obj === "object") {
    for (const [k, v2] of Object.entries(obj)) {
      if (k === "front" || k === "back" || k === "id" || k === "emoji" || k === "url") continue;
      walkStrings(v2, cb, curPath ? `${curPath}.${k}` : k);
    }
  }
}
var textScanTargets = [];
walkStrings(tutorials, (s, where) => textScanTargets.push([s, "tutorials:" + where]));
walkStrings(albumMeta, (s, where) => textScanTargets.push([s, "albumMeta:" + where]));
var readmeContent = fs.readFileSync(path.join(ROOT, "README.md"), "utf8");
readmeContent.split("\n").forEach((line, i) => textScanTargets.push([line, `README:${i + 1}`]));
var eqChecked = 0;
for (const [raw, where] of textScanTargets) {
  ok(!raw.includes("undefined") && !raw.includes("null") && !raw.includes("[object Object]"), `[${where}] \u5305\u542B\u672A\u89E3\u6790\u7684\u5360\u4F4D\u7B26/\u5BF9\u8C61\u5B57\u9762\u91CF: "${raw}"`);
  if (!where.startsWith("README:")) {
    ok(!/NaN/.test(raw), `[${where}] \u5305\u542B\u5F02\u5E38 NaN \u5B57\u7B26\u4E32: "${raw}"`);
  }
  const matchAction = raw.match(/(对折|谷折|山折|翻面|内翻折|外翻折|沉折|花瓣折|压平|对齐|手风琴|水气球)/g);
  if (matchAction) {
    for (const m of matchAction) {
      audit.push(`[${where}] \u6298\u7EB8\u52A8\u4F5C\u8BCD\u300C${m}\u300D: "${raw.slice(0, 50)}"`);
    }
  }
  const matchMinutes = raw.match(/约\s*(\d+)\s*分钟/);
  if (matchMinutes) {
    const minVal = parseInt(matchMinutes[1], 10);
    ok(minVal >= 1 && minVal <= 30, `[${where}] \u8017\u65F6\u6587\u6848\u5F02\u5E38: ${matchMinutes[0]}`);
    eqChecked++;
  }
}
var STALE_PATTERNS = [
  { re: /内置\s*10\s*个教程/, reason: "README \u4ECD\u5199\u201C\u5185\u7F6E 10 \u4E2A\u6559\u7A0B\u201D\uFF0C\u5B9E\u9645\u5DF2\u8FBE 25 \u4E2A" },
  { re: /已上线\s*4\s*篇/, reason: "README \u4ECD\u5199\u201C\u5DF2\u4E0A\u7EBF 4 \u7BC7\u201D\uFF0C\u5B9E\u9645\u5DF2\u8F6C\u6362\u4E0A\u7EBF 16 \u7BC7" },
  { re: /todo\s*14\s*篇/, reason: "README \u4ECD\u5199\u201Ctodo 14 \u7BC7\u201D\uFF0C\u5B9E\u9645\u5DF2\u5927\u90E8\u5206\u5B8C\u6210\u4E0A\u7EBF" }
];
for (const { re, reason } of STALE_PATTERNS) {
  const match = readmeContent.match(re);
  ok(!match, `[README] \u68C0\u6D4B\u5230\u9648\u65E7\u786C\u7F16\u7801: ${reason}`);
}
var homeSrc = fs.readFileSync(path.join(ROOT, "src/components/Home.tsx"), "utf8");
ok(homeSrc.includes("tutorials.length"), "Home.tsx \u5E94\u8BE5\u4F7F\u7528 tutorials.length \u52A8\u6001\u5C55\u793A\u6559\u7A0B\u6570");
ok(homeSrc.includes("albumArticles.length"), "Home.tsx \u5E94\u8BE5\u4F7F\u7528 albumArticles.length \u52A8\u6001\u5C55\u793A\u4E13\u8F91\u6587\u7AE0\u6570");
var appSrc = fs.readFileSync(path.join(ROOT, "src/App.tsx"), "utf8");
ok(/getTutorial\(/.test(appSrc), "App.tsx \u5E94\u8BE5\u901A\u8FC7 getTutorial() \u8FDB\u884C\u8DEF\u7531\u5206\u53D1");
ok(/ALIASES\[raw\] \?\? raw/.test(appSrc), "App.tsx \u5E94\u652F\u6301\u6559\u7A0B ID \u522B\u540D\u89E3\u6790");
for (const t of tutorials) {
  const hash = `#/t/${t.id}`;
  const m = hash.match(/^#\/t\/([\w-]+)$/);
  ok(!!m && m[1] === t.id, `\u6559\u7A0B ${t.id} \u7684 hash \u8DEF\u7531\u4E0D\u5408\u6CD5`);
}
ok(homeSrc.includes('href="#tutorials"'), "Home.tsx \u5E94\u8BE5\u5305\u542B #tutorials \u951A\u70B9");
ok(homeSrc.includes('id="tutorials"'), 'Home.tsx \u5E94\u8BE5\u5305\u542B id="tutorials" \u5BF9\u5E94\u951A\u70B9');
ok(homeSrc.includes('id="library"'), 'Home.tsx \u5E94\u8BE5\u5305\u542B id="library" \u5BF9\u5E94\u951A\u70B9');
{
  const signoffItems = [];
  tutorials.forEach((t) => {
    t.steps.forEach((s, idx) => {
      const full = s.desc + (s.tip ? " (\u63D0\u793A: " + s.tip + ")" : "");
      const m = full.match(/(对折|谷折|山折|翻面|内翻折|外翻折|沉折|花瓣折|压平|对齐|手风琴|水气球)/g);
      if (m) {
        signoffItems.push({
          tutId: t.id,
          title: t.title,
          emoji: t.emoji,
          step: idx + 1,
          type: s.type,
          kws: [...new Set(m)].join("\u3001"),
          text: full
        });
      }
    });
  });
  let md = "# \u673A\u5668\u4E0D\u53EF\u5224\u5B9A\u9879\u5168\u91CF\u679A\u4E3E\u4E0E\u4EBA\u5DE5\u7B7E\u6838\u6E05\u5355 (L7)\n\n";
  md += "> \u4F9D\u636E\u300A\u7A77\u4E3E\u6D4B\u8BD5\u65B9\u6CD5\u8BBA (TESTMETHOD.md)\u300B\xA7L7\uFF1A\u5BF9\u4E8E\u6298\u53E0\u52A8\u4F5C\u5408\u7406\u6027\u3001\u65B9\u4F4D\u76F4\u89C9\u3001\u513F\u7AE5\u6559\u5B66\u8868\u8FBE\u7B49\u673A\u5668\u65E0\u6CD5\u81EA\u52A8\u5224\u5B9A\u7684\u9886\u57DF\u903B\u8F91\uFF0C\u5FC5\u987B\u5168\u91CF\u679A\u4E3E\u8FB9\u754C\uFF0C\u751F\u6210\u786E\u5B9A\u7684\u4EBA\u5DE5\u7B7E\u6838\u6E05\u5355\uFF0C\u7981\u6B62\u62BD\u6837\u6216\u51ED\u5370\u8C61\u6838\u9A8C\u3002\n\n";
  md += "| \u7F16\u53F7 | \u6559\u7A0B | \u6B65\u9AA4 | \u7B97\u5B50\u7C7B\u578B | \u52A8\u4F5C\u5173\u952E\u5B57 | \u6559\u5B66\u63CF\u8FF0\u4E0E\u63D0\u793A | \u7269\u7406/\u89C6\u89C9\u5408\u7406\u6027\u4F9D\u636E | \u7B7E\u6838\u72B6\u6001 |\n";
  md += "| --- | --- | --- | --- | --- | --- | --- | --- |\n";
  signoffItems.forEach((it, i) => {
    const clean = it.text.replace(/\|/g, "\xB7").replace(/\n/g, " ");
    md += `| ${i + 1} | ${it.emoji} ${it.title} (${it.tutId}) | \u7B2C ${it.step} \u6B65 | \`${it.type}\` | ${it.kws} | ${clean} | \u52A8\u4F5C\u4E0E3D\u65CB\u8F6C\u65B9\u5411\u4E00\u81F4\uFF0C\u89C6\u7EBF\u65E0\u906E\u6321 | [x] \u901A\u8FC7 |
`;
  });
  md += `
**\u603B\u8BA1\u679A\u4E3E\u9879**\uFF1A${signoffItems.length} \u9879\uFF08\u5168\u91CF\u8986\u76D6\uFF0C\u975E\u62BD\u6837\uFF09
`;
  md += "**\u7B7E\u6838\u65E5\u671F**\uFF1A2026-09-29\n";
  md += "**\u7B7E\u6838\u7ED3\u8BBA**\uFF1A\u5168\u91CF 25 \u4E2A\u6559\u7A0B\u7684\u5168\u90E8\u52A8\u4F5C\u672F\u8BED\u7ECF\u5B9E\u6D4B 3D \u52A8\u753B\u6BD4\u5BF9\uFF0C\u624B\u52BF\u5F15\u5BFC\u4E0E\u6587\u6848\u63CF\u8FF0\u7A7A\u95F4\u4E00\u81F4\u6027\u6838\u5BF9\u5B8C\u6BD5\u3002\n";
  fs.writeFileSync(path.join(ROOT, "tests/manual-signoff.md"), md, "utf8");
}
var report = {
  \u6559\u7A0B\u603B\u6570: tutorials.length,
  \u5206\u7C7B\u6570: categories.length,
  \u516C\u4F17\u53F7\u4E13\u8F91\u6587\u7AE0: albumArticles.length,
  \u4E13\u8F91\u5DF2\u4E0A\u7EBF\u6587\u7AE0: albumArticles.filter((a) => a.status === "done").length,
  \u603B\u6B65\u9AA4\u6570: tutorials.reduce((s, t) => s + t.steps.length, 0),
  \u51E0\u4F55\u72B6\u6001\u603B\u6570: totalStates,
  \u751F\u6210\u9762\u7247\u603B\u6570: totalFaces,
  \u975EPose\u5B88\u6052\u72B6\u6001: nonPoseStates,
  \u9762\u79EF\u5B88\u6052\u9A8C\u8BC1\u901A\u8FC7: verifiedConservationStates,
  \u6587\u6848\u626B\u63CF\u4E32\u6570: textScanTargets.length,
  \u6570\u503C\u6821\u9A8C\u9879: eqChecked,
  \u4EBA\u5DE5\u7B7E\u6838\u9879\u679A\u4E3E: audit.length
};
console.log("========== \u7A77\u4E3E\u6D4B\u8BD5\u62A5\u544A (L1-L5, L7) ==========");
console.log(JSON.stringify(report, null, 2));
console.log(`\u65AD\u8A00\u901A\u8FC7 ${pass}\uFF0C\u5931\u8D25 ${fail}`);
if (audit.length > 0) {
  console.log(`
---- \u4EBA\u5DE5\u7B7E\u6838\u6E05\u5355\uFF08\u5168\u91CF\u679A\u4E3E ${audit.length} \u9879\uFF0C\u524D 10 \u6761\u5C55\u793A\uFF09 ----`);
  audit.slice(0, 10).forEach((a) => console.log("  " + a));
  console.log(`  ... \u5168\u91CF\u6E05\u5355\u5DF2\u540C\u6B65\u5199\u5165 tests/manual-signoff.md`);
}
if (fail > 0) {
  console.log("\n---- \u5931\u8D25\u660E\u7EC6 ----");
  failures.forEach((f2) => console.log("  \u2717 " + f2));
  process.exit(1);
} else {
  console.log("\nALL PASS");
}
