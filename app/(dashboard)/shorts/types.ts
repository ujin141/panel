export interface Scene {
  id: string;
  type: 'hook' | 'agitate' | 'solution' | 'result' | 'cta';
  emoji: string;
  text: string;
  subtext: string;
  duration: number;
  fontSize: 'xl' | 'lg' | 'md';
  color: string;
}

export type BgStyle = 'gradient' | 'video' | 'dark' | 'upload';

