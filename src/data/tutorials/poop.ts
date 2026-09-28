import type { Tutorial } from '../../engine/fold';
import { SQUARE, v } from '../util';

const T: [number, number, number] = [0, 1, 0];
const B: [number, number, number] = [0, -1, 0];
const L: [number, number, number] = [-1, 0, 0];
const R: [number, number, number] = [1, 0, 0];
const O: [number, number, number] = [0, 0, 0];

/** 搞怪便便 —— 公众号「折纸造物记」《纸做的便便》 */
export const poop: Tutorial = {
  id: 'poop',
  title: '搞怪便便',
  emoji: '💩',
  category: '玩具',
  difficulty: 2,
  minutes: 12,
  intro: '来自公众号「折纸造物记」的搞怪便便：水气球基础形打底，交替翻折盘绕出层次，内翻折挤出眼睛和嘴巴。',
  paper: { outline: SQUARE, front: '#B5773A', back: '#D9A968' },
  steps: [
    {
      type: 'prefold',
      a: v(-1, -1),
      b: v(1, 1),
      m: v(-0.6, -0.6),
      dir: 'valley',
      desc: '沿对角线对折，压出折痕后展开。',
    },
    {
      type: 'prefold',
      a: v(-1, 1),
      b: v(1, -1),
      m: v(-0.6, 0.6),
      dir: 'valley',
      desc: '另一条对角线同样对折展开。',
    },
    {
      type: 'prefold',
      a: v(0, -1),
      b: v(0, 1),
      m: v(-0.5, 0),
      dir: 'valley',
      desc: '竖直中线对折展开。',
    },
    {
      type: 'prefold',
      a: v(-1, 0),
      b: v(1, 0),
      m: v(0, -0.5),
      dir: 'valley',
      desc: '水平中线对折展开。',
      tip: '米字折痕备齐。',
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
      ],
      desc: '捏住四边向中间合拢——水气球基础形（菱形）。',
    },
    {
      type: 'pose',
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
            [-0.3, 0.6, 0.03],
          ],
          stack: 1,
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
            [-0.3, 0.6, -0.03],
          ],
          stack: 0,
        },
        // 来色嘴巴带
        {
          pts: [
            [-0.55, 0.05, 0.04],
            [0.55, 0.05, 0.04],
            [0.4, -0.2, 0.04],
            [-0.4, -0.2, 0.04],
          ],
          stack: 2,
        },
        // 方块眼睛×2
        {
          pts: [
            [-0.34, 0.35, 0.045],
            [-0.08, 0.35, 0.045],
            [-0.08, 0.6, 0.045],
            [-0.34, 0.6, 0.045],
          ],
          stack: 3,
        },
        {
          pts: [
            [0.08, 0.35, 0.045],
            [0.34, 0.35, 0.045],
            [0.34, 0.6, 0.045],
            [0.08, 0.6, 0.045],
          ],
          stack: 3,
        },
      ],
      desc: '下面的尖角向上翻、上面向下折，交替折叠盘绕出三层；再内翻折挤出眼睛，最后内压成型——便便就完成啦！',
      tip: '看起来有点臭，但其实很有趣！三角形开口处向内挤压出正方形就是眼睛。',
    },
  ],
  source: {
    label: '微信公众号「折纸造物记」· 纸做的便便',
    url: 'http://mp.weixin.qq.com/s?__biz=MzkyMjM0ODcyMA==&mid=2247484529&idx=1&sn=26070200f93310c359fae17d9715f876&chksm=c1f4f9aef68370b83aaa32ac21e2ed6fd31305719176ff12ac4d528b3ef3829b1b4cf8b5b5dd#rd',
  },
};
