import type { Tutorial } from '../engine/fold';
import { cicada } from './tutorials/cicada';
import { cup } from './tutorials/cup';
import { dog } from './tutorials/dog';
import { envelope } from './tutorials/envelope';
import { fan } from './tutorials/fan';
import { fortune } from './tutorials/fortune';
import { house } from './tutorials/house';
import { plane } from './tutorials/plane';
import { rabbit } from './tutorials/rabbit';
import { spinner } from './tutorials/spinner';
import { bunny } from './tutorials/bunny2';
import { frog } from './tutorials/frog2';
import { poop } from './tutorials/poop';
import { dove } from './tutorials/dove';
import { capy } from './tutorials/capy';
import { dino } from './tutorials/dino';
import { shark } from './tutorials/shark';
import { bat } from './tutorials/bat';
import { snake } from './tutorials/snake';
import { dachshund } from './tutorials/dachshund';
import { rooster } from './tutorials/rooster';
import { moonrabbit } from './tutorials/moonrabbit';
import { cat } from './tutorials/cat';
import { fighterjet } from './tutorials/fighterjet';
import { hippo } from './tutorials/hippo';
import albumManifest from './wechat-album.json';

export const tutorials: Tutorial[] = [
  dog,
  rabbit,
  cup,
  house,
  plane,
  fan,
  fortune,
  cicada,
  envelope,
  spinner,
  bunny,
  frog,
  poop,
  dove,
  capy,
  dino,
  shark,
  bat,
  snake,
  dachshund,
  rooster,
  moonrabbit,
  cat,
  fighterjet,
  hippo,
];

export const categories = ['全部', '动物', '玩具', '生活', '节日'];

export function getTutorial(id: string): Tutorial | undefined {
  return tutorials.find((t) => t.id === id);
}

export const difficultyLabel: Record<number, string> = { 1: '入门', 2: '简单', 3: '进阶' };

/** 公众号「折纸造物记」合集《折纸小玩具》的教程库清单 */
export interface AlbumArticle {
  title: string;
  url: string;
  mid: string;
  status: 'todo' | 'done';
}

export const albumArticles: AlbumArticle[] = albumManifest.articles.map((a: { title: string; url: string; mid: string; status: string }) => ({
  title: a.title,
  url: a.url,
  mid: a.mid,
  status: tutorials.some((t) => t.source.url === a.url) ? 'done' : 'todo',
}));

export const albumMeta = { title: albumManifest.album, source: albumManifest.source, total: albumManifest.total };
