import { MoonPhaseData } from '../types';

function getJulianDate(date: Date): number {
  // Convert standard time to UTC milliseconds, divide by ms per day, add Julian constant
  return (date.getTime() / 86400000) + 2440587.5;
}

export function calculateMoonPhase(date: Date): MoonPhaseData {
  const JD = getJulianDate(date);
  
  // Known New Moon: 2000-01-06 18:14:00 UTC (Julian Date 2451550.26)
  const knownNewMoon = 2451550.26;
  const synodicPeriod = 29.530588853;
  
  const daysSinceNewMoon = JD - knownNewMoon;
  let phaseFraction = (daysSinceNewMoon / synodicPeriod) % 1;
  if (phaseFraction < 0) {
    phaseFraction += 1;
  }
  
  const age = phaseFraction * synodicPeriod;
  
  // Illumination calculation using cosine of the phase angle
  const illumination = Math.round((1 - Math.cos(2 * Math.PI * phaseFraction)) / 2 * 100);
  
  let name = '';
  let stage: 'waxing' | 'waning' | 'new' | 'full' = 'new';
  
  const p = phaseFraction;
  
  if (p < 0.02 || p >= 0.98) {
    name = 'New Moon';
    stage = 'new';
  } else if (p >= 0.02 && p < 0.23) {
    name = 'Waxing Crescent';
    stage = 'waxing';
  } else if (p >= 0.23 && p < 0.27) {
    name = 'First Quarter';
    stage = 'waxing';
  } else if (p >= 0.27 && p < 0.46) {
    name = 'Waxing Gibbous';
    stage = 'waxing';
  } else if (p >= 0.46 && p <= 0.54) {
    name = 'Full Moon';
    stage = 'full';
  } else if (p > 0.54 && p < 0.73) {
    name = 'Waning Gibbous';
    stage = 'waning';
  } else if (p >= 0.73 && p < 0.77) {
    name = 'Third Quarter';
    stage = 'waning';
  } else {
    name = 'Waning Crescent';
    stage = 'waning';
  }
  
  return {
    phase: phaseFraction,
    name,
    illumination,
    age: Math.round(age * 10) / 10,
    stage
  };
}
