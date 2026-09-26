import raw from '../../mocks/api-editorial.json';
import { resolve } from './client';

export interface EditorialEntry {
  id: string;
  eyebrow: string;
  title: string;
  body: string;
  href: string;
}

interface EditorialPayload {
  looks: EditorialEntry[];
  shows: EditorialEntry[];
}

const editorial = raw as EditorialPayload;

export const getLooks = async (): Promise<EditorialEntry[]> => resolve(editorial.looks);
export const getShows = async (): Promise<EditorialEntry[]> => resolve(editorial.shows);
