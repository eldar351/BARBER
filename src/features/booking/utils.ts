import { DateAvailability } from './types';

export function getUpcomingDates() {
  const dates: Date[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let index = 0; index < 14; index += 1) {
    const date = new Date(today);
    date.setDate(today.getDate() + index);
    dates.push(date);
  }
  return dates;
}

export function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function formatShortWeekday(date: Date) {
  return date.toLocaleDateString('he-IL', { weekday: 'short' });
}

export function formatShortDate(date: Date) {
  return date.toLocaleDateString('he-IL', { day: 'numeric', month: 'short' });
}

export function formatLongDate(date: Date) {
  return date.toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' });
}

export function formatIsoDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function getDateStateText(state?: DateAvailability) {
  if (!state || state.kind === 'loading') return 'בודק זמינות...';
  if (state.kind === 'available') return `${state.availableCount} חלונות פנויים מתוך ${state.totalCount}`;
  if (state.kind === 'full') return `כל ${state.totalCount} החלונות ביום הזה תפוסים כרגע`;
  return 'אין חלון עבודה פעיל ביום הזה';
}
