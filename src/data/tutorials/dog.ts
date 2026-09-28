import type { Tutorial } from '../../engine/fold';
import { DIAMOND, v } from '../util';

/** 小狗头 —— 最经典的儿童折纸入门款（菱形对折 + 折耳朵） */
export const dog: Tutorial = {
  id: 'dog',
  title: '小狗头',
  emoji: '🐶',
  category: '动物',
  difficulty: 1,
  minutes: 3,
  intro: '只需要四步就能折出一只憨憨的小狗，是最适合入门的经典折纸。',
  paper: { outline: DIAMOND, front: '#FFF9F0', back: '#C68642' },
  steps: [
    {
      type: 'fold',
      a: v(-1, 0),
      b: v(1, 0),
      m: v(0, 1),
      dir: 'valley',
      desc: '把正方形摆成菱形，上面的角向下对折，压平成三角形。',
      tip: '边对齐再压实，折痕越整齐，小狗越精神。',
    },
    {
      type: 'fold',
      a: v(-0.12, 0),
      b: v(-0.52, -0.5),
      m: v(-0.85, -0.18),
      dir: 'valley',
      desc: '把左边的角斜着向下折，做成左耳朵。',
    },
    {
      type: 'fold',
      a: v(0.12, 0),
      b: v(0.52, -0.5),
      m: v(0.85, -0.18),
      dir: 'valley',
      desc: '同样把右边的角向下折，两只耳朵要对称哦。',
      tip: '折之前先比一比两边的角度。',
    },
    {
      type: 'fold',
      a: v(-0.32, -0.62),
      b: v(0.32, -0.62),
      m: v(0, -0.92),
      dir: 'mountain',
      desc: '把下面的尖角向后上方折进去，这是小狗的下巴。',
    },
    {
      type: 'note',
      desc: '完成！用笔画上眼睛和鼻子，小狗就活灵活现啦。',
      tip: '也可以贴上活动眼睛贴纸。',
    },
  ],
  source: { label: 'Origami Fun · Origami Dog Face', url: 'https://www.origami-fun.com/origami-dog.html' },
};
