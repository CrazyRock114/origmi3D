import type { Tutorial } from '../../engine/fold';
import { SQUARE, v } from '../util';

/** 快捷构造 pose 面片：z=0 的平面多边形 */
const f = (...pts: [number, number][]): { pts: [number, number, number][] } => ({
  pts: pts.map(([x, y]) => [x, y, 0] as [number, number, number]),
});

// ---------------------------------------------------------------------------
// 陀螺几何（源自微信公众号「折纸造物记」《折纸陀螺》步骤图）
// ---------------------------------------------------------------------------

/** 风车基础形：中央菱形（Blintz 内四边形）+ 四片带旋转弧度的风车叶 */
const windmillFaces = [
  { ...f([0.5, 0], [0, 0.5], [-0.5, 0], [0, -0.5]), stack: 2 },
  { ...f([-0.5, 0], [0, 0.5], [0.08, 0.97]), stack: 0 },
  { ...f([0, 0.5], [0.5, 0], [0.97, -0.08]), stack: 0 },
  { ...f([0.5, 0], [0, -0.5], [-0.08, -0.97]), stack: 0 },
  { ...f([0, -0.5], [-0.5, 0], [-0.97, 0.08]), stack: 0 },
];

// 陀螺：锥形轴心 + 三片叶片（三重旋转对称）
const rim: [number, number, number][] = [
  [0, 0.45, 0.1],
  [-0.39, -0.225, 0.1],
  [0.39, -0.225, 0.1],
];
const apex: [number, number, number] = [0, 0, 0.45];

/** 完成版：叶片沿中线内凹、叶尖微翘 */
const finalFaces: { pts: [number, number, number][]; stack: number }[] = [
  { pts: [rim[0], rim[1], apex], stack: 3 },
  { pts: [rim[1], rim[2], apex], stack: 3 },
  { pts: [rim[2], rim[0], apex], stack: 3 },
  // 叶片 0（左上）：沿中线拆成两片，外段翘起
  {
    pts: [
      rim[1],
      [(rim[0][0] + rim[1][0]) / 2, (rim[0][1] + rim[1][1]) / 2, 0.1],
      [-0.92, 0.53, 0.2],
    ],
    stack: 0,
  },
  {
    pts: [
      [(rim[0][0] + rim[1][0]) / 2, (rim[0][1] + rim[1][1]) / 2, 0.1],
      rim[0],
      [-0.92, 0.53, 0.2],
    ],
    stack: 1,
  },
  // 叶片 1（下方）
  {
    pts: [rim[2], [0, -0.225, 0.1], [0, -1.0, 0.2]],
    stack: 0,
  },
  {
    pts: [[0, -0.225, 0.1], rim[1], [0, -1.0, 0.2]],
    stack: 1,
  },
  // 叶片 2（右侧）
  {
    pts: [rim[0], [(rim[2][0] + rim[0][0]) / 2, (rim[2][1] + rim[0][1]) / 2, 0.1], [0.92, 0.53, 0.2]],
    stack: 0,
  },
  {
    pts: [
      [(rim[2][0] + rim[0][0]) / 2, (rim[2][1] + rim[0][1]) / 2, 0.1],
      rim[2],
      [0.92, 0.53, 0.2],
    ],
    stack: 1,
  },
];

export const spinner: Tutorial = {
  id: 'spinner',
  title: '指尖陀螺',
  emoji: '🌀',
  category: '玩具',
  difficulty: 2,
  minutes: 15,
  intro:
    '来自公众号「折纸造物记」的立体折纸教程：一张 15cm 正方形纸，折出真的能转的指尖陀螺——中间撑起锥形轴心，三片内凹叶片。',
  paper: { outline: SQUARE, front: '#4A90D9', back: '#2E6FB0' },
  steps: [
    {
      type: 'prefold',
      a: v(-1, -1),
      b: v(1, 1),
      m: v(-1, 1),
      dir: 'valley',
      desc: '沿对角线对折，压出折痕后展开。',
      tip: '两条对角线都要压实，后面全靠它们。',
    },
    {
      type: 'prefold',
      a: v(-1, 1),
      b: v(1, -1),
      m: v(-1, -1),
      dir: 'valley',
      desc: '另一条对角线同样对折后展开。',
    },
    {
      type: 'prefold',
      a: v(0, -1),
      b: v(0, 1),
      m: v(-0.5, 0),
      dir: 'valley',
      desc: '左右对折出竖直中线，展开。',
    },
    {
      type: 'prefold',
      a: v(-1, 0),
      b: v(1, 0),
      m: v(0, -0.5),
      dir: 'valley',
      desc: '上下对折出水平中线，展开。',
    },
    {
      type: 'prefold',
      a: v(-0.5, -1),
      b: v(-0.5, 1),
      m: v(-0.9, 0),
      dir: 'valley',
      desc: '左边缘折向竖直中线，压出四分线后展开。',
    },
    {
      type: 'prefold',
      a: v(0.5, -1),
      b: v(0.5, 1),
      m: v(0.9, 0),
      dir: 'valley',
      desc: '右边缘同样折出四分线，展开。',
    },
    {
      type: 'prefold',
      a: v(-1, -0.5),
      b: v(1, -0.5),
      m: v(0, -0.9),
      dir: 'valley',
      desc: '下边缘折向水平中线，展开。',
    },
    {
      type: 'prefold',
      a: v(-1, 0.5),
      b: v(1, 0.5),
      m: v(0, 0.9),
      dir: 'valley',
      desc: '上边缘同样折出四分线，展开。',
      tip: '现在纸上有了一个 4×4 的折痕网格。',
    },
    {
      type: 'fold',
      a: v(-1, 0),
      b: v(0, -1),
      m: v(-0.8, -0.8),
      dir: 'valley',
      desc: '左下角沿斜线折向中心。',
    },
    {
      type: 'fold',
      a: v(0, -1),
      b: v(1, 0),
      m: v(0.8, -0.8),
      dir: 'valley',
      desc: '右下角折向中心。',
    },
    {
      type: 'fold',
      a: v(-1, 0),
      b: v(0, 1),
      m: v(-0.8, 0.8),
      dir: 'valley',
      desc: '左上角折向中心。',
    },
    {
      type: 'fold',
      a: v(0, 1),
      b: v(1, 0),
      m: v(0.8, 0.8),
      dir: 'valley',
      desc: '右上角折向中心，四个角在中心碰头。',
    },
    {
      type: 'pose',
      spin: -Math.PI / 2,
      faces: windmillFaces,
      desc: '捏住四边向中心靠拢，让每个方向各留出一片，按压平整——风车基础形！',
      tip: '这是最神奇的一步：跟着图片把四条边立起来，顺着折痕往中间收。',
    },
    {
      type: 'flip',
      axis: 'x',
      desc: '翻到背面，四片叶子的尖角露在外面。',
    },
    {
      type: 'fold',
      a: v(-0.239, -0.437),
      b: v(0.036, -0.712),
      m: v(0.05, -0.8),
      dir: 'valley',
      desc: '把下面这片叶子的尖角沿折线向中心方向折平，锁住风车。',
      tip: '折痕要与叶根的边平行，四片都折到同样的位置。',
    },
    {
      type: 'fold',
      a: v(0.437, -0.239),
      b: v(0.712, 0.036),
      m: v(0.8, 0.05),
      dir: 'valley',
      desc: '右边的叶尖同样向里折平。',
    },
    {
      type: 'fold',
      a: v(0.239, 0.437),
      b: v(-0.036, 0.712),
      m: v(-0.05, 0.8),
      dir: 'valley',
      desc: '上面的叶尖向里折平。',
    },
    {
      type: 'fold',
      a: v(-0.437, 0.239),
      b: v(-0.712, -0.036),
      m: v(-0.8, -0.05),
      dir: 'valley',
      desc: '最后把左边的叶尖也折好，风车就锁住了。',
    },
    {
      type: 'fold',
      a: v(0, -0.97),
      b: v(0, 0.97),
      m: v(0.5, 0),
      dir: 'valley',
      wholeSide: true,
      desc: '沿竖直中线把右半边向左合拢。',
      tip: '合拢后中间会露出三角形的锥面，捏住别松手。',
    },
    {
      type: 'pose',
      faces: finalFaces,
      desc: '把合拢的两半张开约120°，中间用手指撑起锥形轴心；再把三片叶片沿中线向内凹、叶尖微微翘起——陀螺成型！',
      tip: '四片叶里有一片收进了锥体，剩下三片就是陀螺的手臂。',
    },
    {
      type: 'note',
      desc: '完成！捏住中心的锥形尖，用手指一拨叶片，指尖陀螺就呼呼转起来啦！',
      tip: '在桌面上试着立住旋转，比比谁的转得久。',
    },
  ],
  source: {
    label: '微信公众号「折纸造物记」· 折纸陀螺 Origami Fidget Spinner',
    url: 'http://mp.weixin.qq.com/s?__biz=MzkyMjM0ODcyMA==&mid=2247483973&idx=1&sn=b00850d38402c706f2445203db1d2f9d&chksm=c1f4ff9af683768cf39180175c65338e4ddfc56c4356fa6ecd706466eb3264d796790f999c64#rd',
  },
};
