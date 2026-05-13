/**
 * monday.com integration — skeleton للمستقبل.
 * يحتاج MONDAY_API_TOKEN في .env.local لتفعيله.
 *
 * Documentation: https://developer.monday.com/api-reference/docs
 */

import type { CalendarEvent } from './calendar-events';

const MONDAY_API_URL = 'https://api.monday.com/v2';

export function isMondayConfigured(): boolean {
  return Boolean(process.env.MONDAY_API_TOKEN);
}

interface MondayItem {
  id: string;
  name: string;
  column_values: Array<{ id: string; text: string; value: string }>;
}

/**
 * جلب items من board محدد. يرجع [] إذا الـ token غير موجود.
 */
export async function fetchMondayBoard(boardId: string): Promise<MondayItem[]> {
  const token = process.env.MONDAY_API_TOKEN;
  if (!token) return [];

  const query = `query { boards(ids: ${boardId}) { items_page { items { id name column_values { id text value } } } } }`;

  try {
    const res = await fetch(MONDAY_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: token },
      body: JSON.stringify({ query }),
    });
    const data = await res.json();
    return data?.data?.boards?.[0]?.items_page?.items || [];
  } catch (err) {
    console.error('[monday] fetch failed', err);
    return [];
  }
}

/**
 * تحويل items إلى CalendarEvents (date column يجب أن يحمل ID = "date" أو "deadline")
 */
export async function fetchMondayTasksAsEvents(
  boardId: string,
  startDate: Date,
  endDate: Date,
): Promise<CalendarEvent[]> {
  const items = await fetchMondayBoard(boardId);
  const events: CalendarEvent[] = [];

  for (const item of items) {
    const dateCol = item.column_values.find((c) => ['date', 'deadline', 'due_date'].includes(c.id.toLowerCase()));
    if (!dateCol?.text) continue;
    const date = new Date(dateCol.text);
    if (isNaN(date.getTime())) continue;
    if (date < startDate || date > endDate) continue;

    events.push({
      id: `monday_task:${item.id}`,
      type: 'monday_task',
      title: item.name,
      date,
      source: `monday · board ${boardId}`,
      url: `https://view.monday.com/boards/${boardId}/pulses/${item.id}`,
    });
  }

  return events;
}
