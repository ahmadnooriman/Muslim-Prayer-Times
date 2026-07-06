import { HijriDate } from '../types';

export const HIJRI_MONTHS = [
  "Muharram",
  "Safar",
  "Rabi' al-Awwal",
  "Rabi' ath-Thani",
  "Jumada al-Awwal",
  "Jumada al-Akhirah",
  "Rajab",
  "Sha'ban",
  "Ramadan",
  "Shawwal",
  "Dhu al-Qa'dah",
  "Dhu al-Hijjah"
];

/**
 * Converts a Gregorian Date to Hijri date using Umm al-Qura calendar
 * @param date The Gregorian date to convert
 * @param offsetDays Manual adjustment offset (-2 to +2 days)
 * @param isAfterMaghrib Whether the current time is after Maghrib (adds 1 day)
 */
export function gregorianToHijri(date: Date, offsetDays: number = 0, isAfterMaghrib: boolean = false): HijriDate {
  // Create a new date object and add offset days + Maghrib adjustment
  const totalOffsetDays = offsetDays + (isAfterMaghrib ? 1 : 0);
  const targetDate = new Date(date.getTime() + totalOffsetDays * 24 * 60 * 60 * 1000);

  // Use Intl.DateTimeFormat for accurate Umm al-Qura Islamic calendar
  const formatter = new Intl.DateTimeFormat('en-US-u-ca-islamic-umalqura', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric'
  });

  const parts = formatter.formatToParts(targetDate);
  
  let hDay = 1;
  let hMonth = 1;
  let hYear = 1445;

  for (const part of parts) {
    if (part.type === 'day') hDay = parseInt(part.value, 10);
    if (part.type === 'month') hMonth = parseInt(part.value, 10);
    if (part.type === 'year') hYear = parseInt(part.value, 10);
  }

  // Ensure month is within 1-12 bounds (fallback just in case)
  const monthIdx = Math.max(0, Math.min(11, hMonth - 1));
  const monthName = HIJRI_MONTHS[monthIdx];

  return {
    day: hDay,
    monthName,
    monthNumber: hMonth,
    year: hYear,
    formatted: `${hDay} ${monthName} ${hYear} AH`
  };
}
