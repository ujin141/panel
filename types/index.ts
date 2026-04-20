// PanelAI — Global Type Definitions

export type Platform = 'threads' | 'instagram';
export type ContentType = 'curiosity' | 'emotion' | 'scarcity';
export type DMStage = 'first_response' | 'filter' | 'waitlist';
export type WaitlistStatus = 'pending' | 'approved' | 'rejected';
export type Gender = 'female' | 'male' | 'other' | 'prefer_not';

export interface Profile {
  id: string;
  name: string | null;
  email: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface GrowthMetric {
  id: string;
  user_id: string;
  date: string;
  views: number;
  dms: number;
  waitlist_count: number;
  installs: number;
  created_at: string;
}

export interface ContentPost {
  id: string;
  user_id: string;
  platform: Platform;
  type: ContentType;
  target: string;
  content: string;
  is_saved: boolean;
  created_at: string;
}

export interface DMTemplate {
  id: string;
  user_id: string;
  name: string;
  stage: DMStage;
  script: string;
  created_at: string;
}

export interface WaitlistEntry {
  id: string;
  user_id: string;
  name: string;
  instagram_id: string | null;
  gender: Gender | null;
  interests: string[];
  status: WaitlistStatus;
  tags: string[];
  notes: string | null;
  created_at: string;
}

export interface GrowthLog {
  id: string;
  user_id: string;
  day_number: number;
  title: string;
  description: string | null;
  metrics: Record<string, number>;
  created_at: string;
}

// Chart data
export interface FunnelData {
  stage: string;
  value: number;
  percentage: number;
}

export interface ChartDataPoint {
  date: string;
  views: number;
  dms: number;
  waitlist: number;
  installs: number;
}
