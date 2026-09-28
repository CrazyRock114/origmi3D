import { useEffect, useRef, useState } from 'react';
import type { PlayerStatus } from '../engine/player';
import { Player } from '../engine/player';
import { OrigamiScene } from '../engine/scene';
import type { Step, Tutorial } from '../engine/fold';
import { difficultyLabel } from '../data';

const SPEEDS = [
  { label: '慢', value: 0.6 },
  { label: '正常', value: 1 },
  { label: '快', value: 1.5 },
];

function stepIcon(step: Step): string {
  switch (step.type) {
    case 'fold':
      return step.dir === 'valley' ? '山谷折 ⌄' : '山折 ⌃';
    case 'reverse':
      return step.dir === 'inside' ? '内翻折 ⇄' : '外翻折 ⇆';
    case 'prefold':
      return '折痕 ┄';
    case 'flip':
      return '翻面 ↻';
    case 'pose':
      return '聚合 ✨';
    case 'collapse':
      return '塌缩 ✦';
    case 'note':
      return '小贴士 📌';
    default:
      return '完成 🎉';
  }
}

export default function TutorialPage({ tutorial }: { tutorial: Tutorial }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<Player | null>(null);
  const [status, setStatus] = useState<PlayerStatus | null>(null);
  const [speed, setSpeed] = useState(1);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const scene = new OrigamiScene(container);
    const player = new Player(scene, tutorial);
    playerRef.current = player;
    (window as unknown as Record<string, unknown>).__player = player;
    const unsub = player.subscribe(setStatus);
    const ro = new ResizeObserver(() => scene.resize());
    ro.observe(container);
    return () => {
      unsub();
      ro.disconnect();
      player.dispose();
      playerRef.current = null;
    };
  }, [tutorial]);

  useEffect(() => {
    playerRef.current?.setSpeed(speed);
  }, [speed]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const p = playerRef.current;
      if (!p) return;
      // 输入控件聚焦时不劫持按键
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.key === 'ArrowRight') p.next();
      else if (e.key === 'ArrowLeft') p.prev();
      else if (e.key === ' ') {
        e.preventDefault();
        p.status().playing ? p.pause() : p.play();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const player = playerRef.current;
  const idx = status?.idx ?? 0;
  const total = status?.total ?? tutorial.steps.length;
  const current: Step | null = status?.currentStep ?? null;
  const finished = idx >= total;
  const activeStepIdx = Math.min(idx, total - 1);

  return (
    <div className="mx-auto max-w-7xl px-4 pb-10">
      {/* 顶栏 */}
      <header className="flex flex-wrap items-center gap-3 py-4">
        <a
          href="#/"
          className="btn-pop rounded-full bg-white/80 px-4 py-2 text-sm font-bold text-stone-600 shadow-sm ring-1 ring-orange-900/10 hover:text-orange-600"
        >
          ← 返回
        </a>
        <h1 className="flex items-center gap-2 text-xl font-black text-stone-800">
          <span className="text-3xl">{tutorial.emoji}</span>
          {tutorial.title}
        </h1>
        <span className="rounded-full bg-orange-50 px-2.5 py-1 text-xs font-bold text-orange-500">
          {difficultyLabel[tutorial.difficulty]} · {total} 步 · 约 {tutorial.minutes} 分钟
        </span>
        <a
          className="ml-auto hidden text-xs text-stone-400 underline decoration-dotted hover:text-orange-500 sm:block"
          href={tutorial.source.url}
          target="_blank"
          rel="noreferrer"
        >
          步骤参考：{tutorial.source.label}
        </a>
      </header>

      <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
        {/* 3D 视图 */}
        <div className="canvas-shell relative h-[52vh] overflow-hidden rounded-3xl lg:h-[72vh]">
          <div ref={containerRef} className="absolute inset-0" />
          {/* 播放控制条 */}
          <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-center gap-2 bg-gradient-to-t from-white/85 to-transparent px-4 pb-3 pt-8">
            <button
              className="btn-pop rounded-full bg-white px-4 py-2 text-sm font-bold text-stone-600 shadow ring-1 ring-orange-900/10 disabled:opacity-40"
              disabled={idx === 0 || !!status?.animating}
              onClick={() => player?.prev()}
            >
              ← 上一步
            </button>
            {!status?.playing ? (
              <button
                className="btn-pop rounded-full bg-orange-500 px-5 py-2 text-sm font-black text-white shadow-lg shadow-orange-500/30 hover:bg-orange-600"
                onClick={() => player?.play()}
              >
                ▶ {idx === 0 ? '开始播放' : '继续播放'}
              </button>
            ) : (
              <button
                className="btn-pop rounded-full bg-stone-700 px-5 py-2 text-sm font-black text-white shadow"
                onClick={() => player?.pause()}
              >
                ⏸ 暂停
              </button>
            )}
            <button
              className="btn-pop rounded-full bg-white px-4 py-2 text-sm font-bold text-stone-600 shadow ring-1 ring-orange-900/10 disabled:opacity-40"
              disabled={finished || !!status?.animating}
              onClick={() => player?.next()}
            >
              下一步 →
            </button>
            <button
              className="btn-pop rounded-full bg-white px-4 py-2 text-sm font-bold text-stone-600 shadow ring-1 ring-orange-900/10"
              onClick={() => player?.reset()}
            >
              ↺ 重来
            </button>
            <div className="ml-auto flex items-center gap-1 rounded-full bg-white/90 p-1 shadow ring-1 ring-orange-900/10">
              {SPEEDS.map((s) => (
                <button
                  key={s.value}
                  className={`rounded-full px-3 py-1 text-xs font-bold transition-colors ${
                    speed === s.value ? 'bg-orange-500 text-white' : 'text-stone-500 hover:text-orange-500'
                  }`}
                  onClick={() => setSpeed(s.value)}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
          {/* 进度点 */}
          <div className="absolute left-4 top-4 flex max-w-[85%] flex-wrap gap-1.5">
            {Array.from({ length: total + 1 }, (_, i) => (
              <button
                key={i}
                title={i === 0 ? '开始' : `第 ${i} 步后`}
                className={`h-2.5 rounded-full transition-all ${
                  i === idx ? 'w-7 bg-orange-500' : i < idx ? 'w-2.5 bg-orange-300' : 'w-2.5 bg-stone-300/80'
                }`}
                onClick={() => player?.goto(i)}
              />
            ))}
          </div>
          <p className="pointer-events-none absolute right-4 top-3 rounded-full bg-white/70 px-3 py-1 text-[11px] text-stone-400">
            拖动旋转 · 滚轮缩放 · 空格播放
          </p>
        </div>

        {/* 步骤面板 */}
        <aside className="flex flex-col gap-4">
          <div className="rounded-3xl bg-white/90 p-5 shadow-md shadow-orange-900/5 ring-1 ring-orange-900/5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold tracking-wider text-orange-400">
                {finished ? '全部完成' : `第 ${idx + 1} 步 / 共 ${total} 步`}
              </span>
              {!finished && current && (
                <span className="rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-bold text-sky-500">
                  {stepIcon(current)}
                </span>
              )}
            </div>
            <p className="mt-3 text-lg font-bold leading-relaxed text-stone-800">
              {finished ? '🎉 太棒了，作品完成！' : current?.desc}
            </p>
            {!finished && current?.tip && (
              <p className="mt-3 rounded-2xl bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-700">
                💡 {current.tip}
              </p>
            )}
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-orange-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-orange-400 to-rose-400 transition-all duration-500"
                style={{ width: `${(idx / total) * 100}%` }}
              />
            </div>
          </div>

          {/* 步骤列表 */}
          <div className="max-h-[34vh] flex-1 overflow-y-auto rounded-3xl bg-white/70 p-3 ring-1 ring-orange-900/5 lg:max-h-none">
            <ol className="space-y-1.5">
              <li>
                <button
                  className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm ${
                    idx === 0 ? 'bg-orange-100 font-bold text-orange-600' : 'text-stone-600 hover:bg-orange-50'
                  }`}
                  onClick={() => player?.goto(0)}
                >
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white text-xs font-black shadow-sm ring-1 ring-orange-900/10">
                    起
                  </span>
                  准备一张正方形纸
                </button>
              </li>
              {tutorial.steps.map((s, i) => (
                <li key={i}>
                  <button
                    className={`flex w-full items-start gap-3 rounded-2xl px-3 py-2.5 text-left text-sm ${
                      i === activeStepIdx
                        ? 'bg-orange-100 font-bold text-orange-600'
                        : i < idx
                          ? 'text-stone-400'
                          : 'text-stone-600 hover:bg-orange-50'
                    }`}
                    onClick={() => player?.goto(i + 1)}
                  >
                    <span
                      className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-black shadow-sm ring-1 ring-orange-900/10 ${
                        i < idx ? 'bg-orange-400 text-white ring-0' : 'bg-white'
                      }`}
                    >
                      {i < idx ? '✓' : i + 1}
                    </span>
                    <span className="leading-relaxed">{s.desc}</span>
                  </button>
                </li>
              ))}
            </ol>
          </div>
        </aside>
      </div>
    </div>
  );
}
