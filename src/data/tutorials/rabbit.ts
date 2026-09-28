import type { Tutorial } from '../../engine/fold';
import { DIAMOND, v } from '../util';

/** 小兔头 —— 菱形对折后两角折向底尖，再把两只耳朵立起来 */
export const rabbit: Tutorial = {
  id: 'rabbit',
  title: '小兔头',
  emoji: '🐰',
  category: '动物',
  difficulty: 1,
  minutes: 4,
  intro: '粉粉的小兔子，两只长耳朵竖起来，特别可爱。',
  paper: { outline: DIAMOND, front: '#FFF9F0', back: '#F48FB1' },
  steps: [
    {
      type: 'fold',
      a: v(-1, 0),
      b: v(1, 0),
      m: v(0, 1),
      dir: 'valley',
      desc: '菱形上面的角向下对折，折成尖朝下的三角形。',
    },
    {
      type: 'fold',
      a: v(-0.5, -0.5),
      b: v(0, 0),
      m: v(-0.8, -0.3),
      dir: 'valley',
      desc: '把左边的角向右下方折，尖端对准下面的尖角。',
      tip: '两个尖角碰在一起就对了。',
    },
    {
      type: 'fold',
      a: v(0.5, -0.5),
      b: v(0, 0),
      m: v(0.8, -0.3),
      dir: 'valley',
      desc: '右边的角同样向左下方折，变成一个小的正方形。',
    },
    {
      type: 'fold',
      a: v(-0.5, -0.5),
      b: v(0, -0.35),
      m: v(-0.2, -0.55),
      dir: 'valley',
      layersMin: 2,
      desc: '只把上面一层纸沿着斜线向上折，竖起左耳朵。',
      tip: '只折一层，耳朵才会翘起来。',
    },
    {
      type: 'fold',
      a: v(0.5, -0.5),
      b: v(0, -0.35),
      m: v(0.2, -0.55),
      dir: 'valley',
      layersMin: 4,
      desc: '把右边这层也向上折，竖起右耳朵。',
    },
    {
      type: 'fold',
      a: v(-0.28, -0.78),
      b: v(0.28, -0.78),
      m: v(0, -0.95),
      dir: 'mountain',
      desc: '把下面的尖角向后折一小段，兔子就有圆圆的下巴了。',
    },
    {
      type: 'note',
      desc: '完成！画上红眼睛和三瓣嘴，小兔子完成啦。',
    },
  ],
  source: { label: 'Origami Fun · Origami Rabbit Face', url: 'https://web.archive.org/web/2024/https://www.origami-fun.com/origami-rabbit.html' },
};
