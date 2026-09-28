import type { Tutorial } from '../../engine/fold';
import { DIAMOND, v } from '../util';

/** 爱心信封 —— 四个角依次折向中心的经典信封，装一封小情书 */
export const envelope: Tutorial = {
  id: 'envelope',
  title: '爱心信封',
  emoji: '💌',
  category: '节日',
  difficulty: 1,
  minutes: 4,
  intro: '四个角依次折向中心，做一个装悄悄话的小信封。',
  paper: { outline: DIAMOND, front: '#FFF9F0', back: '#7FB3E8' },
  steps: [
    {
      type: 'fold',
      a: v(-0.5, -0.5),
      b: v(0.5, -0.5),
      m: v(0, -0.9),
      dir: 'valley',
      desc: '把下面的角向上折，尖端对准纸的正中心。',
      tip: '中心就是两条对角线的交点。',
    },
    {
      type: 'fold',
      a: v(-0.5, -0.5),
      b: v(-0.5, 0.5),
      m: v(-0.9, 0),
      dir: 'valley',
      desc: '把左边的角向右折，尖端也对准中心。',
    },
    {
      type: 'fold',
      a: v(0.5, -0.5),
      b: v(0.5, 0.5),
      m: v(0.9, 0),
      dir: 'valley',
      desc: '右边的角同样向左折，四个尖角在中心碰头。',
    },
    {
      type: 'fold',
      a: v(-0.5, 0.5),
      b: v(0.5, 0.5),
      m: v(0, 0.9),
      dir: 'valley',
      desc: '最后把上面的角向下折，盖住中间。',
      tip: '把第一个角塞进这个盖子里，信封就封好了。',
    },
    {
      type: 'note',
      desc: '完成！翻过来画上爱心和邮票，把悄悄话写好装进去吧。',
    },
  ],
  source: { label: 'Origami Fun · Origami Envelope', url: 'https://www.origami-fun.com/origami-envelope.html' },
};
