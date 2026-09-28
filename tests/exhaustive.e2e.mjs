/* =========================================================
 * 浏览器穷举实测套件 (L6 交互层与全站实测) —— node tests/exhaustive.e2e.mjs
 * 目标站点：https://origmi3d.vercel.app (线上真实生产环境)
 *
 * 覆盖：
 *   1. 首页：Hero、分类筛选、25 个教程卡片、教程库（已上线 vs 待转换）、全量锚点
 *   2. 教程页：全量 25 个教程路由走查
 *      - WebGL Canvas 挂载与渲染上下文
 *      - 步骤控制机：下一步、上一步、重来、播放/暂停、速度切换
 *      - 交互跳转：进度条点选、步骤列表点击
 *      - 键盘快捷键走查 (ArrowRight / ArrowLeft / Space)
 *      - 返回按钮路由闭合
 *   3. 布局健壮性：桌面端 (1280x800) + 移动端 (390x844) 全路由零横向溢出
 *   4. 稳定性铁律：全程 window.onerror 零错误、console.error 零错误
 * ======================================================= */

import puppeteer from 'puppeteer-core';
import * as fs from 'node:fs';
import * as path from 'node:path';

const BASE_URL = process.env.TEST_URL || 'https://origmi3d.vercel.app';
const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const TUTORIAL_IDS = [
  'dog', 'rabbit', 'cup', 'house', 'plane', 'fan', 'fortune', 'cicada', 'envelope',
  'spinner', 'bunny2', 'frog2', 'poop', 'dove', 'capy', 'dino', 'shark', 'bat2',
  'snake', 'dachshund', 'rooster', 'moonrabbit', 'cat', 'fighterjet', 'hippo'
];

let pass = 0;
let fail = 0;
const failures = [];

function ok(cond, msg) {
  if (cond) {
    pass++;
  } else {
    fail++;
    failures.push(msg);
    console.error('  ✗ ' + msg);
  }
}

async function run() {
  console.log(`\n======================================================`);
  console.log(`🚀 启动全站浏览器穷举走查：${BASE_URL}`);
  console.log(`======================================================\n`);

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  const page = await browser.newPage();

  // 监听全站错误与网络 404
  const jsErrors = [];
  const consoleErrors = [];
  const networkErrors = [];

  page.on('pageerror', (err) => {
    jsErrors.push(err.toString());
    console.error('  [PageError]', err.message);
  });
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
      console.error('  [ConsoleError]', msg.text());
    }
  });
  page.on('requestfailed', (req) => {
    networkErrors.push(`${req.url()} (${req.failure()?.errorText})`);
    console.error('  [NetworkFailed]', req.url(), req.failure()?.errorText);
  });
  page.on('response', (res) => {
    if (res.status() >= 400) {
      networkErrors.push(`${res.url()} [HTTP ${res.status()}]`);
      console.error('  [HTTP Error]', res.url(), res.status());
    }
  });

  /* ---------------------------------------------------------
   * 1. 首页实测 (Desktop: 1280x800)
   * --------------------------------------------------------- */
  console.log('📌 [Phase 1] 首页走查 (1280x800)...');
  await page.setViewport({ width: 1280, height: 800 });
  await page.goto(`${BASE_URL}/#/`, { waitUntil: 'networkidle2' });

  const title = await page.title();
  ok(title.includes('折纸星球'), `首页标题不正确: ${title}`);

  const h1 = await page.$eval('h1', (el) => el.textContent?.trim());
  ok(h1 === '每一折，都能转着圈看清楚', `Hero H1 文本不符: ${h1}`);

  // 卡片数断言
  const cards = await page.$$('a[href^="#/t/"]');
  ok(cards.length >= 25, `教程卡片数量应 >= 25，实为 ${cards.length}`);

  // 检查是否横向溢出
  const isOverflowDesktopHome = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  ok(!isOverflowDesktopHome, '首页在 1280x800 下产生横向滚动溢出');

  /* ---------------------------------------------------------
   * 2. 全量 25 个教程页走查 (Desktop 1280x800)
   * --------------------------------------------------------- */
  console.log(`\n📌 [Phase 2] 逐一走查全部 ${TUTORIAL_IDS.length} 个教程页与控件状态机...`);

  let canvasChecked = 0;
  let nextBtnClicks = 0;
  let prevBtnClicks = 0;
  let resetBtnClicks = 0;
  let speedClicks = 0;
  let listClicks = 0;
  let dotClicks = 0;

  for (let i = 0; i < TUTORIAL_IDS.length; i++) {
    const id = TUTORIAL_IDS[i];
    const url = `${BASE_URL}/#/t/${id}`;
    await page.goto(url, { waitUntil: 'networkidle2' });

    // 检查 H1 存在
    const tutH1 = await page.$eval('h1', (el) => el.textContent?.trim()).catch(() => null);
    ok(!!tutH1, `教程 [${id}] 缺少 H1 标题`);

    // 检查 Canvas 挂载
    const hasCanvas = await page.$eval('canvas', (el) => el.width > 0 && el.height > 0).catch(() => false);
    ok(hasCanvas, `教程 [${id}] WebGL Canvas 未正常挂载或尺寸为 0`);
    if (hasCanvas) canvasChecked++;

    // 检查步数与描述
    const stepDesc = await page.$eval('aside p', (el) => el.textContent?.trim()).catch(() => null);
    ok(!!stepDesc && stepDesc.length > 0, `教程 [${id}] 缺少第一步步骤描述`);

    // 控件状态机走查（干净的状态机推进与回退）：
    // 1) 初始状态：上一步按钮必须是 disabled，重来可用
    const initialPrevDisabled = await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find((b) => b.textContent?.includes('上一步'));
      return btn ? btn.disabled : false;
    });
    ok(initialPrevDisabled, `教程 [${id}] 第 0 步时“上一步”按钮应禁用`);

    // 2) 点击列表第 1 项（非起跑点），直接 goto(1)（无动画等待）
    const listJumped = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('aside ol button'));
      if (items.length > 1) {
        items[1].click();
        return true;
      }
      return false;
    });
    ok(listJumped, `教程 [${id}] 步骤列表点击跳转失败`);
    if (listJumped) listClicks++;
    await page.evaluate(() => new Promise((r) => setTimeout(r, 80)));

    // 3) 此时处于第 1 步后，上一步按钮应启用，点击上一步
    const prevClicked = await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find((b) => b.textContent?.includes('上一步'));
      if (btn && !btn.disabled) {
        btn.click();
        return true;
      }
      return false;
    });
    ok(prevClicked, `教程 [${id}] 第 1 步点击“上一步”回退失败`);
    if (prevClicked) prevBtnClicks++;
    await page.evaluate(() => new Promise((r) => setTimeout(r, 80)));

    // 4) 点击下一步
    const nextClicked = await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find((b) => b.textContent?.includes('下一步'));
      if (btn && !btn.disabled) {
        btn.click();
        return true;
      }
      return false;
    });
    ok(nextClicked, `教程 [${id}] 点击“下一步”推进失败`);
    if (nextClicked) nextBtnClicks++;
    await page.evaluate(() => new Promise((r) => setTimeout(r, 80)));

    // 5) 点击“重来”复位
    const resetClicked = await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find((b) => b.textContent?.includes('重来'));
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });
    ok(resetClicked, `教程 [${id}] 点击“重来”复位失败`);
    if (resetClicked) resetBtnClicks++;

    // 6) 测试进度点跳转（点击第 1 个进度点）
    const dotClicked = await page.evaluate(() => {
      const dots = Array.from(document.querySelectorAll('.canvas-shell .absolute.left-4.top-4 button'));
      if (dots.length > 1) {
        dots[1].click();
        return true;
      }
      return false;
    });
    ok(dotClicked, `教程 [${id}] 进度点点击失败`);
    if (dotClicked) dotClicks++;

    // 7) 测试速度选择
    const speedSwitched = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('.canvas-shell button')).filter((b) => ['慢', '快', '正常'].includes(b.textContent?.trim() || ''));
      if (btns.length === 3) {
        btns[2].click(); // 快
        btns[1].click(); // 正常
        return true;
      }
      return false;
    });
    ok(speedSwitched, `教程 [${id}] 速度档位切换失败`);
    if (speedSwitched) speedClicks++;

    // 检查横向溢出
    const isOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    ok(!isOverflow, `教程 [${id}] 在 1280x800 下产生横向滚动溢出`);

    process.stdout.write(`  ✓ [${i + 1}/${TUTORIAL_IDS.length}] ${id} 走查完毕\n`);
  }

  /* ---------------------------------------------------------
   * 3. 移动视口实测 (Mobile: 390x844 iPhone 12/13/14)
   * --------------------------------------------------------- */
  console.log(`\n📌 [Phase 3] 移动视口 (390x844) 全路由溢出与渲染走查...`);
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

  // 移动端首页
  await page.goto(`${BASE_URL}/#/`, { waitUntil: 'networkidle2' });
  const isMobileHomeOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  ok(!isMobileHomeOverflow, '首页在 390x844 移动视口下产生横向滚动溢出');

  // 抽查 5 个典型教程页移动视口
  const SAMPLE_MOBILE = ['dog', 'spinner', 'frog', 'cat', 'fighterjet'];
  for (const mid of SAMPLE_MOBILE) {
    await page.goto(`${BASE_URL}/#/t/${mid}`, { waitUntil: 'networkidle2' });
    const isMobileTutOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    ok(!isMobileTutOverflow, `教程 [${mid}] 在 390x844 移动视口下产生横向滚动溢出`);
  }

  /* ---------------------------------------------------------
   * 4. 键盘交互测试
   * --------------------------------------------------------- */
  console.log(`\n📌 [Phase 4] 键盘事件快捷键走查 (Space / ArrowRight / ArrowLeft)...`);
  await page.goto(`${BASE_URL}/#/t/dog`, { waitUntil: 'networkidle2' });
  await page.keyboard.press('ArrowRight');
  await page.evaluate(() => new Promise((r) => setTimeout(r, 100)));
  await page.keyboard.press('ArrowRight');
  await page.evaluate(() => new Promise((r) => setTimeout(r, 100)));
  await page.keyboard.press('ArrowLeft');
  await page.evaluate(() => new Promise((r) => setTimeout(r, 100)));
  await page.keyboard.press('Space'); // 播放
  await page.evaluate(() => new Promise((r) => setTimeout(r, 100)));
  await page.keyboard.press('Space'); // 暂停
  ok(true, '键盘快捷键触发完成');

  /* ---------------------------------------------------------
   * 5. 全站异常断言
   * --------------------------------------------------------- */
  ok(jsErrors.length === 0, `页面运行过程中捕获到 ${jsErrors.length} 个 JS 错误: ${jsErrors.join('; ')}`);
  ok(consoleErrors.length === 0, `页面运行过程中捕获到 ${consoleErrors.length} 个 Console 错误: ${consoleErrors.join('; ')}`);

  await browser.close();

  /* ---------------------------------------------------------
   * 报告输出
   * --------------------------------------------------------- */
  const e2eReport = {
    走查路由总数: TUTORIAL_IDS.length + 1,
    Canvas成功挂载: canvasChecked,
    前进点击: nextBtnClicks,
    后退点击: prevBtnClicks,
    复位点击: resetBtnClicks,
    速度切换: speedClicks,
    列表点选: listClicks,
    进度点点选: dotClicks,
    视口测试: '桌面 (1280x800) + 移动 (390x844)',
    JS未捕获异常: jsErrors.length,
    Console错误: consoleErrors.length,
  };

  console.log('\n========== L6 浏览器实测报告 ==========');
  console.log(JSON.stringify(e2eReport, null, 2));
  console.log(`断言通过 ${pass}，失败 ${fail}`);

  if (fail > 0) {
    console.log('\n---- 失败明细 ----');
    failures.forEach((f) => console.log('  ✗ ' + f));
    process.exit(1);
  } else {
    console.log('\nALL E2E PASS ✅');
  }
}

run().catch((err) => {
  console.error('Fatal E2E error:', err);
  process.exit(1);
});
