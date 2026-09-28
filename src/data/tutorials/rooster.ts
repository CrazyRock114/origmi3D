import type { Tutorial } from '../../engine/fold';
import { DIAMOND, v } from '../util';

/** 小公鸡 —— 公众号「折纸造物记」《折纸小公鸡🐓详细版教程》 */
export const rooster: Tutorial = {
  id: 'rooster',
  title: '折纸小公鸡',
  emoji: '🐓',
  category: '动物',
  difficulty: 3,
  minutes: 15,
  intro:
    '来自公众号「折纸造物记」的详细版小公鸡：四角向心折出基础形，对折后把角向上拉出长脖子，头部翻出鸡冠和肉垂，尾部展开成大弧线——一只神气的大公鸡！',
  paper: { outline: DIAMOND, front: '#E05A4E', back: '#F0A099' },
  steps: [
    {
      type: 'prefold',
      a: v(0, -1),
      b: v(0, 1),
      m: v(-0.4, 0),
      dir: 'valley',
      desc: '菱形摆放，竖直对折压出中线后展开。',
    },
    {
      type: 'prefold',
      a: v(-1, 0),
      b: v(1, 0),
      m: v(0, 0.4),
      dir: 'valley',
      desc: '水平方向同样对折，十字折痕备好。',
    },
    {
      type: 'fold',
      a: v(-0.5, 0.5),
      b: v(0.5, 0.5),
      m: v(0, 0.8),
      dir: 'valley',
      desc: '顶角向下折，尖对准中心。',
    },
    {
      type: 'fold',
      a: v(-0.5, -0.5),
      b: v(0.5, -0.5),
      m: v(0, -0.8),
      dir: 'valley',
      desc: '底角向上折，同样对准中心。',
    },
    {
      type: 'fold',
      a: v(-0.5, -0.5),
      b: v(-0.5, 0.5),
      m: v(-0.8, 0),
      dir: 'valley',
      desc: '左角向中心折。',
    },
    {
      type: 'fold',
      a: v(0.5, -0.5),
      b: v(0.5, 0.5),
      m: v(0.8, 0),
      dir: 'valley',
      desc: '右角向中心折——四角向心完成。',
      tip: '现在是一个斜放的小正方形。',
    },
    {
      type: 'fold',
      a: v(-0.71, 0),
      b: v(0.71, 0),
      m: v(0, 0.4),
      dir: 'valley',
      wholeSide: true,
      desc: '沿水平线对折，上半边向下。',
      tip: '三角形的开口朝下，等会儿要从这里拉角。',
    },
    {
      type: 'fold',
      a: v(-0.5, -0.35),
      b: v(0.5, -0.35),
      m: v(0, -0.6),
      dir: 'valley',
      desc: '把下面的角向上拉起，翻折出长点——翻面后另一侧同样操作，这里一并折好。',
      tip: '对应原文的花瓣折：角沿折痕向上翻，成为脖子和尾巴。',
    },
    {
      type: 'flip',
      axis: 'x',
      desc: '翻个面，让红色的正面朝上。',
    },
    {
      type: 'fold',
      a: v(-0.4, 0.12),
      b: v(-0.18, -0.08),
      m: v(-0.44, 0.02),
      dir: 'valley',
      angle: 120,
      desc: '左侧向前压折，折出脖子。',
    },
    {
      type: 'pose',
      faces: (() => {
        // 每个点带独立 z：尾部上翘、头冠微抬，避免侧视时压成一条线
        const zOf = (x: number, y: number): number => {
          if (x > 0.5) return 0.05 + (x - 0.5) * 0.85 + y * 0.3; // 尾部沿 +x 抬升
          if (y > 0.55) return 0.1; // 鸡冠
          return 0.012;
        };
        const outline: [number, number][] = [
          [-0.8, 0.42],
          [-0.72, 0.28],
          [-0.68, 0.16],
          [-0.5, 0.05],
          [-0.3, -0.15],
          [-0.12, -0.42],
          [0.0, -0.42],
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
          [-0.6, 0.62],
        ];
        const front = outline.map(([x, y]) => [x, y, zOf(x, y) + 0.008] as [number, number, number]);
        const back = outline.map(([x, y]) => [x, y, zOf(x, y) - 0.008] as [number, number, number]);
        return [
          { pts: front, stack: 1 },
          { pts: back, stack: 0 },
        ];
      })(),
      desc: '最后整形：头部翻出鸡冠和肉垂，尾部展开上翘成大弧线——公鸡喔喔叫！',
      tip: '对应原文第17-24步：头部内翻折出喙、尾部整理上弧。',
    },
    {
      type: 'note',
      desc: '完成！画上眼睛，一只神气的大公鸡就站好了。',
      tip: '鸡冠越鲜艳越威风，红纸折最合适。',
    },
  ],
  source: {
    label: '微信公众号「折纸造物记」· 折纸小公鸡🐓详细版教程',
    url: 'http://mp.weixin.qq.com/s?__biz=MzkyMjM0ODcyMA==&mid=2247484593&idx=1&sn=c4572d25c44397240f139fa5f4ba513f&chksm=c1f4f96ef683707816a7d205a56cef7f7f8821dd8644d98828e198688487619a24808e95de70#rd',
  },
};
