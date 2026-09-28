import type { Tutorial } from '../../engine/fold';
import { DIAMOND, v } from '../util';

const EPS = 0.014;

/** ⑤「向中间并拢」目标：风筝基础形（上下尖、中部最宽的六边形，双层） */
function kiteFaces() {
  const faces: { pts: [number, number, number][]; stack: number }[] = [];
  for (const s of [1, 0]) {
    const z = s === 1 ? EPS : -EPS;
    faces.push({
      pts: [
        [0, 1, z],
        [0.5, 0.5, z],
        [0.5, -0.5, z],
        [0, -1, z],
        [-0.5, -0.5, z],
        [-0.5, 0.5, z],
      ],
      stack: s,
    });
  }
  return faces;
}

/** 立体恐龙 —— 公众号「折纸造物记」《30s学会折纸恐龙🦖，手残党速冲！》 */
export const dino: Tutorial = {
  id: 'dino',
  title: '折纸恐龙',
  emoji: '🦖',
  category: '动物',
  difficulty: 2,
  minutes: 10,
  intro:
    '来自公众号「折纸造物记」的立体小恐龙：十字折痕加风筝基础形打底，底角向上拉出后颈、头两次翻折，最后撑开尾巴和双腿——一只霸王龙就站起来了。',
  paper: { outline: DIAMOND, front: '#6FAE4E', back: '#A8CE8C' },
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
      desc: '水平方向同样对折出十字折痕。',
    },
    {
      type: 'fold',
      a: v(-0.5, -0.5),
      b: v(-0.5, 0.5),
      m: v(-0.9, 0),
      dir: 'valley',
      wholeSide: true,
      desc: '左角沿竖线向中间折，边线对齐中线。',
    },
    {
      type: 'fold',
      a: v(0.5, -0.5),
      b: v(0.5, 0.5),
      m: v(0.9, 0),
      dir: 'valley',
      wholeSide: true,
      desc: '右角同样向中间折。',
    },
    {
      type: 'fold',
      a: v(-0.25, 0.5),
      b: v(0.25, 0.5),
      m: v(0, 0.8),
      dir: 'valley',
      desc: '用同样的方法把顶角向下折。',
      tip: '折痕全部压好后重新展开。',
    },
    {
      type: 'pose',
      faces: kiteFaces(),
      desc: '展开后向中间并拢——纸收成一个上下尖的风筝基础形。',
      tip: '左右两边塞进中间的层缝里，正好用上刚才的折痕。',
    },
    {
      type: 'fold',
      a: v(-0.35, -0.25),
      b: v(0.35, -0.25),
      m: v(0, -0.6),
      dir: 'valley',
      desc: '把底部的角向上拉，盖住中间的三角。',
      tip: '对应原文的「将底部角向上拉到中间三角处」。',
    },
    {
      type: 'fold',
      a: v(0, -1),
      b: v(0, 1),
      m: v(-0.3, 0),
      dir: 'valley',
      wholeSide: true,
      desc: '沿长轴对折，把右半折向左半。',
      tip: '现在是 slim 的双层纸条，尖朝下。',
    },
    {
      type: 'fold',
      a: v(-0.2, 0),
      b: v(-0.5, 0.42),
      m: v(-0.45, 0.08),
      dir: 'mountain',
      angle: 150,
      desc: '沿折痕把上端向内翻折，折出脖子。',
      tip: '对应原文「从顶部打开沿折线折反过来」的内翻折。',
    },
    {
      type: 'fold',
      a: v(-0.5, 0.42),
      b: v(-0.16, 0.5),
      m: v(-0.45, 0.55),
      dir: 'mountain',
      angle: 150,
      desc: '尖端再向前折一小段，压出头部。',
    },
    {
      type: 'pose',
      faces: (() => {
        const outline: [number, number][] = [
          [0.95, 0.32],
          [0.5, 0.28],
          [0.18, 0.44],
          [-0.3, 0.55],
          [-0.55, 0.68],
          [-0.9, 0.6],
          [-0.94, 0.5],
          [-0.72, 0.42],
          [-0.88, 0.36],
          [-0.58, 0.28],
          [-0.36, 0.1],
          [-0.3, -0.12],
          [-0.36, -0.3],
          [-0.2, -0.28],
          [-0.08, -0.04],
          [0.32, 0.0],
          [0.42, -0.3],
          [0.56, -0.28],
          [0.6, -0.05],
          [0.85, 0.08],
        ];
        return [
          { pts: outline.map(([x, y]) => [x, y, EPS] as [number, number, number]), stack: 1 },
          { pts: outline.map(([x, y]) => [x, y, -EPS] as [number, number, number]), stack: 0 },
        ];
      })(),
      desc: '最后整形：撑开尾巴、折出双腿和前爪——小恐龙站起来啦！',
      tip: '对应原文第16-18步：手部翻折、底部反转出脚。',
    },
    {
      type: 'note',
      desc: '完成！把恐龙立在桌上，调整尾巴角度保持平衡。',
      tip: '头、尾、三条支点——霸王龙的站姿就位。',
    },
  ],
  source: {
    label: '微信公众号「折纸造物记」· 30s学会折纸恐龙🦖，手残党速冲！',
    url: 'http://mp.weixin.qq.com/s?__biz=MzkyMjM0ODcyMA==&mid=2247483907&idx=1&sn=5baf6c6efa04b22d9b19b2ee25b87868&chksm=c1f4ffdcf68376cacc4815a6cd0b469e65d955d465ad67dd1b4dd16a5ef93e91cfc6b2f54910#rd',
  },
};
