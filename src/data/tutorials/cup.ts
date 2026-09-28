import type { Tutorial } from '../../engine/fold';
import { DIAMOND, v } from '../util';

/** 纸杯 —— 经典 Drinking Cup，真的能装水（用防水纸） */
export const cup: Tutorial = {
  id: 'cup',
  title: '小纸杯',
  emoji: '🥤',
  category: '生活',
  difficulty: 1,
  minutes: 4,
  intro: '一个真正能装东西的小纸杯，露营游戏里特别实用。',
  paper: { outline: DIAMOND, front: '#FFF8F0', back: '#E4573D' },
  steps: [
    {
      type: 'fold',
      a: v(-1, 0),
      b: v(1, 0),
      m: v(0, -1),
      dir: 'valley',
      desc: '菱形下面的角向上对折，折成尖朝上的三角形。',
    },
    {
      type: 'prefold',
      a: v(-0.5, 0.5),
      b: v(0.5, 0.5),
      m: v(0, 0.9),
      dir: 'valley',
      desc: '把上面的尖角向下折到底边，压出折痕后展开。',
      tip: '这条折痕决定了杯口的高度。',
    },
    {
      type: 'fold',
      a: v(-0.375, 0),
      b: v(-0.583, 0.417),
      m: v(-0.85, 0.2),
      dir: 'valley',
      desc: '把左下角斜着向上折，尖端刚好碰到刚才的折痕线。',
    },
    {
      type: 'fold',
      a: v(0.375, 0),
      b: v(0.583, 0.417),
      m: v(0.85, 0.2),
      dir: 'valley',
      desc: '右下角同样向上折，两个尖角在中间碰头。',
    },
    {
      type: 'fold',
      a: v(-0.5, 0.5),
      b: v(0.5, 0.5),
      m: v(0, 0.8),
      dir: 'valley',
      layersMin: 1,
      desc: '把上面一层的三角向下折，盖住两个尖角。',
      tip: '只折前面这一层。',
    },
    {
      type: 'fold',
      a: v(-0.5, 0.5),
      b: v(0.5, 0.5),
      m: v(0, 0.8),
      dir: 'mountain',
      desc: '把后面那层三角向后折。',
    },
    {
      type: 'note',
      desc: '完成！从杯口轻轻撑开，一个小纸杯就做好了。',
      tip: '用防水蜡纸折的话，真的能装水哦。',
    },
  ],
  source: { label: 'Origami Fun · Origami Drinking Cup', url: 'https://www.origami-fun.com/origami-drinking-cup.html' },
};
