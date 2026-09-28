import type { CollapseFace, Tutorial } from '../../engine/fold';
import { SQUARE, v } from '../util';

const T: [number, number, number] = [0, 1, 0];
const B: [number, number, number] = [0, -1, 0];
const L: [number, number, number] = [-1, 0, 0];
const R: [number, number, number] = [1, 0, 0];
const O: [number, number, number] = [0, 0, 0];

/** 月兔 —— 公众号「折纸造物记」《中秋快到了，折一只可爱的月兔🐰》 */
export const moonrabbit: Tutorial = {
  id: 'moonrabbit',
  title: '折纸月兔',
  emoji: '🐇',
  category: '节日',
  difficulty: 2,
  minutes: 12,
  intro:
    '来自公众号「折纸造物记」的中秋月兔：米字折痕收拢成水气球基础形，层层折出耳朵后，从进气孔吹一口气——圆滚滚的月兔就鼓起来了！',
  paper: { outline: SQUARE, front: '#F7E8DD', back: '#EFD3C2' },
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
      type: 'prefold',
      a: v(-1, 0),
      b: v(1, 0),
      m: v(0, -0.4),
      dir: 'valley',
      desc: '水平对折再压一条中线。',
    },
    {
      type: 'prefold',
      a: v(-1, -1),
      b: v(1, 1),
      m: v(-0.5, 0.5),
      dir: 'valley',
      desc: '沿对角线对折出折痕。',
    },
    {
      type: 'prefold',
      a: v(-1, 1),
      b: v(1, -1),
      m: v(-0.5, -0.5),
      dir: 'valley',
      desc: '另一条对角线同样——米字折痕备齐。',
    },
    {
      type: 'collapse',
      creases: [
        { a: v(-1, 0), b: v(1, 0), dir: 'valley' },
        { a: v(0, -1), b: v(0, 1), dir: 'valley' },
        { a: v(-1, -1), b: v(1, 1), dir: 'mountain' },
        { a: v(-1, 1), b: v(1, -1), dir: 'mountain' },
      ],
      faces: [
        { pts: [T, L, O], stack: 0, from: [T, L, O] },
        { pts: [T, R, O], stack: 0, from: [T, R, O] },
        { pts: [B, R, O], stack: 0, from: [B, R, O] },
        { pts: [B, L, O], stack: 0, from: [B, L, O] },
        { pts: [T, L, O], stack: 1, hinge: { a: T, b: L }, angle: 172 },
        { pts: [T, R, O], stack: -1, hinge: { a: T, b: R }, angle: 172 },
        { pts: [B, R, O], stack: 2, hinge: { a: B, b: R }, angle: 172 },
        { pts: [B, L, O], stack: -2, hinge: { a: B, b: L }, angle: 172 },
      ] as CollapseFace[],
      desc: '捏住四边向中间并拢——水气球基础形！',
      tip: '四个角顺着对角折痕向中心倒下。',
    },
    {
      type: 'fold',
      a: v(-0.5, -0.5),
      b: v(-0.5, 0.5),
      m: v(-0.9, 0),
      dir: 'valley',
      desc: '左侧沿竖线向中间折。',
    },
    {
      type: 'fold',
      a: v(0.5, -0.5),
      b: v(0.5, 0.5),
      m: v(0.9, 0),
      dir: 'valley',
      desc: '右侧同样向中间折。',
    },
    {
      type: 'fold',
      a: v(-0.3, -0.05),
      b: v(0.3, -0.05),
      m: v(0, 0.3),
      dir: 'valley',
      desc: '上面的三角向下折叠。',
    },
    {
      type: 'fold',
      a: v(0.15, -0.5),
      b: v(0.15, 0.1),
      m: v(0.35, -0.2),
      dir: 'valley',
      desc: '右侧沿虚线压折，尖端穿插到下面的三角内。',
      tip: '穿插固定住，兔子才不会散开。',
    },
    {
      type: 'fold',
      a: v(-0.15, -0.5),
      b: v(-0.15, 0.1),
      m: v(-0.35, -0.2),
      dir: 'valley',
      desc: '左侧同样压折穿插。',
    },
    {
      type: 'flip',
      axis: 'x',
      desc: '翻个面。',
    },
    {
      type: 'fold',
      a: v(-0.4, -0.15),
      b: v(0.4, -0.15),
      m: v(0, -0.45),
      dir: 'valley',
      desc: '沿中线向上折叠，耳朵的形状就出来了。',
    },
    {
      type: 'pose',
      faces: (() => {
        const body: [number, number][] = [
          [-0.55, 0.35],
          [0.35, 0.3],
          [0.6, 0.0],
          [0.5, -0.4],
          [-0.15, -0.5],
          [-0.6, -0.15],
        ];
        const earF: [number, number][] = [
          [-0.3, 1.08],
          [-0.2, 0.4],
          [-0.06, 1.0],
        ];
        const earB: [number, number][] = [
          [-0.1, 1.14],
          [0.02, 0.44],
          [0.18, 1.06],
        ];
        const z = (arr: [number, number][], zz: number) =>
          arr.map(([x, y]) => [x, y, zz] as [number, number, number]);
        return [
          { pts: z(body, 0.26), stack: 1 },
          { pts: z(body, -0.26), stack: 0 },
          { pts: z(earF, 0.14), stack: 2 },
          { pts: z(earB, -0.14), stack: 0 },
        ];
      })(),
      desc: '对准进气孔吹气，身体鼓成圆滚滚的球——月兔成型！',
      tip: '对应原文第15步「吹起来」：充气后耳朵自然立起。',
    },
    {
      type: 'note',
      desc: '完成！画上眼睛，挂在月光下就是最美的中秋装饰。',
      tip: '轻轻一拍，鼓鼓的月兔还会弹起来。',
    },
  ],
  source: {
    label: '微信公众号「折纸造物记」· 中秋快到了，折一只可爱的月兔🐰',
    url: 'http://mp.weixin.qq.com/s?__biz=MzkyMjM0ODcyMA==&mid=2247484642&idx=1&sn=f6287141c422072075afaa8837d860ab&chksm=c1f4f93df683702b465819003c2790e3bca64dc8bc94a6b2c290e179804c28b57362b5b95ac0#rd',
  },
};
