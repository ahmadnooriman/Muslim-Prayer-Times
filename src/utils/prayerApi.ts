import { PrayerTimesData, PrayerSettings, Coordinates, ApiLog } from '../types';

export async function fetchAladhanPrayerTimes(
  date: Date,
  coords: Coordinates,
  settings: PrayerSettings,
  onLog?: (log: ApiLog) => void
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
  
  const logEntry: ApiLog = {
    timestamp: new Date(),
    source: 'Aladhan',
    url: url
  };

  let response;
  try {
    response = await fetch(url, { signal: AbortSignal.timeout(10000) });
  } catch (error: any) {
    const err = `Network request failed: ${error.message}`;
    logEntry.error = err;
    if (onLog) onLog(logEntry);
    throw new Error(err);
  }
  
  logEntry.status = response.status;
  
  if (!response.ok) {
    const err = `Failed to fetch prayer times from Aladhan API (Status: ${response.status})`;
    logEntry.error = err;
    if (onLog) onLog(logEntry);
    throw new Error(err);
  }
  
  const result = await response.json();
  logEntry.responseBody = result;
  if (onLog) onLog(logEntry);

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
  settings: PrayerSettings,
  onLog?: (log: ApiLog) => void
): Promise<PrayerTimesData> {
  // We need to fetch zones and find a match for the current city
  const city = coords.city || 'Kuala Lumpur';
  
  // 1. Fetch zones
  const zonesUrl = `https://api.waktusolat.app/zones`;
  
  const zonesLog: ApiLog = { timestamp: new Date(), source: 'JAKIM (Zones)', url: zonesUrl };
  
  let zonesRes;
  try {
    zonesRes = await fetch(zonesUrl, { signal: AbortSignal.timeout(10000) });
  } catch (error: any) {
    zonesLog.error = `Network request failed: ${error.message}`;
    if (onLog) onLog(zonesLog);
    throw new Error(zonesLog.error);
  }
  
  zonesLog.status = zonesRes.status;
  if (!zonesRes.ok) {
    zonesLog.error = `Failed to fetch zones for JAKIM API (Status: ${zonesRes.status})`;
    if (onLog) onLog(zonesLog);
    throw new Error(zonesLog.error);
  }
  const zones = await zonesRes.json();
  zonesLog.responseBody = zones;
  
  // Try to find a matching zone
  let zoneCode = ''; // Default to empty
  let searchCity = city.toLowerCase();
  
  if (searchCity.includes('penang')) {
    searchCity = 'pinang';
  }
  
  for (const zone of zones) {
    if (zone.daerah.toLowerCase().includes(searchCity) || zone.negeri.toLowerCase().includes(searchCity)) {
      zoneCode = zone.jakimCode;
      break;
    }
  }
  
  if (!zoneCode) {
    const errStr = `JAKIM API: City not found in zones (${city})`;
    zonesLog.error = errStr;
    if (onLog) onLog(zonesLog);
    throw new Error(errStr);
  }
  
  if (onLog) onLog(zonesLog);
  
  // 2. Fetch prayer times for the zone
  const scheduleUrl = `https://api.waktusolat.app/v2/solat/${zoneCode}`;
  const scheduleLog: ApiLog = { timestamp: new Date(), source: 'JAKIM (Schedule)', url: scheduleUrl };
  
  let scheduleRes;
  try {
    scheduleRes = await fetch(scheduleUrl, { signal: AbortSignal.timeout(10000) });
  } catch (error: any) {
    scheduleLog.error = `Network request failed: ${error.message}`;
    if (onLog) onLog(scheduleLog);
    throw new Error(scheduleLog.error);
  }
  
  scheduleLog.status = scheduleRes.status;
  
  if (!scheduleRes.ok) {
    scheduleLog.error = `Failed to fetch schedule from JAKIM API (Status: ${scheduleRes.status})`;
    if (onLog) onLog(scheduleLog);
    throw new Error(scheduleLog.error);
  }
  const scheduleResult = await scheduleRes.json();
  scheduleLog.responseBody = scheduleResult;
  if (onLog) onLog(scheduleLog);
  
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
  settings: PrayerSettings,
  onLog?: (log: ApiLog) => void
): Promise<PrayerTimesData> {
  const city = coords.city || 'Jakarta';
  // 1. Search for city ID
  const searchUrl = `https://api.myquran.com/v2/sholat/kota/cari/${encodeURIComponent(city)}`;
  
  const searchLog: ApiLog = { timestamp: new Date(), source: 'Kemenag (Search)', url: searchUrl };
  
  let searchRes;
  try {
    searchRes = await fetch(searchUrl, { signal: AbortSignal.timeout(10000) });
  } catch (error: any) {
    searchLog.error = `Network request failed: ${error.message}`;
    if (onLog) onLog(searchLog);
    throw new Error(searchLog.error);
  }
  
  searchLog.status = searchRes.status;
  
  if (!searchRes.ok) {
    searchLog.error = `Failed to search city for Kemenag API (Status: ${searchRes.status})`;
    if (onLog) onLog(searchLog);
    throw new Error(searchLog.error);
  }
  const searchResult = await searchRes.json();
  searchLog.responseBody = searchResult;
  
  if (!searchResult.status || !searchResult.data || searchResult.data.length === 0) {
    const errStr = `Kemenag API: City not found (${city})`;
    searchLog.error = errStr;
    if (onLog) onLog(searchLog);
    throw new Error(errStr);
  }
  
  if (onLog) onLog(searchLog);
  
  const cityId = searchResult.data[0].id;
  
  // 2. Fetch prayer times
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  const scheduleUrl = `https://api.myquran.com/v2/sholat/jadwal/${cityId}/${year}/${month}/${day}`;
  
  const scheduleLog: ApiLog = { timestamp: new Date(), source: 'Kemenag (Schedule)', url: scheduleUrl };
  
  let scheduleRes;
  try {
    scheduleRes = await fetch(scheduleUrl, { signal: AbortSignal.timeout(10000) });
  } catch (error: any) {
    scheduleLog.error = `Network request failed: ${error.message}`;
    if (onLog) onLog(scheduleLog);
    throw new Error(scheduleLog.error);
  }
  
  scheduleLog.status = scheduleRes.status;
  
  if (!scheduleRes.ok) {
    scheduleLog.error = `Failed to fetch schedule from Kemenag API (Status: ${scheduleRes.status})`;
    if (onLog) onLog(scheduleLog);
    throw new Error(scheduleLog.error);
  }
  const scheduleResult = await scheduleRes.json();
  scheduleLog.responseBody = scheduleResult;
  if (onLog) onLog(scheduleLog);
  
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
