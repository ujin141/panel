export type ActivityType = 'short_form' | 'card_news' | 'script_gen' | 'dm_funnel';

export interface DailyActivity {
  date: string; // YYYY-MM-DD
  short_form: number;
  card_news: number;
  script_gen: number;
  dm_funnel: number;
}

const STORAGE_KEY = 'panelai_activity_logs';

function getTodayString(): string {
  const d = new Date();
  return d.toISOString().split('T')[0];
}

export function logActivity(type: ActivityType, count: number = 1) {
  if (typeof window === 'undefined') return;

  try {
    const today = getTodayString();
    const stored = localStorage.getItem(STORAGE_KEY);
    const logs: DailyActivity[] = stored ? JSON.parse(stored) : [];

    let todayLog = logs.find(l => l.date === today);
    if (!todayLog) {
      todayLog = { date: today, short_form: 0, card_news: 0, script_gen: 0, dm_funnel: 0 };
      logs.push(todayLog);
    }

    todayLog[type] += count;

    // 최근 30일 데이터만 유지
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const minDate = thirtyDaysAgo.toISOString().split('T')[0];
    
    const filteredLogs = logs.filter(l => l.date >= minDate);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredLogs));
  } catch (e) {
    console.error('Failed to log activity', e);
  }
}

export function getActivityLogs(): DailyActivity[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    return [];
  }
}

export function getTodayActivity(): DailyActivity {
  const logs = getActivityLogs();
  const today = getTodayString();
  return logs.find(l => l.date === today) || { date: today, short_form: 0, card_news: 0, script_gen: 0, dm_funnel: 0 };
}
