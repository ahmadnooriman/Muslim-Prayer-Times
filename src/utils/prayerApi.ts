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

export async function fetchJakimPrayerTimes(
  date: Date,
  coords: Coordinates,
  settings: PrayerSettings
): Promise<PrayerTimesData> {
  // We need to fetch zones and find a match for the current city
  const city = coords.city || 'Kuala Lumpur';
  
  // 1. Fetch zones
  const zonesUrl = `https://api.waktusolat.app/zones`;
  const zonesRes = await fetch(zonesUrl);
  if (!zonesRes.ok) {
    throw new Error(`Failed to fetch zones for JAKIM API (Status: ${zonesRes.status})`);
  }
  const zones = await zonesRes.json();
  
  // Try to find a matching zone
  let zoneCode = 'WLY01'; // Default to Kuala Lumpur
  const searchCity = city.toLowerCase();
  
  for (const zone of zones) {
    if (zone.daerah.toLowerCase().includes(searchCity) || zone.negeri.toLowerCase().includes(searchCity)) {
      zoneCode = zone.jakimCode;
      break;
    }
  }
  
  // 2. Fetch prayer times for the zone
  const scheduleUrl = `https://api.waktusolat.app/v2/solat/${zoneCode}`;
  const scheduleRes = await fetch(scheduleUrl);
  if (!scheduleRes.ok) {
    throw new Error(`Failed to fetch schedule from JAKIM API (Status: ${scheduleRes.status})`);
  }
  const scheduleResult = await scheduleRes.json();
  if (!scheduleResult.prayers || scheduleResult.prayers.length === 0) {
    throw new Error(`JAKIM API: Schedule not found for zone ${zoneCode}`);
  }
  
  // Find the prayer times for the requested day
  const day = date.getDate();
  const dayTimings = scheduleResult.prayers.find((p: any) => p.day === day);
  
  if (!dayTimings) {
     throw new Error(`JAKIM API: Schedule not found for day ${day}`);
  }
  
  const parseUnix = (timestamp: number): Date => {
    return new Date(timestamp * 1000);
  };
  
  const times: PrayerTimesData = {
    fajr: parseUnix(dayTimings.fajr),
    sunrise: parseUnix(dayTimings.syuruk),
    dhuhr: parseUnix(dayTimings.dhuhr),
    asr: parseUnix(dayTimings.asr),
    maghrib: parseUnix(dayTimings.maghrib),
    isha: parseUnix(dayTimings.isha)
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

export async function fetchKemenagPrayerTimes(
  date: Date,
  coords: Coordinates,
  settings: PrayerSettings
): Promise<PrayerTimesData> {
  const city = coords.city || 'Jakarta';
  // 1. Search for city ID
  const searchUrl = `https://api.myquran.com/v2/sholat/kota/cari/${encodeURIComponent(city)}`;
  const searchRes = await fetch(searchUrl);
  if (!searchRes.ok) {
    throw new Error(`Failed to search city for Kemenag API (Status: ${searchRes.status})`);
  }
  const searchResult = await searchRes.json();
  if (!searchResult.status || !searchResult.data || searchResult.data.length === 0) {
    throw new Error(`Kemenag API: City not found (${city})`);
  }
  
  const cityId = searchResult.data[0].id;
  
  // 2. Fetch prayer times
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  const scheduleUrl = `https://api.myquran.com/v2/sholat/jadwal/${cityId}/${year}/${month}/${day}`;
  const scheduleRes = await fetch(scheduleUrl);
  if (!scheduleRes.ok) {
    throw new Error(`Failed to fetch schedule from Kemenag API (Status: ${scheduleRes.status})`);
  }
  const scheduleResult = await scheduleRes.json();
  if (!scheduleResult.status || !scheduleResult.data || !scheduleResult.data.jadwal) {
    throw new Error(`Kemenag API: Schedule not found for city ${city}`);
  }
  
  const timings = scheduleResult.data.jadwal;
  
  const parseTimeString = (timeStr: string): Date => {
    const [hoursStr, minutesStr] = timeStr.split(':');
    const d = new Date(date);
    d.setHours(parseInt(hoursStr, 10), parseInt(minutesStr, 10), 0, 0);
    return d;
  };
  
  const times: PrayerTimesData = {
    fajr: parseTimeString(timings.subuh),
    sunrise: parseTimeString(timings.terbit),
    dhuhr: parseTimeString(timings.dzuhur),
    asr: parseTimeString(timings.ashar),
    maghrib: parseTimeString(timings.maghrib),
    isha: parseTimeString(timings.isya)
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
