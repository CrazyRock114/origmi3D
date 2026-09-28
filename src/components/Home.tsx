import { albumArticles, albumMeta, categories, difficultyLabel, tutorials } from '../data';

function Stars({ n }: { n: number }) {
  return <span className="tracking-tight text-amber-500">{'★'.repeat(n)}<span className="text-amber-200">{'★'.repeat(3 - n)}</span></span>;
}

export default function Home() {
  return (
    <div className="mx-auto max-w-6xl px-5 pb-16">
      {/* 顶部导航 */}
      <header className="flex items-center justify-between py-5">
        <div className="flex items-center gap-2 text-xl font-black text-orange-600">
          <span className="text-2xl">🦊</span> 折纸星球
        </div>
        <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-bold text-orange-500 shadow-sm">
          3D 折纸教学 · 内测版
        </span>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-orange-100 via-rose-50 to-sky-100 px-8 py-12 shadow-inner sm:px-12 sm:py-16">
        <div className="pointer-events-none absolute -right-8 -top-8 text-[10rem] opacity-15 select-none">📦</div>
        <div className="pointer-events-none absolute bottom-2 right-24 text-[5rem] opacity-15 select-none">🐸</div>
        <p className="mb-3 inline-block rounded-full bg-white/80 px-3 py-1 text-xs font-bold text-orange-500">
          把图文 / 视频教程，变成会动的 3D 演示
        </p>
        <h1 className="max-w-2xl text-4xl font-black leading-snug text-stone-800 sm:text-5xl">
          每一折，都能转着圈看清楚
        </h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-stone-600">
          折纸星球把经典儿童折纸的每一个步骤变成 3D 动画：可以暂停、回看、旋转放大，
          再也不怕跟不上视频里那一折。适合 4~10 岁的小朋友和陪折的大人。
        </p>
        <a
          href="#tutorials"
          className="btn-pop mt-7 inline-block rounded-full bg-orange-500 px-7 py-3 text-base font-bold text-white shadow-lg shadow-orange-500/30 hover:bg-orange-600"
        >
          挑一个开始折 ↓
        </a>
      </section>

      {/* 教程网格 */}
      <section id="tutorials" className="mt-12 scroll-mt-6">
        <div className="mb-5 flex items-end justify-between">
          <h2 className="text-2xl font-black text-stone-800">今天折点什么？</h2>
          <span className="text-sm text-stone-500">共 {tutorials.length} 个经典教程</span>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {categories.slice(1).map((cat) => (
            <div key={cat} className="col-span-full">
              <h3 className="mb-3 mt-4 flex items-center gap-2 text-lg font-bold text-stone-700">
                <span className="h-2 w-2 rounded-full bg-orange-400" />{cat}
              </h3>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {tutorials
                  .filter((t) => t.category === cat)
                  .map((t) => (
                    <a
                      key={t.id}
                      href={`#/t/${t.id}`}
                      className="card-hover group flex flex-col rounded-3xl bg-white/85 p-5 shadow-md shadow-orange-900/5 ring-1 ring-orange-900/5"
                    >
                      <div className="flex items-start justify-between">
                        <span className="text-5xl drop-shadow-sm">{t.emoji}</span>
                        <span className="rounded-full bg-orange-50 px-2.5 py-1 text-xs font-bold text-orange-500">
                          {difficultyLabel[t.difficulty]}
                        </span>
                      </div>
                      <h4 className="mt-4 text-xl font-black text-stone-800 group-hover:text-orange-600">{t.title}</h4>
                      <p className="mt-1 line-clamp-2 min-h-10 text-sm text-stone-500">{t.intro}</p>
                      <div className="mt-4 flex items-center justify-between border-t border-dashed border-orange-900/10 pt-3 text-xs text-stone-400">
                        <span>{t.steps.length} 步 · 约 {t.minutes} 分钟</span>
                        <Stars n={t.difficulty} />
                      </div>
                    </a>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 教程库：公众号「折纸造物记」 */}
      <section id="library" className="mt-14 scroll-mt-6">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
          <h2 className="text-2xl font-black text-stone-800">
            📚 教程库 · {albumMeta.title}
          </h2>
          <span className="text-sm text-stone-500">
            来源：公众号「{albumMeta.source}」 · {albumArticles.length} 篇 · 已上线 {tutorials.length} 个
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {albumArticles.map((a) => {
            const done = tutorials.find((t) => t.source.url === a.url);
            return done ? (
              <a
                key={a.mid}
                href={`#/t/${done.id}`}
                className="card-hover flex flex-col rounded-2xl bg-white/90 p-4 shadow-sm ring-1 ring-emerald-600/20"
              >
                <div className="flex items-center justify-between">
                  <span className="text-3xl">{done.emoji}</span>
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-600">
                    已上线
                  </span>
                </div>
                <span className="mt-2 text-sm font-bold leading-snug text-stone-800">{done.title}</span>
                <span className="mt-1 text-[11px] text-stone-400">原文：{a.title.slice(0, 16)}…</span>
              </a>
            ) : (
              <div
                key={a.mid}
                className="flex flex-col rounded-2xl bg-stone-100/80 p-4 ring-1 ring-stone-900/5"
                title="转换中，敬请期待"
              >
                <div className="flex items-center justify-between">
                  <span className="text-3xl opacity-30 grayscale">📄</span>
                  <span className="rounded-full bg-stone-200 px-2 py-0.5 text-[11px] font-bold text-stone-500">
                    待转换
                  </span>
                </div>
                <span className="mt-2 line-clamp-2 text-sm font-bold leading-snug text-stone-500">{a.title}</span>
                <a
                  className="mt-1 text-[11px] text-stone-400 underline decoration-dotted hover:text-orange-500"
                  href={a.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  查看原文 ↗
                </a>
              </div>
            );
          })}
        </div>
      </section>

      {/* 核心能力 / 路线图 */}
      <section className="mt-14 grid gap-5 md:grid-cols-3">
        <div className="rounded-3xl bg-white/85 p-6 shadow-sm ring-1 ring-orange-900/5">
          <div className="text-3xl">🧭</div>
          <h3 className="mt-3 text-lg font-black text-stone-800">步骤 → 3D 演示</h3>
          <p className="mt-2 text-sm leading-relaxed text-stone-600">
            自研折纸引擎：折痕分割、正折 / 反折、翻面、分层折叠全部真实模拟，
            任何教程只要写成「步骤指令」就能播放成 3D 动画。
          </p>
        </div>
        <div className="rounded-3xl bg-white/85 p-6 shadow-sm ring-1 ring-orange-900/5">
          <div className="text-3xl">📄</div>
          <h3 className="mt-3 text-lg font-black text-stone-800">教程中间格式（IR）</h3>
          <p className="mt-2 text-sm leading-relaxed text-stone-600">
            每个教程是一份 JSON 指令（纸张、折痕坐标、翻折方向、讲解词），
            图文教程、视频教程都可以被转换成这份格式。
          </p>
        </div>
        <div className="rounded-3xl bg-white/85 p-6 shadow-sm ring-1 ring-orange-900/5">
          <div className="text-3xl">🔌</div>
          <h3 className="mt-3 text-lg font-black text-stone-800">
            外部教程导入 <span className="ml-1 rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-600">规划中</span>
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-stone-600">
            后续接入微信公众号文章、B 站视频、小红书笔记链接：
            AI 解析出分步折法 → 人工校对 → 自动生成 3D 演示。
          </p>
        </div>
      </section>

      <footer className="mt-14 border-t border-orange-900/10 pt-6 text-center text-xs text-stone-400">
        折纸星球 OrigamiPlanet · 步骤参考公开折纸教程（Origami Fun / Origami.me / Origami.guide）整理 · 用 ❤️ 和 Three.js 折成
      </footer>
    </div>
  );
}
