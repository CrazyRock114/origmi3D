import type { Tutorial } from '../../engine/fold';
import { SQUARE, v } from '../util';

const EPS = 0.014;

/** 蝙蝠 —— 公众号「折纸造物记」《一起来折,好玩的折纸蝙蝠》 */
export const bat: Tutorial = {
  id: 'bat2',
  title: '折纸蝙蝠',
  emoji: '🦇',
  category: '动物',
  difficulty: 2,
  minutes: 10,
  intro:
    '来自公众号「折纸造物记」的趣味蝙蝠：三角形打底压出折痕，两侧压褶收拢立起翅膀，最后整理出双耳和扇形的翼——一按翅膀还会扇！',
  paper: { outline: SQUARE, front: '#7C5CB8', back: '#B49BD8' },
  steps: [
    {
      type: 'fold',
      a: v(-1, -1),
      b: v(1, 1),
      m: v(-0.5, 0.5),
      dir: 'valley',
      desc: '沿对角线对折成三角形。',
    },
    {
      type: 'prefold',
      a: v(1, -1),
      b: v(0, 0),
      m: v(0.7, -0.35),
      dir: 'valley',
      desc: '左右对折压出中线后展开。',
    },
    {
      type: 'fold',
      a: v(0.5, 0),
      b: v(0.9, -0.2),
      m: v(0.8, 0.8),
      dir: 'valley',
      desc: '顶角向下折，尖端对到底边中点。',
    },
    {
      type: 'fold',
      a: v(-1, -0.5),
      b: v(1, -0.5),
      m: v(0, -0.8),
      dir: 'valley',
      wholeSide: true,
      desc: '下半部分沿折痕向上折。',
    },
    {
      type: 'fold',
      a: v(0.3, -1),
      b: v(0.1, 0.3),
      m: v(0.6, -0.2),
      dir: 'valley',
      angle: 150,
      desc: '右侧沿虚线向内压折，压出翅膀褶。',
      tip: '不用折平，留一点角度翅膀才立得起来。',
    },
    {
      type: 'fold',
      a: v(-0.1, 0.3),
      b: v(-0.3, -1),
      m: v(-0.6, -0.2),
      dir: 'valley',
      angle: 150,
      desc: '左侧同样向内压折。',
    },
    {
      type: 'pose',
      faces: (() => {
        const outline: [number, number][] = [
          [0.14, 0.92],
          [0.06, 0.74],
          [0.0, 0.8],
          [-0.06, 0.74],
          [-0.14, 0.92],
          [-0.2, 0.6],
          [-0.5, 0.55],
          [-0.95, 0.75],
          [-0.98, 0.45],
          [-0.6, 0.3],
          [-0.85, 0.15],
          [-0.55, 0.05],
          [-0.75, -0.15],
          [-0.45, -0.2],
          [-0.15, -0.35],
          [0, -0.42],
          [0.15, -0.35],
          [0.45, -0.2],
          [0.75, -0.15],
          [0.55, 0.05],
          [0.85, 0.15],
          [0.6, 0.3],
          [0.98, 0.45],
          [0.95, 0.75],
          [0.5, 0.55],
          [0.2, 0.6],
        ];
        return [
          { pts: outline.map(([x, y]) => [x, y, EPS] as [number, number, number]), stack: 1 },
          { pts: outline.map(([x, y]) => [x, y, -EPS] as [number, number, number]), stack: 0 },
        ];
      })(),
      desc: '沿翼根折痕向内挤压，翅膀向上立起——蝙蝠展开双翼！',
      tip: '对应原文第17-27步：翼根内折、翅膀根部压折、整理双耳。',
    },
    {
      type: 'note',
      desc: '完成！手指按住身体，蝙蝠的翅膀会一扇一扇。',
      tip: '挂在灯下或窗边，就是最好的万圣节装饰。',
    },
  ],
  source: {
    label: '微信公众号「折纸造物记」· 一起来折,好玩的折纸蝙蝠',
    url: 'http://mp.weixin.qq.com/s?__biz=MzkyMjM0ODcyMA==&mid=2247484202&idx=1&sn=eb8452d438e4516ea2668bda116d983e&chksm=c1f4fef5f68377e348f89f8cf3f5603922e8345e4656cf3bd0f405c0222d958f1a05d4bca647#rd',
  },
};
