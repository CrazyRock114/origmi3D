import type { CollapseFace, Tutorial } from '../../engine/fold';
import { v } from '../util';

/** A4 比例横放（2.4 × 1.7） */
const OUTLINE = [
  v(-1.2, -0.85),
  v(1.2, -0.85),
  v(1.2, 0.85),
  v(-1.2, 0.85),
];

/** 水气球塌缩：中心方块的 4 基底三角 + 4 角三角（绕边线铰链翻转） */
function waterbombFaces(h: number): CollapseFace[] {
  const T: [number, number, number] = [0, h, 0];
  const B: [number, number, number] = [0, -h, 0];
  const L: [number, number, number] = [-h, 0, 0];
  const R: [number, number, number] = [h, 0, 0];
  const O: [number, number, number] = [0, 0, 0];
  return [
    { pts: [T, L, O], stack: 0, from: [T, L, O] },
    { pts: [T, R, O], stack: 0, from: [T, R, O] },
    { pts: [B, R, O], stack: 0, from: [B, R, O] },
    { pts: [B, L, O], stack: 0, from: [B, L, O] },
    { pts: [T, L, O], stack: 1, hinge: { a: T, b: L }, angle: 172 },
    { pts: [T, R, O], stack: -1, hinge: { a: T, b: R }, angle: 172 },
    { pts: [B, R, O], stack: 2, hinge: { a: B, b: R }, angle: 172 },
    { pts: [B, L, O], stack: -2, hinge: { a: B, b: L }, angle: 172 },
  ];
}

/** 折进方形内的端部折层（静止） */
function endFlap(x0: number, x1: number): CollapseFace {
  return {
    pts: [
      [x0, 0.85, 0.005],
      [x1, 0.85, 0.005],
      [x1, -0.85, 0.005],
      [x0, -0.85, 0.005],
    ],
    stack: 3,
    from: [
      [x0, 0.85, 0.005],
      [x1, 0.85, 0.005],
      [x1, -0.85, 0.005],
      [x0, -0.85, 0.005],
    ],
  };
}

/** 弹跳青蛙 —— 公众号「折纸造物记」《10s学会弹跳青蛙（零基础）》 */
export const frog: Tutorial = {
  id: 'frog2',
  title: '弹跳青蛙',
  emoji: '🐸',
  category: '玩具',
  difficulty: 2,
  minutes: 10,
  intro: '来自公众号「折纸造物记」的零基础弹跳青蛙：两端向中间折出中央方形，水气球塌缩后折出四条腿，按住尾部一松手就蹦！',
  paper: { outline: OUTLINE, front: '#7BC950', back: '#4E9E2E' },
  steps: [
    {
      type: 'prefold',
      a: v(-1.2, 0),
      b: v(1.2, 0),
      m: v(0, -0.5),
      dir: 'valley',
      desc: '横着对折，压出水平中线后展开。',
    },
    {
      type: 'fold',
      a: v(-0.85, -0.85),
      b: v(-0.85, 0.85),
      m: v(-1.05, 0),
      dir: 'valley',
      desc: '左端向右折，边缘与将要形成的方形边对齐。',
      tip: '折痕位置就是中央方形的左边界。',
    },
    {
      type: 'fold',
      a: v(0.85, -0.85),
      b: v(0.85, 0.85),
      m: v(1.05, 0),
      dir: 'valley',
      desc: '右端向左折，两端都收进来，得到一个双层的中央方形。',
    },
    {
      type: 'prefold',
      a: v(-0.85, -0.85),
      b: v(0.85, 0.85),
      m: v(-0.7, 0.7),
      dir: 'valley',
      desc: '沿方形的对角线对折，压痕后展开。',
    },
    {
      type: 'prefold',
      a: v(-0.85, 0.85),
      b: v(0.85, -0.85),
      m: v(-0.7, -0.7),
      dir: 'valley',
      desc: '另一条对角线同样对折出折痕。',
      tip: '加上方形的横竖中线，收拢的折痕就齐了。',
    },
    {
      type: 'collapse',
      creases: [
        { a: v(-0.85, 0), b: v(0.85, 0), dir: 'valley' },
        { a: v(0, -0.85), b: v(0, 0.85), dir: 'valley' },
        { a: v(-0.85, -0.85), b: v(0.85, 0.85), dir: 'mountain' },
        { a: v(-0.85, 0.85), b: v(0.85, -0.85), dir: 'mountain' },
      ],
      faces: [...waterbombFaces(0.85), endFlap(-0.85, -0.5), endFlap(0.5, 0.85)],
      desc: '捏住方形上下两边向中间合拢：四个角顺着对角折痕向中心倒下——水气球基础形！',
      tip: '看四个角怎么各自绕对角线翻转 180° 倒进来。',
    },
    {
      type: 'fold',
      a: v(-0.72, 0.6),
      b: v(-0.4, 0.28),
      m: v(-0.78, 0.68),
      dir: 'valley',
      angle: 150,
      layersMin: 1,
      layersMax: 1,
      desc: '左上角向外翻折，折出前腿。',
      tip: '四个角都往外翻，不用折平。',
    },
    {
      type: 'fold',
      a: v(0.4, 0.28),
      b: v(0.72, 0.6),
      m: v(0.78, 0.68),
      dir: 'valley',
      angle: 150,
      layersMin: -1,
      layersMax: -1,
      desc: '右上角向外翻折，折出另一条前腿。',
    },
    {
      type: 'fold',
      a: v(-0.72, -0.6),
      b: v(-0.4, -0.28),
      m: v(-0.78, -0.68),
      dir: 'valley',
      angle: 150,
      layersMin: -2,
      layersMax: -2,
      desc: '左下角向外翻折，折出后腿。',
    },
    {
      type: 'fold',
      a: v(0.4, -0.28),
      b: v(0.72, -0.6),
      m: v(0.78, -0.68),
      dir: 'valley',
      angle: 150,
      layersMin: 2,
      layersMax: 2,
      desc: '右下角向外翻折，四条腿完成！',
    },
    {
      type: 'fold',
      a: v(-0.3, -0.85),
      b: v(-0.3, 0.85),
      m: v(-0.6, 0),
      dir: 'valley',
      wholeSide: true,
      desc: '左边向竖直中线对折，把边上的角塞进中间的缝里。',
    },
    {
      type: 'fold',
      a: v(0.3, -0.85),
      b: v(0.3, 0.85),
      m: v(0.6, 0),
      dir: 'valley',
      wholeSide: true,
      desc: '右边同样向中线对折，塞好角。',
      tip: '现在是紧凑的多层方形，四条腿露在外面。',
    },
    {
      type: 'flip',
      axis: 'x',
      desc: '翻个面。',
    },
    {
      type: 'fold',
      a: v(-0.85, 0),
      b: v(0.85, 0),
      m: v(0, 0.6),
      dir: 'valley',
      desc: '沿水平中线把上半边向下对折。',
    },
    {
      type: 'fold',
      a: v(-0.85, -0.35),
      b: v(0.85, -0.35),
      m: v(0, -0.6),
      dir: 'valley',
      desc: '尾部再向上折一半，做出弹跳的折层。',
      tip: '按住折层，一松手青蛙就会蹦出去！',
    },
    {
      type: 'note',
      desc: '完成！把青蛙放在桌上，按住尾部向后一滑，看它弹跳！',
      tip: '和同学比一比谁的青蛙跳得远。',
    },
  ],
  source: {
    label: '微信公众号「折纸造物记」· 10s学会弹跳青蛙（零基础）',
    url: 'http://mp.weixin.qq.com/s?__biz=MzkyMjM0ODcyMA==&mid=2247483997&idx=1&sn=64847c80d57f1c4c1887246015278b75&chksm=c1f4ff82f683769406106e272c031acf37c377d25ff47c8d30c83d667f151a4950051bc21d1d#rd',
  },
};
