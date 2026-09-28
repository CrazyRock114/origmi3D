import type { Tutorial } from '../../engine/fold';
import { SQUARE, v } from '../util';

const EPS = 0.012;

/** 第9步「两侧向内并拢」目标：左右两角折进后的紧凑八边形（双层） */
function gatherFaces() {
  const faces: { pts: [number, number, number][]; stack: number }[] = [];
  for (const s of [1, 0]) {
    const z = s === 1 ? EPS : -EPS;
    faces.push({
      pts: [
        [-0.45, 1, z],
        [0.45, 1, z],
        [0.58, 0.6, z],
        [0.58, -0.6, z],
        [0.45, -1, z],
        [-0.45, -1, z],
        [-0.58, -0.6, z],
        [-0.58, 0.6, z],
      ],
      stack: s,
    });
  }
  return faces;
}

/** 卡皮巴拉 —— 公众号「折纸造物记」《1分钟学折纸卡皮巴拉！》 */
export const capy: Tutorial = {
  id: 'capy',
  title: '卡皮巴拉',
  emoji: '🦫',
  category: '动物',
  difficulty: 1,
  minutes: 8,
  intro:
    '来自公众号「折纸造物记」的零基础卡皮巴拉：折痕网格打底，角折出肚子，两侧向内并拢后对折，最后把头尾向内一推——呆萌的水豚就出现了。',
  paper: { outline: SQUARE, front: '#D99A5B', back: '#EBC295' },
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
      desc: '水平方向对折再展开，十字折痕备好。',
    },
    {
      type: 'fold',
      a: v(-1, -0.55),
      b: v(-0.55, -1),
      m: v(-0.85, -0.85),
      dir: 'valley',
      desc: '左下角沿对角线向内折。',
    },
    {
      type: 'fold',
      a: v(0.55, -1),
      b: v(1, -0.55),
      m: v(0.85, -0.85),
      dir: 'valley',
      desc: '右下角同样向内折。',
    },
    {
      type: 'fold',
      a: v(-1, -0.4),
      b: v(1, -0.4),
      m: v(0, -0.7),
      dir: 'valley',
      wholeSide: true,
      desc: '底部整条向上折起，折出一个梯形。',
      tip: '这是卡皮巴拉的肚子位置。',
    },
    {
      type: 'flip',
      axis: 'x',
      desc: '翻个面。',
    },
    {
      type: 'fold',
      a: v(-1, 0.5),
      b: v(-0.5, 1),
      m: v(-0.85, 0.85),
      dir: 'valley',
      desc: '左上角沿对角线向内折。',
    },
    {
      type: 'fold',
      a: v(0.5, 1),
      b: v(1, 0.5),
      m: v(0.85, 0.85),
      dir: 'valley',
      desc: '右上角同样向内折。',
    },
    {
      type: 'pose',
      faces: gatherFaces(),
      desc: '两侧沿折痕向中间并拢——纸收成一个紧凑的八边形。',
      tip: '对应原文第9步「两侧向内并拢」。',
    },
    {
      type: 'fold',
      a: v(-0.32, 0.38),
      b: v(0.32, 0.38),
      m: v(0, 0.7),
      dir: 'valley',
      desc: '把上方的小三角向下折。',
    },
    {
      type: 'flip',
      axis: 'x',
      desc: '翻个面。',
    },
    {
      type: 'fold',
      a: v(-1, 0),
      b: v(1, 0),
      m: v(0, -0.5),
      dir: 'valley',
      wholeSide: true,
      desc: '沿水平中线把上半边向下对折。',
      tip: '卡皮巴拉的侧影已经隐约出现了。',
    },
    {
      type: 'pose',
      faces: (() => {
        const outline: [number, number][] = [
          [-0.95, 0.16],
          [-0.6, 0.3],
          [0.16, 0.28],
          [0.28, 0.4],
          [0.4, 0.52],
          [0.48, 0.4],
          [0.62, 0.38],
          [0.88, 0.28],
          [0.93, 0.16],
          [0.88, 0.04],
          [0.55, 0.02],
          [0.44, -0.16],
          [0.3, -0.16],
          [0.28, -0.02],
          [-0.24, -0.02],
          [-0.36, -0.18],
          [-0.52, -0.18],
          [-0.55, -0.02],
        ];
        return [
          { pts: outline.map(([x, y]) => [x, y, EPS] as [number, number, number]), stack: 1 },
          { pts: outline.map(([x, y]) => [x, y, -EPS] as [number, number, number]), stack: 0 },
        ];
      })(),
      desc: '最后整形：头部与臀部向内推平，顶部折出小耳朵——卡皮巴拉完成！',
      tip: '对应原文第14-15步：把头尾推进层缝里，耳朵向下按压。',
    },
    {
      type: 'note',
      desc: '完成！画上眼睛和鼻孔，呆萌卡皮巴拉就活啦。',
      tip: '卡皮巴拉是世界上最大的啮齿动物，老家在南美洲。',
    },
  ],
  source: {
    label: '微信公众号「折纸造物记」· 1分钟学折纸卡皮巴拉！',
    url: 'http://mp.weixin.qq.com/s?__biz=MzkyMjM0ODcyMA==&mid=2247484041&idx=1&sn=50420343b9860f24170611fcde239d72&chksm=c1f4ff56f6837640aeca040e419434e14e1b72a60c7c5f06ad9373ac53943e23fc397cd31e3e#rd',
  },
};
