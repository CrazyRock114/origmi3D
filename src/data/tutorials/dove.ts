import type { Tutorial } from '../../engine/fold';
import { DIAMOND, v } from '../util';

const EPS = 0.012;

/** 层间 z 微调：k=0..7 均匀铺开，模拟八层纸的厚度 */
function zk(k: number): number {
  return -0.05 + 0.014 * k;
}

/** ⑧⑨ 展开目标：梯形船身（8 层）+ 立起的帆（8 层，顶端微微错开成豁口） */
function openFaces() {
  const faces: { pts: [number, number, number][]; stack: number }[] = [];
  for (let k = 0; k < 8; k++) {
    const z = zk(k);
    faces.push({
      pts: [
        [-0.5, 0, z],
        [0.5, 0, z],
        [0.25, -0.25, z],
        [-0.25, -0.25, z],
      ],
      stack: k,
    });
  }
  for (let k = 0; k < 8; k++) {
    const z = zk(k);
    faces.push({
      pts: [
        [-0.05, 0, z],
        [0.3, 0, z],
        [0.3, 0.22 + 0.006 * k, 0.39 - 0.004 * k],
      ],
      stack: k,
    });
  }
  return faces;
}

/** 船身五边形（头部、尾部折好后剩下的身体，保持不动） */
function bodyPentagon(z: number): [number, number, number][] {
  return [
    [-0.08, 0, z],
    [0.225, 0, z],
    [0.225, -0.25, z],
    [-0.25, -0.25, z],
    [-0.29, -0.21, z],
  ];
}

/** ⑮ 最后整理目标：和平鸽定型轮廓（身体 8 层 + 头/喙/翅/尾双层） */
function finalFaces() {
  const faces: { pts: [number, number, number][]; stack: number }[] = [];
  for (let k = 0; k < 8; k++) {
    faces.push({ pts: bodyPentagon(zk(k)), stack: k });
  }
  for (const s of [1, 0]) {
    const z = s === 1 ? EPS : -EPS;
    faces.push({
      // 头部：从身体左端伸出，尖朝左
      pts: [
        [-0.5, 0, z],
        [-0.92, -0.1, z],
        [-0.25, -0.25, z],
      ],
      stack: s,
    });
    faces.push({
      // 喙：头部尖端的小三角（⑫内翻形成）
      pts: [
        [-0.92, -0.1, z + 0.004],
        [-0.84, -0.26, z + 0.004],
        [-0.74, -0.16, z + 0.004],
      ],
      stack: s,
    });
    faces.push({
      // 翅膀：由立帆展开，向右上撑开、微微抬起
      pts: [
        [-0.15, 0, z],
        [0.35, 0, z],
        [0.55, 0.38, 0.28],
      ],
      stack: s === 1 ? 9 : 0,
    });
    faces.push({
      // 尾部：从身体右端翻向右下
      pts: [
        [0.25, -0.25, z],
        [0.5, 0, z],
        [0.7, -0.42, z],
        [0.4, -0.32, z],
      ],
      stack: s,
    });
  }
  return faces;
}

/** 和平鸽 —— 公众号「折纸造物记」《愿大数据推送给每一位热爱和平生活的人🕊️》 */
export const dove: Tutorial = {
  id: 'dove',
  title: '和平鸽',
  emoji: '🕊️',
  category: '动物',
  difficulty: 2,
  minutes: 12,
  intro:
    '来自公众号「折纸造物记」的和平鸽：三角形基础层层收拢，打开立起一面「帆」，头部内翻出喙、尾部对齐红线，最后展开翅膀——一只衔着和平的鸽子就飞起来了。',
  paper: { outline: DIAMOND, front: '#3E8FC7', back: '#A6D3EF' },
  steps: [
    {
      type: 'note',
      desc: '准备一张 15×15cm 正方形纸，旋转 45° 菱形摆放。',
      tip: '一张纸，折出温柔与和平。',
    },
    {
      type: 'fold',
      a: v(0, -1),
      b: v(0, 1),
      m: v(-0.4, 0),
      dir: 'valley',
      desc: '沿中心竖线对折，左半折向右半。',
      tip: '得到一个尖朝右的三角形。',
    },
    {
      type: 'fold',
      a: v(0, 0),
      b: v(1, 0),
      m: v(0.4, 0.4),
      dir: 'valley',
      desc: '沿水平中线把上半个三角形向下翻折。',
      tip: '现在是直角朝左上、四层厚的小三角形。',
    },
    {
      type: 'fold',
      a: v(0, 0),
      b: v(0.5, -0.5),
      m: v(0.1, -0.4),
      dir: 'valley',
      desc: '沿 45° 中心线把左半向右翻折——翻面后另一侧同样操作，这里一并折好。',
      tip: '得到尖朝下、八层厚的三角形。',
    },
    {
      type: 'fold',
      a: v(0.25, -0.25),
      b: v(0.75, -0.25),
      m: v(0.5, -0.45),
      dir: 'valley',
      desc: '旋转，把底部的尖角沿中线向上折压。',
      tip: '尖角正好落到上边缘上。',
    },
    {
      type: 'note',
      desc: '把折上来的角向内挤压，整理成一个梯形。',
    },
    {
      type: 'pose',
      faces: openFaces(),
      desc: '由右向左向上展开，翻面后另一侧同样操作——纸层打开，一面「帆」立了起来。',
      tip: '船身保持不动，中间的纸层向上立起，顶部微微错开。',
    },
    {
      type: 'prefold',
      a: v(-0.08, 0),
      b: v(-0.29, -0.21),
      m: v(-0.45, -0.05),
      dir: 'valley',
      desc: '头部沿虚线向下翻折，压出折痕后展开。',
      tip: '这条折痕等会儿要向内翻。',
    },
    {
      type: 'fold',
      a: v(-0.08, 0),
      b: v(-0.29, -0.21),
      m: v(-0.45, -0.05),
      dir: 'mountain',
      angle: 150,
      desc: '沿折痕把头部向内翻折，压出尖尖的喙。',
    },
    {
      type: 'prefold',
      a: v(0.225, 0),
      b: v(0.225, -0.28),
      m: v(0.4, -0.1),
      dir: 'valley',
      desc: '尾部沿虚线向左翻折，尖端对齐立帆左缘的「红线」，压出折痕后展开。',
    },
    {
      type: 'fold',
      a: v(0.225, 0),
      b: v(0.225, -0.28),
      m: v(0.4, -0.1),
      dir: 'valley',
      desc: '再沿折痕把尾部向左对折——尾尖正好碰到红线。',
    },
    {
      type: 'pose',
      faces: finalFaces(),
      desc: '最后整理：翅膀向右上展开，头部抬起、尾部翻向下方——和平鸽完成！',
      tip: '对应原文最后一步「向下挤压」：尾部压向身体下方，翅膀微微张开。',
    },
    {
      type: 'note',
      desc: '完成！轻轻把翅膀撑开，愿和平常伴。',
      tip: '把翅膀与身体之间的角度撑大一点，鸽子更精神。',
    },
  ],
  source: {
    label: '微信公众号「折纸造物记」· 愿大数据推送给每一位热爱和平生活的人🕊️',
    url: 'http://mp.weixin.qq.com/s?__biz=MzkyMjM0ODcyMA==&mid=2247484570&idx=1&sn=7307f4895b43096852cb1ac2f4d95eae&chksm=c1f4f945f6837053fbf940c640acc0ea54bef76055cb10f813ce023c2fd5de524f5a42caa8e9#rd',
  },
};
