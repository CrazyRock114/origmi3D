import type { Tutorial } from '../../engine/fold';
import { SQUARE, v } from '../util';

// 塌缩目标几何：边中点菱形（水气球基础形，放平）
// T=(0,1) R=(1,0) B=(0,-1) L=(-1,0) C=(0,0)
const T: [number, number, number] = [0, 1, 0];
const B: [number, number, number] = [0, -1, 0];
const L: [number, number, number] = [-1, 0, 0];
const R: [number, number, number] = [1, 0, 0];
const O: [number, number, number] = [0, 0, 0];

/** 小兔 —— 公众号「折纸造物记」《10s学会折纸小兔》，水气球基础形款 */
export const bunny: Tutorial = {
  id: 'bunny2',
  title: '折纸小兔',
  emoji: '🐰',
  category: '动物',
  difficulty: 2,
  minutes: 10,
  intro: '来自公众号「折纸造物记」的立体小兔：先折出水气球基础形，再折出长耳朵和翘尾巴。',
  paper: { outline: SQUARE, front: '#4A90D9', back: '#9CC9E8' },
  steps: [
    {
      type: 'prefold',
      a: v(0, -1),
      b: v(0, 1),
      m: v(-0.5, 0),
      dir: 'valley',
      desc: '竖直方向对折，压出中线后展开。',
    },
    {
      type: 'prefold',
      a: v(-1, 0),
      b: v(1, 0),
      m: v(0, -0.5),
      dir: 'valley',
      desc: '水平方向对折，压出中线后展开。',
    },
    {
      type: 'prefold',
      a: v(0, 1),
      b: v(-1, 0),
      m: v(-0.6, 0.6),
      dir: 'valley',
      desc: '沿左上斜线对折——让上边中点碰到左边中点，压痕后展开。',
      tip: '这条斜线是等下收拢的折痕。',
    },
    {
      type: 'prefold',
      a: v(0, 1),
      b: v(1, 0),
      m: v(0.6, 0.6),
      dir: 'valley',
      desc: '右上斜线同样对折出折痕，展开。',
    },
    {
      type: 'prefold',
      a: v(0, -1),
      b: v(1, 0),
      m: v(0.6, -0.6),
      dir: 'valley',
      desc: '右下斜线对折出折痕，展开。',
    },
    {
      type: 'prefold',
      a: v(0, -1),
      b: v(-1, 0),
      m: v(-0.6, -0.6),
      dir: 'valley',
      desc: '左下斜线对折出折痕，展开。',
      tip: '四条斜线加上两条中线，折痕全部准备好了。',
    },
    {
      type: 'collapse',
      creases: [
        { a: v(-1, 0), b: v(1, 0), dir: 'valley' },
        { a: v(0, -1), b: v(0, 1), dir: 'valley' },
        { a: v(0, 1), b: v(-1, 0), dir: 'mountain' },
        { a: v(0, 1), b: v(1, 0), dir: 'mountain' },
        { a: v(0, -1), b: v(1, 0), dir: 'mountain' },
        { a: v(0, -1), b: v(-1, 0), dir: 'mountain' },
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
      desc: '捏住左右两边向中间合拢：四个角顺着折痕向中心倒下、交会在中心——水气球基础形！',
      tip: '看四个角是怎么各自绕着斜折痕翻转 180° 倒进来的。',
    },
    {
      type: 'fold',
      a: v(-0.5, 0.5),
      b: v(0.5, 0.5),
      m: v(0, 0.85),
      dir: 'valley',
      layersMin: 0,
      desc: '把上面的尖角向下折，尖对准中心。',
      tip: '只折正面这几层。',
    },
    {
      type: 'flip',
      axis: 'x',
      desc: '翻个面。',
    },
    {
      type: 'fold',
      a: v(-0.5, -0.5),
      b: v(0.5, -0.5),
      m: v(0, -0.85),
      dir: 'valley',
      layersMin: 0,
      desc: '这一面的尖角同样向下折，对准中心。',
    },
    {
      type: 'fold',
      a: v(-0.5, -0.5),
      b: v(-0.5, 0.5),
      m: v(-0.85, 0),
      dir: 'valley',
      desc: '把左边的角向右折，对准竖直中线。',
    },
    {
      type: 'fold',
      a: v(0.5, -0.5),
      b: v(0.5, 0.5),
      m: v(0.85, 0),
      dir: 'valley',
      desc: '右边的角同样向左折，对准中线。',
      tip: '现在是一个尖朝下的风筝形。',
    },
    {
      type: 'pose',
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
            [-0.62, -0.5, 0.02],
          ],
          stack: 1,
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
            [-0.62, -0.5, -0.02],
          ],
          stack: 0,
        },
      ],
      desc: '最后整形：把翅膀般的两角提起做成双耳，尾部内折——小兔的侧面轮廓就出来了！',
      tip: '对应原文的「整理造型」：耳朵轻轻撑开，尾巴向内收。',
    },
    {
      type: 'note',
      desc: '完成！把耳朵轻轻撑开，画上眼睛，小兔子就活啦。',
      tip: '两只耳朵之间会有一点空隙，从上面看最可爱。',
    },
  ],
  source: {
    label: '微信公众号「折纸造物记」· 10s学会折纸小兔',
    url: 'http://mp.weixin.qq.com/s?__biz=MzkyMjM0ODcyMA==&mid=2247484163&idx=1&sn=1a30eb4fa4c208ca6d6ef2b8571ec12f&chksm=c1f4fedcf68377cae32b6f6db4a494de1e93320246af8dd2f8da5efebe63fc2956d2d663f5f4#rd',
  },
};
