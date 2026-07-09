import { PrayerTimesData, PrayerSettings, CalculationMethod } from '../types';

const d2r = (d: number) => (d * Math.PI) / 180;
const r2d = (r: number) => (r * 180) / Math.PI;

function fixHour(h: number): number {
  h = h - 24.0 * Math.floor(h / 24.0);
  return h < 0 ? h + 24.0 : h;
}

function fixAngle(a: number): number {
  a = a - 360.0 * Math.floor(a / 360.0);
  return a < 0 ? a + 360.0 : a;
}

// Julian Date conversion
function getJulianDate(date: Date): number {
  return (date.getTime() / 86400000) + 2440587.5;
}

export const CALCULATION_METHODS: CalculationMethod[] = [
  { id: 1, name: "University of Islamic Sciences, Karachi", description: "Fajr 18°, Isha 18° (Pakistan, India, Bangladesh)", fajrAngle: 18, ishaAngle: 18 },
  { id: 2, name: "Islamic Society of North America (ISNA)", description: "Fajr 15°, Isha 15° (USA, Canada, parts of Europe)", fajrAngle: 15, ishaAngle: 15 },
  { id: 3, name: "Muslim World League (MWL)", description: "Fajr 18°, Isha 17° (Europe, Far East, parts of US)", fajrAngle: 18, ishaAngle: 17 },
  { id: 4, name: "Umm Al-Qura University, Makkah", description: "Fajr 18.5°, Isha 90 min after Maghrib (Arabian Peninsula)", fajrAngle: 18.5, ishaInterval: 90 },
  { id: 5, name: "Egyptian General Authority of Survey", description: "Fajr 19.5°, Isha 17.5° (Egypt, Sudan, Levant)", fajrAngle: 19.5, ishaAngle: 17.5 },
  { id: 7, name: "Institute of Geophysics, University of Tehran", description: "Fajr 17.7°, Isha 14°, Maghrib 4.5° (Shia calculation)", fajrAngle: 17.7, ishaAngle: 14 },
  { id: 8, name: "Gulf Region", description: "Fajr 19.5°, Isha 90 min after Maghrib", fajrAngle: 19.5, ishaInterval: 90 },
  { id: 9, name: "Kuwait", description: "Fajr 18°, Isha 17.5°", fajrAngle: 18, ishaAngle: 17.5 },
  { id: 10, name: "Qatar", description: "Fajr 18°, Isha 90 min after Maghrib", fajrAngle: 18, ishaInterval: 90 },
  { id: 11, name: "Majlis Ugama Islam Singapura (MUIS)", description: "Fajr 20°, Isha 18° (Singapore, Malaysia, Brunei)", fajrAngle: 20, ishaAngle: 18 },
  { id: 12, name: "Union des Organisations Islamiques de France (UOIF)", description: "Fajr 12°, Isha 12° (France, parts of Europe)", fajrAngle: 12, ishaAngle: 12 },
  { id: 13, name: "Diyanet İşleri Başkanlığı", description: "Fajr 18°, Isha 17° (Turkey)", fajrAngle: 18, ishaAngle: 17 },
  { id: 14, name: "Spiritual Administration of Muslims of Russia", description: "Fajr 16°, Isha 15° (Russia)", fajrAngle: 16, ishaAngle: 15 },
  { id: 15, name: "Kementerian Agama RI (Indonesia)", description: "Fajr 20°, Isha 18° (Kemenag Indonesia standard)", fajrAngle: 20, ishaAngle: 18 },
  { id: 16, name: "Jabatan Kemajuan Islam Malaysia (JAKIM)", description: "Fajr 20°, Isha 18° (JAKIM Malaysia standard)", fajrAngle: 20, ishaAngle: 18 }
];

interface SunPosition {
  declination: number; // in radians
  equationOfTime: number; // in hours
}

function getSunPosition(jd: number): SunPosition {
  const d = jd - 2451545.0;
  const g = fixAngle(357.529 + 0.98560028 * d);
  const q = fixAngle(280.459 + 0.98564736 * d);
  const L = fixAngle(q + 1.915 * Math.sin(d2r(g)) + 0.020 * Math.sin(d2r(2 * g)));
  const e = 23.439 - 0.00000036 * d;
  
  const declination = Math.asin(Math.sin(d2r(e)) * Math.sin(d2r(L)));
  
  let RA = r2d(Math.atan2(Math.cos(d2r(e)) * Math.sin(d2r(L)), Math.cos(d2r(L)))) / 15;
  RA = fixHour(RA);
  
  let equationOfTime = q / 15 - RA;
  if (equationOfTime > 12) {
    equationOfTime -= 24;
  } else if (equationOfTime < -12) {
    equationOfTime += 24;
  }
  return { declination, equationOfTime };
}

function getHourAngle(alpha: number, latitude: number, declination: number): number | null {
  const numerator = Math.sin(alpha) - Math.sin(latitude) * Math.sin(declination);
  const denominator = Math.cos(latitude) * Math.cos(declination);
  const cosH = numerator / denominator;
  if (cosH > 1 || cosH < -1) {
    return null;
  }
  return Math.acos(cosH);
}

function decimalToDate(decimalHour: number, baseDate: Date): Date {
  const date = new Date(baseDate);
  const hours = Math.floor(decimalHour);
  const minutesDecimal = (decimalHour - hours) * 60;
  const minutes = Math.floor(minutesDecimal);
  const seconds = Math.floor((minutesDecimal - minutes) * 60);
  
  date.setHours(hours, minutes, seconds, 0);
  return date;
}

export function calculateLocalPrayerTimes(
  date: Date,
  latitude: number,
  longitude: number,
  settings: PrayerSettings,
  timezoneOffset?: number
): PrayerTimesData {
  // Get calculation method specs
  const method = CALCULATION_METHODS.find(m => m.id === settings.methodId) || CALCULATION_METHODS[2]; // fallback to ISNA (3) or MWL
  
  // Get timezone offset in hours (use provided offset, or fallback to browser's offset)
  const tzOffset = timezoneOffset !== undefined ? timezoneOffset : -date.getTimezoneOffset() / 60;
  
  // Julian Date at midnight UTC for this local day of the target location
  // We construct the local noon of the target location in UTC (which is 12 - tzOffset hours UTC)
  const utcNoon = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 12));
  const jd = getJulianDate(utcNoon) - tzOffset / 24;
  
  const sun = getSunPosition(jd);
  const latRad = d2r(latitude);
  
  // Midday / Solar Noon / Transit (Dhuhr base)
  // Standard transit formula: Transit = 12 + TZ - Longitude/15 - EoT
  let dhuhrHour = 12 + tzOffset - longitude / 15 - sun.equationOfTime;
  dhuhrHour = fixHour(dhuhrHour);
  
  // Sunrise & Sunset (horizon altitude is -0.8333 degrees)
  const sunriseSunsetAlpha = d2r(-0.8333);
  const sunriseSunsetHA = getHourAngle(sunriseSunsetAlpha, latRad, sun.declination);
  
  let sunriseHour = 0;
  let sunsetHour = 0;
  
  if (sunriseSunsetHA !== null) {
    sunriseHour = fixHour(dhuhrHour - r2d(sunriseSunsetHA) / 15);
    sunsetHour = fixHour(dhuhrHour + r2d(sunriseSunsetHA) / 15);
  } else {
    // Polar regions fallback
    if (latitude > 0) {
      // Midnight sun or polar night
      sunriseHour = dhuhrHour - 6;
      sunsetHour = dhuhrHour + 6;
    } else {
      sunriseHour = dhuhrHour - 6;
      sunsetHour = dhuhrHour + 6;
    }
  }
  
  // Asr
  // Shadow factor: Shafi'i (1), Hanafi (2)
  const shadowFactor = settings.asrMethod === 'hanafi' ? 2 : 1;
  const shadowNoon = Math.tan(Math.abs(latRad - sun.declination));
  const asrAlpha = Math.atan(1 / (shadowFactor + shadowNoon));
  const asrHA = getHourAngle(asrAlpha, latRad, sun.declination);
  let asrHour = 0;
  if (asrHA !== null) {
    asrHour = fixHour(dhuhrHour + r2d(asrHA) / 15);
  } else {
    asrHour = dhuhrHour + 3; // basic fallback
  }
  
  // Fajr & Isha Hour Angles
  const fajrAngle = method.fajrAngle || 15;
  const fajrAlpha = d2r(-fajrAngle);
  let fajrHA = getHourAngle(fajrAlpha, latRad, sun.declination);
  
  let ishaHA: number | null = null;
  let ishaHour = 0;
  
  if (method.ishaAngle) {
    const ishaAlpha = d2r(-method.ishaAngle);
    ishaHA = getHourAngle(ishaAlpha, latRad, sun.declination);
  }
  
  // Apply extreme latitude rules if Fajr or Isha calculation is impossible or requested
  const nightDuration = sunsetHour < sunriseHour ? (24 - sunriseHour + sunsetHour) : (sunsetHour - sunriseHour);
  
  let fajrHour = 0;
  
  // Standard Fajr computation
  if (fajrHA !== null && settings.highLatRule === 'none') {
    fajrHour = fixHour(dhuhrHour - r2d(fajrHA) / 15);
  } else {
    // Extreme latitude or rule applied
    const fraction = fajrAngle / 60; // Approximate ratio
    let portion = nightDuration * (1 / 7); // Default one-seventh
    
    if (settings.highLatRule === 'middle-night') {
      portion = nightDuration / 2;
    } else if (settings.highLatRule === 'angle-based') {
      portion = nightDuration * fraction;
    }
    fajrHour = fixHour(sunriseHour - portion);
  }
  
  // Standard Isha computation
  if (method.ishaInterval) {
    // Umm Al-Qura or similar interval-based
    let interval = method.ishaInterval;
    // Umm Al-Qura adds 30 extra minutes during Ramadan
    // Simple check: convert to Hijri, check if Ramadan (month 9)
    // We can do a lightweight check
    ishaHour = fixHour(sunsetHour + interval / 60);
  } else if (ishaHA !== null && settings.highLatRule === 'none') {
    ishaHour = fixHour(dhuhrHour + r2d(ishaHA) / 15);
  } else {
    // Extreme latitude or rule applied
    const ishaAngle = method.ishaAngle || 15;
    const fraction = ishaAngle / 60;
    let portion = nightDuration * (1 / 7); // Default one-seventh
    
    if (settings.highLatRule === 'middle-night') {
      portion = nightDuration / 2;
    } else if (settings.highLatRule === 'angle-based') {
      portion = nightDuration * fraction;
    }
    ishaHour = fixHour(sunsetHour + portion);
  }
  
  // Maghrib calculation (for Shia, Maghrib is slightly later)
  let maghribHour = sunsetHour;
  if (method.id === 7) {
    // Tehran Shia calculation - Maghrib angle is usually 4.5
    const maghribAlpha = d2r(-4.5);
    const maghribHA = getHourAngle(maghribAlpha, latRad, sun.declination);
    if (maghribHA !== null) {
      maghribHour = fixHour(dhuhrHour + r2d(maghribHA) / 15);
    }
  }
  
  // Create Date objects representing the prayer times
  const times: PrayerTimesData = {
    fajr: decimalToDate(fajrHour, date),
    sunrise: decimalToDate(sunriseHour, date),
    dhuhr: decimalToDate(dhuhrHour, date),
    asr: decimalToDate(asrHour, date),
    maghrib: decimalToDate(maghribHour, date),
    isha: decimalToDate(ishaHour, date)
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
