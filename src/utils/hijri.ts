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
 * Converts a Gregorian Date to Tabular Hijri date
 * @param date The Gregorian date to convert
 * @param offsetDays Manual adjustment offset (-2 to +2 days)
 */
export function gregorianToHijri(date: Date, offsetDays: number = 0): HijriDate {
  let y = date.getFullYear();
  let m = date.getMonth() + 1;
  let d = date.getDate();
  
  // If month is Jan/Feb, treat as month 13/14 of previous year
  if (m <= 2) {
    y -= 1;
    m += 12;
  }
  
  const a = Math.floor(y / 100);
  const b = 2 - a + Math.floor(a / 4);
  const jd = Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + b - 1524.5;
  
  // Apply manual offset
  const adjustedJd = Math.round(jd) + offsetDays;
  
  // Hijri civil epoch starts Friday, July 16, 622 CE (JD 1948439.5, or 1948440 for civil start)
  const epoch = 1948439.5;
  const daysSinceEpoch = adjustedJd - 1948440;
  
  // Standard tabular 30-year cycle has 10631 days
  // 19 regular years of 354 days, 11 leap years of 355 days
  const cycleCount = Math.floor(daysSinceEpoch / 10631);
  let remainingInCycle = daysSinceEpoch % 10631;
  if (remainingInCycle < 0) {
    remainingInCycle += 10631;
  }
  
  // Leap years in 30-year cycle: 2, 5, 7, 10, 13, 16, 18, 21, 24, 26, 29
  const isLeapYearOfCycle = (yr: number): boolean => {
    const leapYears = [2, 5, 7, 10, 13, 16, 18, 21, 24, 26, 29];
    return leapYears.includes(yr);
  };
  
  let yearInCycle = 0;
  let accumulatedDays = 0;
  
  for (let yr = 1; yr <= 30; yr++) {
    const daysInYr = isLeapYearOfCycle(yr) ? 355 : 354;
    if (remainingInCycle < accumulatedDays + daysInYr) {
      yearInCycle = yr - 1;
      break;
    }
    accumulatedDays += daysInYr;
  }
  
  const hYear = cycleCount * 30 + yearInCycle + 1;
  const daysInYear = remainingInCycle - accumulatedDays;
  
  let hMonth = 0;
  let remainingDays = daysInYear;
  
  for (let mIdx = 1; mIdx <= 12; mIdx++) {
    let daysInM = (mIdx % 2 === 1) ? 30 : 29;
    // Dhu al-Hijjah in a leap year has 30 days
    if (mIdx === 12 && isLeapYearOfCycle(yearInCycle + 1)) {
      daysInM = 30;
    }
    
    if (remainingDays < daysInM) {
      hMonth = mIdx;
      break;
    }
    remainingDays -= daysInM;
  }
  
  if (hMonth === 0) {
    hMonth = 12;
  }
  
  const hDay = Math.max(1, Math.floor(remainingDays) + 1);
  const monthName = HIJRI_MONTHS[hMonth - 1];
  
  return {
    day: hDay,
    monthName,
    monthNumber: hMonth,
    year: hYear,
    formatted: `${hDay} ${monthName} ${hYear} AH`
  };
}
