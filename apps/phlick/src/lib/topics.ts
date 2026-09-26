/**
 * The phlick taxonomy — one category per folder in `assets/`, declared once
 * here: the rail menu, the topic tabs and the media pipeline all read this
 * list. `slug` is the folder name; `label` pointer resolves through locales.
 */
import {
  Aperture, Camera, Car, Clapperboard, Coins, Film, LayoutGrid,
  MessagesSquare, Mic, Shirt, Users, type LucideIcon,
} from 'lucide-react';
import { t } from '../locales/t';

export interface Topic {
  slug: string;
  label: string;
  icon: LucideIcon;
}

export const TOPICS: Topic[] = [
  { slug: 'chaps',  label: t.topics.chaps,  icon: Shirt },
  { slug: 'chats',  label: t.topics.chats,  icon: MessagesSquare },
  { slug: 'clubs',  label: t.topics.clubs,  icon: Users },
  { slug: 'coins',  label: t.topics.coins,  icon: Coins },
  { slug: 'hosts',  label: t.topics.hosts,  icon: Mic },
  { slug: 'reels',  label: t.topics.reels,  icon: Film },
  { slug: 'rides',  label: t.topics.rides,  icon: Car },
  { slug: 'shots',  label: t.topics.shots,  icon: Aperture },
  { slug: 'shows',  label: t.topics.shows,  icon: Clapperboard },
  { slug: 'snaps',  label: t.topics.snaps,  icon: Camera },
  { slug: 'zones',  label: t.topics.zones,  icon: LayoutGrid },
];

export const topicBySlug = (slug: string): Topic | undefined =>
  TOPICS.find((x) => x.slug === slug);
