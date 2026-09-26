/** Domain types for the social module. Apps extend these; the module never
 * assumes more than what is declared here. */

/** A person who posts. */
export interface SocialAuthor {
  handle: string;
  name: string;
  avatar?: string;
  bio?: string;
  verified?: boolean;
  stats?: { followers: number; following: number; likes: number };
}

/** The sound a post plays. On the reference apps this is a first-class object
 * — the marquee row under the caption — not a caption suffix. */
export interface SocialSound {
  title: string;
  artist: string;
}

/** One post in a feed. `poster` is the still that stands in for the video;
 * `slides` marks a photo-mode post — several stills played left to right. */
export interface SocialPost {
  id: string;
  author: SocialAuthor;
  caption: string;
  hashtags?: string[];
  sound?: SocialSound;
  poster?: string;
  slides?: string[];
  stats: { likes: number; comments: number; saves: number; shares: number; views?: number };
  postedAt?: string;
  [key: string]: unknown;
}

/** A comment under a post. */
export interface SocialComment {
  id: string;
  postId: string;
  author: SocialAuthor;
  body: string;
  likes: number;
  postedAt?: string;
  /** Threaded replies, one level deep — the reference's model. */
  replies?: SocialComment[];
}

/** Which feed is being watched. */
export type SocialFeedKind = 'for-you' | 'following';
