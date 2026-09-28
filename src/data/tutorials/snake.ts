import type { Tutorial } from '../../engine/fold';
import { SQUARE, v } from '../util';

const EPS = 0.014;

/** 弹射小蛇 —— 公众号「折纸造物记」《好玩的弹力小蛇折纸教程》 */
export const snake: Tutorial = {
  id: 'snake',
  title: '弹力小蛇',
  emoji: '🐍',
  category: '玩具',
  difficulty: 2,
  minutes: 12,
  intro:
    '来自公众号「折纸造物记」的一压即弹小蛇：正方形纸折出米字风琴褶，分段挤压成一节节的方块身体，捏住尾巴一松手——小蛇“嗖”地弹出去！',
  paper: { outline: SQUARE, front: '#7FBF3F', back: '#B4D98A' },
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
      type: 'fold',
      a: v(1, 0.2),
      b: v(0.2, 1),
      m: v(0.85, 0.85),
      dir: 'valley',
      desc: '上边角向中心点对折。',
    },
    {
      type: 'fold',
      a: v(-1, -0.2),
      b: v(-0.2, -1),
      m: v(-0.85, -0.85),
      dir: 'valley',
      desc: '下边角同样向中心对折。',
    },
    {
      type: 'prefold',
      a: v(0.34, -1),
      b: v(0.34, 1),
      m: v(0.7, 0),
      dir: 'valley',
      desc: '竖直方向三等分，压出第一条折痕后展开。',
    },
    {
      type: 'prefold',
      a: v(-0.34, -1),
      b: v(-0.34, 1),
      m: v(-0.7, 0),
      dir: 'valley',
      desc: '另一条三等分线同样压出折痕。',
      tip: '一凹一凸，像折纸扇一样交替。',
    },
    {
      type: 'fold',
      a: v(0.34, -1),
      b: v(0.34, 1),
      m: v(0.7, 0),
      dir: 'valley',
      angle: 150,
      desc: '沿折痕把右侧风琴折收进来。',
    },
    {
      type: 'fold',
      a: v(-0.34, -1),
      b: v(-0.34, 1),
      m: v(-0.7, 0),
      dir: 'valley',
      angle: 150,
      desc: '左侧同样收进来，叠成窄条。',
    },
    {
      type: 'prefold',
      a: v(-1, 0.34),
      b: v(1, 0.34),
      m: v(0, 0.7),
      dir: 'valley',
      desc: '换个方向再压一条三等分折痕。',
    },
    {
      type: 'fold',
      a: v(-1, -0.34),
      b: v(1, -0.34),
      m: v(0, -0.7),
      dir: 'valley',
      angle: 150,
      desc: '横向同样风琴折，十字网格完成。',
      tip: '展开是一张方格纸，收拢就是蛇身的“关节”。',
    },
    {
      type: 'fold',
      a: v(-1, 0.1),
      b: v(-0.3, 0.1),
      m: v(-0.7, 0.5),
      dir: 'valley',
      desc: '一端的边角向上折，折出小蛇的头部。',
    },
    {
      type: 'pose',
      faces: (() => {
        // 一串相连的菱形节段，交替倾斜模拟立体方块；头部五边形微微抬起
        const seg = (cx: number, cy: number, tilt: number): [number, number, number][] => [
          [cx - 0.19, cy + tilt * 0.05, 0.04 + tilt * 0.05],
          [cx, cy + 0.14 + tilt * 0.05, 0.13 + tilt * 0.05],
          [cx + 0.19, cy + tilt * 0.05, 0.04 + tilt * 0.05],
          [cx, cy - 0.14 + tilt * 0.05, -0.02 + tilt * 0.05],
        ];
        const faces: { pts: [number, number, number][]; stack: number }[] = [];
        for (const s of [1, 0]) {
          const d = s === 1 ? EPS : -EPS;
          // 头部五边形（前端抬起）
          faces.push({
            pts: [
              [-1.02, 0.08, 0.18],
              [-0.85, 0.22, 0.22],
              [-0.6, 0.16, 0.16],
              [-0.63, -0.06, 0.08],
              [-0.92, -0.05, 0.1],
            ].map((p) => [p[0], p[1], p[2] + d] as [number, number, number]),
            stack: s,
          });
          // 四节身体（相扣）
          for (const [i, t] of [1, -1, 1, -1].entries()) {
            faces.push({
              pts: seg(-0.42 + i * 0.36, t * 0.07, t).map(
                (p) => [p[0], p[1], p[2] + d] as [number, number, number],
              ),
              stack: s,
            });
          }
          // 尾尖
          faces.push({
            pts: [
              [0.92, 0.04, 0.04 + d],
              [1.14, 0.02, 0.08 + d],
              [0.9, -0.12, 0.0 + d],
            ],
            stack: s,
          });
        }
        return faces;
      })(),
      desc: '分段沿折痕挤压成立体的方块节——小蛇的身体一节一节立起来了！',
      tip: '对应原文第13-15步：每段向内挤压、翻面重复，直到整条蛇。',
    },
    {
      type: 'note',
      desc: '完成！按住尾巴向后拉，一松手小蛇就弹射出去。',
      tip: '和小伙伴比赛，看谁的蛇弹得远。',
    },
  ],
  source: {
    label: '微信公众号「折纸造物记」· 好玩的弹力小蛇折纸教程',
    url: 'http://mp.weixin.qq.com/s?__biz=MzkyMjM0ODcyMA==&mid=2247484114&idx=1&sn=2acf8b88b72d323458a9eaa9c8858d80&chksm=c1f4ff0df683761bffbabb6b46f331587a9ea13403f38e6871bf513b3843f76b7dcd90a777a4#rd',
  },
};
