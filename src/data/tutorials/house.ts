import type { Tutorial } from '../../engine/fold';
import { SQUARE, v } from '../util';

/** 小房子 —— 经典儿童折法：两角折向中线出尖顶 */
export const house: Tutorial = {
  id: 'house',
  title: '小房子',
  emoji: '🏠',
  category: '生活',
  difficulty: 1,
  minutes: 3,
  intro: '红顶小房子，折好可以画上门窗，办家家、搭小镇都好用。',
  paper: { outline: SQUARE, front: '#FFF9F0', back: '#E2574C' },
  steps: [
    {
      type: 'fold',
      a: v(-1, 0),
      b: v(0, 1),
      m: v(-0.7, 0.7),
      dir: 'valley',
      desc: '把左上角沿斜线折下来，尖角对准纸的中心。',
      tip: '折痕的上端正好在上边的中点。',
    },
    {
      type: 'fold',
      a: v(0, 1),
      b: v(1, 0),
      m: v(0.7, 0.7),
      dir: 'valley',
      desc: '右上角同样折下来，两个尖角在中心碰头。',
      tip: '上面出现一个尖尖的屋顶。',
    },
    {
      type: 'fold',
      a: v(-0.28, 0.7),
      b: v(0.28, 0.7),
      m: v(0, 0.9),
      dir: 'valley',
      desc: '把屋顶凸出来的小尖角向下折平。',
    },
    {
      type: 'fold',
      a: v(-1, -0.55),
      b: v(1, -0.55),
      m: v(0, -0.9),
      dir: 'valley',
      desc: '把底边向上折一条，做房子的地基。',
    },
    {
      type: 'flip',
      axis: 'y',
      desc: '翻个面，光滑的房顶就朝上了。',
    },
    {
      type: 'note',
      desc: '完成！画上门和窗，一座小房子盖好了。',
      tip: '折一排小房子，就是一条小街啦。',
    },
  ],
  source: { label: 'Origami Make · Origami House', url: 'http://en.origami-make.org/origami-house-simple' },
};
