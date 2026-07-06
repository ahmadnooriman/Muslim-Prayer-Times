import { PrayerTimesData } from '../types';

export type PrayerKey = 'fajr' | 'sunrise' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

export interface ActivePrayerState {
  current: PrayerKey;
  next: PrayerKey;
  nextTime: Date;
}

export const PRAYER_NAMES: Record<PrayerKey, string> = {
  fajr: 'Fajr',
  sunrise: 'Sunrise',
  dhuhr: 'Dhuhr',
  asr: 'Asr',
  maghrib: 'Maghrib',
  isha: 'Isha'
};

export const PRAYER_ARABIC_NAMES: Record<PrayerKey, string> = {
  fajr: 'الفجر',
  sunrise: 'الشروق',
  dhuhr: 'الظهر',
  asr: 'العصر',
  maghrib: 'المغرب',
  isha: 'العشاء'
};

/**
 * Determines the currently active prayer and the next prayer
 * @param times The current day's prayer times
 * @param now The current Date and time
 */
export function getActivePrayerState(times: PrayerTimesData, now: Date): ActivePrayerState {
  const { fajr, sunrise, dhuhr, asr, maghrib, isha } = times;
  
  const nowMs = now.getTime();
  
  if (nowMs >= isha.getTime()) {
    // Tomorrow's Fajr
    const tomorrowFajr = new Date(fajr);
    tomorrowFajr.setDate(tomorrowFajr.getDate() + 1);
    return { current: 'isha', next: 'fajr', nextTime: tomorrowFajr };
  }
  
  if (nowMs < fajr.getTime()) {
    return { current: 'isha', next: 'fajr', nextTime: fajr };
  }
  if (nowMs >= fajr.getTime() && nowMs < sunrise.getTime()) {
    return { current: 'fajr', next: 'sunrise', nextTime: sunrise };
  }
  if (nowMs >= sunrise.getTime() && nowMs < dhuhr.getTime()) {
    return { current: 'sunrise', next: 'dhuhr', nextTime: dhuhr };
  }
  if (nowMs >= dhuhr.getTime() && nowMs < asr.getTime()) {
    return { current: 'dhuhr', next: 'asr', nextTime: asr };
  }
  if (nowMs >= asr.getTime() && nowMs < maghrib.getTime()) {
    return { current: 'asr', next: 'maghrib', nextTime: maghrib };
  }
  // nowMs >= maghrib.getTime() && nowMs < isha.getTime()
  return { current: 'maghrib', next: 'isha', nextTime: isha };
}

/**
 * Formats a Date object into local 12-hour AM/PM format
 */
export function formatPrayerTime(date: Date): string {
  return date.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

/**
 * Calculates remaining hours, minutes, and seconds to the next prayer
 */
export function getCountdownTime(targetDate: Date, now: Date): {
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
} {
  const diffMs = targetDate.getTime() - now.getTime();
  if (diffMs <= 0) {
    return { hours: 0, minutes: 0, seconds: 0, totalSeconds: 0 };
  }
  
  const totalSeconds = Math.floor(diffMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  return { hours, minutes, seconds, totalSeconds };
}
