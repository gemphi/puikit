import raw from '../../mocks/api-banners.json';
import { resolve } from './client';

export interface Banner {
  id: string;
  eyebrow: string;
  title: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
}

const banners = raw as Banner[];

export const getBanners = async (): Promise<Banner[]> => resolve(banners);
