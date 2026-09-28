import type { Tutorial } from '../../engine/fold';
import { DIAMOND, v } from '../util';

const EPS = 0.014;

/** 鲨鱼 —— 公众号「折纸造物记」《帅哭！用纸做只小鲨鱼🦈》 */
export const shark: Tutorial = {
  id: 'shark',
  title: '折纸鲨鱼',
  emoji: '🦈',
  category: '动物',
  difficulty: 2,
  minutes: 10,
  intro:
    '来自公众号「折纸造物记」的利落小鲨鱼：菱形纸层层收拢折出身体，两侧压出胸鳍，翻折出背鳍和尾鳍——一头巡游的鲨鱼就做好了。',
  paper: { outline: DIAMOND, front: '#8E9AA6', back: '#C9D2DA' },
  steps: [
    {
      type: 'prefold',
      a: v(0, -1),
      b: v(0, 1),
      m: v(-0.4, 0),
      dir: 'valley',
      desc: '顶角朝上摆放，竖直对折压出中线后展开。',
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
      m: v(0, 0.85),
      dir: 'valley',
      desc: '顶角向下折，折出一个平顶。',
    },
    {
      type: 'fold',
      a: v(-0.5, -0.5),
      b: v(0.5, -0.5),
      m: v(0, -0.85),
      dir: 'valley',
      desc: '底角同样向上折。',
      tip: '现在是上下平、左右尖的六边形。',
    },
    {
      type: 'fold',
      a: v(-0.5, -0.5),
      b: v(-0.5, 0.5),
      m: v(-0.9, 0),
      dir: 'valley',
      wholeSide: true,
      desc: '左角沿竖线向中间折。',
    },
    {
      type: 'fold',
      a: v(0.5, -0.5),
      b: v(0.5, 0.5),
      m: v(0.9, 0),
      dir: 'valley',
      wholeSide: true,
      desc: '右角同样向中间折——身体收拢成型。',
    },
    {
      type: 'fold',
      a: v(-0.2, 0.42),
      b: v(0.2, 0.42),
      m: v(0, 0.7),
      dir: 'valley',
      desc: '把上方的小角向下折，压出吻部。',
    },
    {
      type: 'flip',
      axis: 'x',
      desc: '翻个面。',
    },
    {
      type: 'fold',
      a: v(-0.52, -0.08),
      b: v(-0.24, -0.36),
      m: v(-0.58, -0.22),
      dir: 'valley',
      angle: 150,
      desc: '左下角向外翻折，压出胸鳍。',
      tip: '不用折平，鳍微微张开更有精神。',
    },
    {
      type: 'fold',
      a: v(0.24, -0.36),
      b: v(0.52, -0.08),
      m: v(0.58, -0.22),
      dir: 'valley',
      angle: 150,
      desc: '右下角同样向外翻折。',
    },
    {
      type: 'pose',
      faces: (() => {
        const outline: [number, number][] = [
          [0.98, 0.3],
          [0.48, 0.26],
          [0.22, 0.3],
          [0.02, 0.55],
          [-0.18, 0.36],
          [-0.5, 0.4],
          [-0.82, 0.2],
          [-0.96, 0.08],
          [-0.82, -0.04],
          [-0.5, -0.12],
          [-0.28, -0.4],
          [-0.08, -0.16],
          [0.3, -0.14],
          [0.42, -0.3],
          [0.55, -0.12],
          [0.72, -0.12],
          [0.88, 0.0],
        ];
        return [
          { pts: outline.map(([x, y]) => [x, y, EPS] as [number, number, number]), stack: 1 },
          { pts: outline.map(([x, y]) => [x, y, -EPS] as [number, number, number]), stack: 0 },
        ];
      })(),
      desc: '最后整形：立起背鳍，展开上下尾叶——鲨鱼成型！',
      tip: '对应原文后段的背鳍/尾鳍内翻折，整理出流线外形。',
    },
    {
      type: 'note',
      desc: '完成！让鲨鱼在桌上“游”起来，画上眼睛更凶猛。',
      tip: '姿势摆得微微上扬，像正要冲向猎物。',
    },
  ],
  source: {
    label: '微信公众号「折纸造物记」· 帅哭！用纸做只小鲨鱼🦈',
    url: 'http://mp.weixin.qq.com/s?__biz=MzkyMjM0ODcyMA==&mid=2247484261&idx=1&sn=c112ffd4277d13c06948f790285dcc76&chksm=c1f4febaf68377ac83cf84ede9bbfe5be2255412647a2cb7ce201b6f9cc1d3916efb7a3a5fff#rd',
  },
};
