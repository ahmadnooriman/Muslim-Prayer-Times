export interface Coordinates {
  latitude: number;
  longitude: number;
  city?: string;
  country?: string;
  source: 'gps' | 'default' | 'search';
  timezoneOffset?: number;
}

export type CalculationSource = 'local' | 'api' | 'kemenag' | 'jakim';

export interface PrayerAdjustment {
  fajr: number;
  sunrise: number;
  dhuhr: number;
  asr: number;
  maghrib: number;
  isha: number;
}

export interface PrayerSettings {
  source: CalculationSource;
  methodId: number; // 1 to 14 etc.
  asrMethod: 'standard' | 'hanafi'; // 1 shadow vs 2 shadows
  highLatRule: 'none' | 'middle-night' | 'one-seventh' | 'angle-based';
  hijriOffset: number; // manual correction in days (-2 to +2)
  adjustments: PrayerAdjustment;
}

export interface PrayerTimesData {
  fajr: Date;
  sunrise: Date;
  dhuhr: Date;
  asr: Date;
  maghrib: Date;
  isha: Date;
}

export interface MoonPhaseData {
  phase: number; // 0 to 1 (0: New Moon, 0.5: Full Moon, 1.0: New Moon again)
  name: string;
  illumination: number; // percentage (0 to 100)
  age: number; // age in days (0 to 29.53)
  stage: 'waxing' | 'waning' | 'new' | 'full';
}

export interface HijriDate {
  day: number;
  monthName: string;
  monthNumber: number;
  year: number;
  formatted: string;
}

export interface CalculationMethod {
  id: number;
  name: string;
  description: string;
  fajrAngle?: number;
  ishaAngle?: number;
  ishaInterval?: number; // minutes after Maghrib (e.g. 90 for Umm Al-Qura)
}
