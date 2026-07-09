export interface IslamicEvent {
  name: string;
  type: 'holiday' | 'fast';
}

export function getIslamicEvents(day: number, month: number, dayOfWeek: number): IslamicEvent[] {
  const events: IslamicEvent[] = [];

  // Holidays
  if (month === 1 && day === 1) events.push({ name: 'Islamic New Year', type: 'holiday' });
  if (month === 3 && day === 12) events.push({ name: 'Mawlid an-Nabi', type: 'holiday' });
  if (month === 7 && day === 27) events.push({ name: "Isra' and Mi'raj", type: 'holiday' });
  if (month === 8 && day === 15) events.push({ name: "Mid-Sha'ban", type: 'holiday' });
  if (month === 10 && day === 1) events.push({ name: 'Eid al-Fitr', type: 'holiday' });
  if (month === 12 && day === 10) events.push({ name: 'Eid al-Adha', type: 'holiday' });
  if (month === 12 && day >= 11 && day <= 13) events.push({ name: 'Days of Tashriq', type: 'holiday' });

  // Fast Days (Sunnah)
  // Do not fast on Eid or Tashriq
  const isForbiddenToFast = (month === 10 && day === 1) || (month === 12 && day >= 10 && day <= 13);
  
  if (!isForbiddenToFast) {
    if (month === 9) {
      events.push({ name: 'Ramadan Fasting', type: 'fast' });
    } else {
      if (month === 1 && day === 9) events.push({ name: "Tasu'a", type: 'fast' });
      if (month === 1 && day === 10) events.push({ name: 'Ashura', type: 'fast' });
      if (month === 12 && day === 9) events.push({ name: 'Day of Arafah', type: 'fast' });
      if (day >= 13 && day <= 15) events.push({ name: 'Ayyam al-Bidh (White Days)', type: 'fast' });
      if (dayOfWeek === 1 || dayOfWeek === 4) events.push({ name: 'Monday/Thursday Fast', type: 'fast' });
    }
  }

  return events;
}
