import type { Tutorial } from '../../engine/fold';
import { SQUARE, v } from '../util';

/** 折纸战斗机 —— 公众号「折纸造物记」《国庆特别篇 | 折纸手工飞机》 */
export const fighterjet: Tutorial = {
  id: 'fighterjet',
  title: '折纸战斗机',
  emoji: '✈️',
  category: '玩具',
  difficulty: 2,
  minutes: 10,
  intro:
    '来自公众号「折纸造物记」的帅气战斗机：两角向心折出机头， dart 折收出尖锐机身，最后展开后掠翼和双垂尾——一张纸折出帅气利落的战斗机！',
  paper: { outline: SQUARE, front: '#3A3F45', back: '#59616B' },
  steps: [
    {
      type: 'prefold',
      a: v(0, -1),
      b: v(0, 1),
      m: v(-0.4, 0),
      dir: 'valley',
      desc: '竖直对折压出中线后展开。',
    },
    {
      type: 'fold',
      a: v(-0.5, 0),
      b: v(0, 0.5),
      m: v(-0.35, 0.35),
      dir: 'valley',
      desc: '左上角沿对角线折向中心。',
    },
    {
      type: 'fold',
      a: v(0, 0.5),
      b: v(0.5, 0),
      m: v(0.35, 0.35),
      dir: 'valley',
      desc: '右上角同样折向中心。',
      tip: '现在是一个指向上的房形。',
    },
    {
      type: 'fold',
      a: v(0, 0.5),
      b: v(-0.25, -0.25),
      m: v(-0.3, 0.2),
      dir: 'valley',
      desc: '左侧斜边沿折痕向中线折——机身开始收尖。',
    },
    {
      type: 'fold',
      a: v(0, 0.5),
      b: v(0.25, -0.25),
      m: v(0.3, 0.2),
      dir: 'valley',
      desc: '右侧同样折——尖锐的机头完成。',
    },
    {
      type: 'fold',
      a: v(0, -1),
      b: v(0, 1),
      m: v(-0.2, 0),
      dir: 'mountain',
      wholeSide: true,
      desc: '沿中线向后对折，机身收成细条。',
      tip: '山折让机头保持尖锐。',
    },
    {
      type: 'pose',
      faces: (() => {
        const outline: [number, number][] = [
          [-1.0, 0.0],
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
          [-0.5, -0.08],
        ];
        return [
          { pts: outline.map(([x, y]) => [x, y, 0.012] as [number, number, number]), stack: 1 },
          { pts: outline.map(([x, y]) => [x, y, -0.012] as [number, number, number]), stack: 0 },
        ];
      })(),
      desc: '展开后掠翼，立起双垂尾——战斗机准备起飞！',
      tip: '对应原文后半段的机翼与尾翼整形。',
    },
    {
      type: 'note',
      desc: '完成！捏住机腹向前掷出，看谁的战斗机飞得远。',
      tip: '翼尖微微上翘，飞行更平稳。',
    },
  ],
  source: {
    label: '微信公众号「折纸造物记」· 国庆特别篇 | 折纸手工飞机',
    url: 'http://mp.weixin.qq.com/s?__biz=MzkyMjM0ODcyMA==&mid=2247484771&idx=1&sn=eb72ac7ba17d8a7078d309b7a9a957e5&chksm=c1f4f8bcf68371aadd59ac25fe0f639e8fa6d4e3aa608b000ab6c7e28fd09bffc16a9d7e9975#rd',
  },
};
