// 引擎自检脚本：编译每个教程，检查面积守恒与几何合理性。
// pose 步骤是立体聚合（如风车基础形），纸面会被收进锥体/层内，不满足面积守恒，
// 因此只做 NaN/可编译检查。运行：node scripts/run-check.mjs
import { compile } from '../src/engine/fold';
import { tutorials } from '../src/data';

function faceArea(pts: number[][]): number {
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

let failures = 0;
for (const t of tutorials) {
  const { states } = compile(t);
  const initialArea = faceArea(states[0].faces[0].pts);
  const lines: string[] = [];
  let sincePose = false;
  states.forEach((s, i) => {
    const isPose = i > 0 && (t.steps[i - 1] as { type?: string }).type === 'pose';
    if (isPose) sincePose = true;
    const area = s.faces.reduce((sum, f) => sum + faceArea(f.pts), 0);
    const zs = s.faces.flatMap((f) => f.pts.map((p) => p[2]));
    const stacks = [...new Set(s.faces.map((f) => f.stack))].sort((a, b) => a - b);
    const bad = s.faces.some((f) => f.pts.some((p) => !isFinite(p[0]) || !isFinite(p[1]) || !isFinite(p[2])));
    const areaBad = !sincePose && Math.abs(area - initialArea) > initialArea * 0.02;
    if (bad || areaBad) failures++;
    lines.push(
      `  step ${i}: faces=${s.faces.length} area=${area.toFixed(3)}(init ${initialArea.toFixed(3)})` +
        ` z∈[${Math.min(...zs).toFixed(3)},${Math.max(...zs).toFixed(3)}] stacks=${stacks.join(',')}` +
        (isPose ? ' [pose]' : '') +
        (bad ? ' ⚠️NaN' : '') + (areaBad ? ' ⚠️面积' : ''),
    );
  });
  console.log(`\n${t.emoji} ${t.title} (${t.id})`);
  console.log(lines.join('\n'));
}
console.log(failures === 0 ? '\n✅ 全部通过' : `\n❌ ${failures} 处异常`);
