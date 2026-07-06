import { PrayerTimesData, PrayerSettings, Coordinates } from '../types';

export async function fetchAladhanPrayerTimes(
  date: Date,
  coords: Coordinates,
  settings: PrayerSettings
): Promise<PrayerTimesData> {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const dateStr = `${day}-${month}-${year}`;
  
  // School 0 = Shafi/Standard, 1 = Hanafi
  const school = settings.asrMethod === 'hanafi' ? 1 : 0;
  
  // Aladhan calculation methods mapping
  // If the methodId is not supported, the API falls back to 2 (ISNA) or 3 (MWL)
  const method = settings.methodId;
  
  const url = `https://api.aladhan.com/v1/timings/${dateStr}?latitude=${coords.latitude}&longitude=${coords.longitude}&method=${method}&school=${school}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch prayer times from Aladhan API (Status: ${response.status})`);
  }
  
  const result = await response.json();
  if (result.code !== 200 || !result.data || !result.data.timings) {
    throw new Error('Invalid response structure from Aladhan API');
  }
  
  const timings = result.data.timings;
  
  const parseTimeString = (timeStr: string): Date => {
    // Timings are usually in "HH:MM" format (e.g. "05:12" or "18:32 (EEST)")
    const cleanTime = timeStr.split(' ')[0];
    const [hoursStr, minutesStr] = cleanTime.split(':');
    const d = new Date(date);
    d.setHours(parseInt(hoursStr, 10), parseInt(minutesStr, 10), 0, 0);
    return d;
  };
  
  // Extract and adjust
  const times: PrayerTimesData = {
    fajr: parseTimeString(timings.Fajr),
    sunrise: parseTimeString(timings.Sunrise),
    dhuhr: parseTimeString(timings.Dhuhr),
    asr: parseTimeString(timings.Asr),
    maghrib: parseTimeString(timings.Maghrib),
    isha: parseTimeString(timings.Isha)
  };
  
  // Apply manual minute-level adjustments
  const adj = settings.adjustments;
  times.fajr = new Date(times.fajr.getTime() + adj.fajr * 60000);
  times.sunrise = new Date(times.sunrise.getTime() + adj.sunrise * 60000);
  times.dhuhr = new Date(times.dhuhr.getTime() + adj.dhuhr * 60000);
  times.asr = new Date(times.asr.getTime() + adj.asr * 60000);
  times.maghrib = new Date(times.maghrib.getTime() + adj.maghrib * 60000);
  times.isha = new Date(times.isha.getTime() + adj.isha * 60000);
  
  return times;
}
