import type { Tutorial } from '../../engine/fold';
import { RECT_LANDSCAPE, v } from '../util';

/** 纸宽 2.4，七等分，折痕必须用精确等分值，否则后续落点会错位 */
const B = (k: number) => 1.2 - (k * 2.4) / 7;

/** 折扇 —— 像折手风琴一样来回折，最古老的“扇子” */
export const fan: Tutorial = {
  id: 'fan',
  title: '小折扇',
  emoji: '🪭',
  category: '玩具',
  difficulty: 1,
  minutes: 5,
  intro: '像折手风琴一样来回折，一拉开就是一把小扇子。',
  paper: { outline: RECT_LANDSCAPE, front: '#FF9EB5', back: '#FFE0EA' },
  steps: [
    {
      type: 'fold',
      a: v(B(1), -0.75),
      b: v(B(1), 0.75),
      m: v(B(0.5), 0),
      dir: 'valley',
      desc: '把右边约七分之一宽的纸向左折过来。',
      tip: '像折手风琴一样，一正一反地折。',
    },
    {
      type: 'fold',
      a: v(B(2), -0.75),
      b: v(B(2), 0.75),
      m: v(B(1.5), 0),
      dir: 'valley',
      desc: '把叠好的部分向右折回来。',
    },
    {
      type: 'fold',
      a: v(B(3), -0.75),
      b: v(B(3), 0.75),
      m: v(B(2.5), 0),
      dir: 'valley',
      desc: '再向左折。',
    },
    {
      type: 'fold',
      a: v(B(4), -0.75),
      b: v(B(4), 0.75),
      m: v(B(3.5), 0),
      dir: 'valley',
      desc: '再向右折。',
      tip: '保持每条折痕平行、宽度一致。',
    },
    {
      type: 'fold',
      a: v(B(5), -0.75),
      b: v(B(5), 0.75),
      m: v(B(4.5), 0),
      dir: 'valley',
      desc: '再向左折。',
    },
    {
      type: 'fold',
      a: v(B(6), -0.75),
      b: v(B(6), 0.75),
      m: v(B(5.5), 0),
      dir: 'valley',
      desc: '最后向右折一次，把整条纸都折完。',
    },
    {
      type: 'note',
      desc: '完成！捏住下端，把上面的褶子拉开——一把小扇子！',
      tip: '底端卷上一圈胶带，扇子更结实。',
    },
  ],
  source: { label: 'Origami Fun · Origami Fan', url: 'https://web.archive.org/web/2024/https://www.origami-fun.com/origami-fan.html' },
};
