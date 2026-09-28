import type { Tutorial } from '../../engine/fold';
import { v } from '../util';

const OUTLINE = [v(-1, -0.5), v(1, -0.5), v(1, 0.5), v(-1, 0.5)];

/** 折纸小猫猫 —— 公众号「折纸造物记」《30s学会折纸小猫猫！简单又治愈！》 */
export const cat: Tutorial = {
  id: 'cat',
  title: '折纸小猫猫',
  emoji: '🐱',
  category: '动物',
  difficulty: 3,
  minutes: 15,
  intro:
    '来自公众号「折纸造物记」的治愈系黑猫：长方形纸折出箭头尖端，手风琴折收拢成三角形结构，翻出两只尖耳朵，最后捏合身体让猫稳稳站立——尾巴还要弯成弧线哦。',
  paper: { outline: OUTLINE, front: '#2B2B33', back: '#4A4A55' },
  steps: [
    {
      type: 'prefold',
      a: v(-1, 0),
      b: v(1, 0),
      m: v(0, 0.3),
      dir: 'valley',
      desc: '沿长边中线对折，压实折痕后展开。',
    },
    {
      type: 'fold',
      a: v(0.65, 0.5),
      b: v(1, 0.15),
      m: v(0.9, 0.4),
      dir: 'valley',
      desc: '右上角沿边线向内折。',
    },
    {
      type: 'fold',
      a: v(0.65, -0.5),
      b: v(1, -0.15),
      m: v(0.9, -0.4),
      dir: 'valley',
      desc: '右下角沿对称斜线折——箭头形尖端出现。',
    },
    {
      type: 'prefold',
      a: v(0.75, -0.5),
      b: v(0.75, 0.5),
      m: v(0.9, 0),
      dir: 'valley',
      desc: '在右侧压出一条竖直折痕。',
    },
    {
      type: 'prefold',
      a: v(-1, 0.25),
      b: v(1, 0.25),
      m: v(0, 0.4),
      dir: 'valley',
      desc: '沿中心向上压出一条平行折痕。',
    },
    {
      type: 'prefold',
      a: v(-1, -0.25),
      b: v(1, -0.25),
      m: v(0, -0.4),
      dir: 'valley',
      desc: '向下同样压出一条——折痕准备完毕。',
    },
    {
      type: 'pose',
      faces: (() => {
        const strip: [number, number][] = [
          [-1, 0.14],
          [0.72, 0.14],
          [1, 0],
          [0.72, -0.14],
          [-1, -0.14],
        ];
        const z = (arr: [number, number][], zz: number) =>
          arr.map(([x, y]) => [x, y, zz] as [number, number, number]);
        return [
          { pts: z(strip, 0.02), stack: 1 },
          { pts: z(strip, -0.02), stack: 0 },
        ];
      })(),
      desc: '按折痕来回折出手风琴，再向内收拢——细长的条形身体出现了。',
      tip: '对应原文的手风琴折与向内收拢。',
    },
    {
      type: 'fold',
      a: v(-1, 0.06),
      b: v(-0.6, -0.06),
      m: v(-0.85, 0.1),
      dir: 'valley',
      angle: 150,
      desc: '左端向上压折，整理出三角形的头部，两侧翻出尖耳朵。',
    },
    {
      type: 'pose',
      faces: (() => {
        // 站立的猫向后微仰：y 越高 z 越高，正面朝向相机
        const zOf = (y: number): number => y * 0.34;
        const body: [number, number][] = [
          [-0.42, 0.95],
          [-0.22, 0.52],
          [-0.05, 0.6],
          [0.14, 0.5],
          [0.36, 0.98],
          [0.42, 0.5],
          [0.28, 0.3],
          [0.2, 0.05],
          [0.5, -0.65],
          [0.28, -0.68],
          [0.08, -0.15],
          [-0.05, -0.66],
          [-0.26, -0.62],
          [-0.16, 0.02],
          [-0.26, 0.28],
          [-0.4, 0.5],
        ];
        const tail: [number, number][] = [
          [0.5, -0.1],
          [0.72, 0.15],
          [0.78, 0.42],
          [0.66, 0.44],
          [0.6, 0.18],
          [0.44, -0.08],
        ];
        return [
          { pts: body.map(([x, y]) => [x, y, zOf(y) + 0.012] as [number, number, number]), stack: 1 },
          { pts: body.map(([x, y]) => [x, y, zOf(y) - 0.012] as [number, number, number]), stack: 0 },
          { pts: tail.map(([x, y]) => [x, y, zOf(y) - 0.16] as [number, number, number]), stack: 0 },
        ];
      })(),
      desc: '捏合身体下端整理出腿部，尾巴弯成弧形——小猫稳稳站住了！',
      tip: '对应原文最后三步：底部长条对折、捏合并拢、尾巴弯弧。',
    },
    {
      type: 'note',
      desc: '完成！黑猫北北站好啦，画上黄色眼睛更神秘。',
      tip: '轻轻推它的尾巴，小猫会微微摇摆。',
    },
  ],
  source: {
    label: '微信公众号「折纸造物记」· 30s学会折纸小猫猫！简单又治愈！',
    url: 'http://mp.weixin.qq.com/s?__biz=MzkyMjM0ODcyMA==&mid=2247484233&idx=1&sn=0c4897a8878ce5ce6c24a535f25c866d&chksm=c1f4fe96f6837780db5273d413253f818e18657c8474f52008916547433833fb833d1664307d#rd',
  },
};
