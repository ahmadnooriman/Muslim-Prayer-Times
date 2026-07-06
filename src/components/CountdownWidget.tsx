import React, { useEffect, useState } from 'react';
import { PrayerTimesData } from '../types';
import { getActivePrayerState, getCountdownTime, PRAYER_NAMES, PRAYER_ARABIC_NAMES, PrayerKey } from '../utils/prayerHelpers';
import { Timer, Volume2, VolumeX, Moon } from 'lucide-react';

interface CountdownWidgetProps {
  times: PrayerTimesData;
  now: Date;
  onAlertTriggered?: (prayerName: string) => void;
}

export const CountdownWidget: React.FC<CountdownWidgetProps> = ({
  times,
  now,
  onAlertTriggered
}) => {
  const { current, next, nextTime } = getActivePrayerState(times, now);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [hasNotified, setHasNotified] = useState<string | null>(null);

  const countdown = getCountdownTime(nextTime, now);
  const { hours, minutes, seconds } = countdown;

  // Sound generator using Web Audio API (extremely robust, works 100% offline, zero external files)
  const playAthanNotification = () => {
    if (!audioEnabled) return;
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      // Play a soft spiritual alert chime
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      // Harmonic pleasant tone
      osc.frequency.setValueAtTime(329.63, ctx.currentTime); // E4
      osc.frequency.exponentialRampToValueAtTime(440.00, ctx.currentTime + 0.4); // A4
      
      gain.gain.setValueAtTime(0.01, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.0);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 2.0);
    } catch (e) {
      console.warn("Audio Context block or unsupported", e);
    }
  };

  // Determine previous prayer time to calculate precise relative progress
  const getPrevPrayerTime = (): Date => {
    const { fajr, sunrise, dhuhr, asr, maghrib, isha } = times;
    
    switch (next) {
      case 'sunrise': return fajr;
      case 'dhuhr': return sunrise;
      case 'asr': return dhuhr;
      case 'maghrib': return asr;
      case 'isha': return maghrib;
      case 'fajr': {
        // If current is after Isha (isha to midnight)
        if (now >= isha) {
          return isha;
        } else {
          // If current is before Fajr (midnight to fajr)
          const yesterdayIsha = new Date(isha);
          yesterdayIsha.setDate(yesterdayIsha.getDate() - 1);
          return yesterdayIsha;
        }
      }
      default: return fajr;
    }
  };

  const prevTime = getPrevPrayerTime();
  const totalMs = nextTime.getTime() - prevTime.getTime();
  const elapsedMs = now.getTime() - prevTime.getTime();
  const progressRatio = totalMs > 0 ? elapsedMs / totalMs : 0;
  const progressPercent = Math.max(0, Math.min(100, progressRatio * 100));

  // Handle triggering notification alert when countdown hits zero
  useEffect(() => {
    if (hours === 0 && minutes === 0 && seconds === 0) {
      if (hasNotified !== next) {
        setHasNotified(next);
        playAthanNotification();
        if (onAlertTriggered) {
          onAlertTriggered(PRAYER_NAMES[next]);
        }
      }
    } else {
      // reset notification latch
      if (hasNotified === next) {
        setHasNotified(null);
      }
    }
  }, [hours, minutes, seconds, next, hasNotified]);

  return (
    <div id="countdown-widget" className="bg-gradient-to-br from-stone-800 to-stone-900 border border-stone-800 rounded-3xl p-6 text-stone-100 shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[220px]">
      {/* Decorative ambient visual effects */}
      <div className="absolute -left-12 -top-12 w-32 h-32 rounded-full bg-emerald-500/10 blur-3xl" />
      <div className="absolute right-0 top-0 w-44 h-44 rounded-full bg-amber-500/5 blur-3xl" />

      {/* Header Info */}
      <div className="flex items-center justify-between z-10">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-stone-700/40 border border-stone-700/50 rounded-xl text-amber-500">
            <Timer className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <span className="block text-[10px] font-mono uppercase tracking-widest text-stone-400">Up Next</span>
            <span className="font-serif text-lg font-medium text-stone-50">
              {PRAYER_NAMES[next]} • <span className="font-sans text-stone-400 text-sm font-normal">{PRAYER_ARABIC_NAMES[next]}</span>
            </span>
          </div>
        </div>

        {/* Audio Toggle */}
        <button
          type="button"
          onClick={() => setAudioEnabled(!audioEnabled)}
          className={`p-2 rounded-xl border transition-all active:scale-95 flex items-center gap-1.5 ${
            audioEnabled
              ? 'bg-emerald-800/40 border-emerald-700/50 text-emerald-400'
              : 'bg-stone-700/30 border-stone-700/40 text-stone-400 hover:text-stone-300'
          }`}
          title={audioEnabled ? "Disable entry notification tone" : "Enable entry notification tone"}
        >
          {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          <span className="text-[10px] font-semibold uppercase tracking-wider hidden sm:inline">
            {audioEnabled ? 'Adhan Alert On' : 'Alert Muted'}
          </span>
        </button>
      </div>

      {/* Main Countdown Display */}
      <div className="my-6 text-center z-10">
        <div className="inline-flex items-center gap-2.5 sm:gap-4 justify-center">
          <div className="flex flex-col items-center">
            <span className="text-4xl sm:text-5xl font-mono font-bold text-stone-50 tracking-tight">
              {String(hours).padStart(2, '0')}
            </span>
            <span className="text-[10px] font-mono uppercase text-stone-500 tracking-wider mt-1">Hours</span>
          </div>
          
          <span className="text-3xl sm:text-4xl font-mono text-amber-500/70 font-semibold mb-5">:</span>
          
          <div className="flex flex-col items-center">
            <span className="text-4xl sm:text-5xl font-mono font-bold text-stone-50 tracking-tight">
              {String(minutes).padStart(2, '0')}
            </span>
            <span className="text-[10px] font-mono uppercase text-stone-500 tracking-wider mt-1">Mins</span>
          </div>
          
          <span className="text-3xl sm:text-4xl font-mono text-amber-500/70 font-semibold mb-5">:</span>
          
          <div className="flex flex-col items-center">
            <span className="text-4xl sm:text-5xl font-mono font-bold text-amber-500 tracking-tight">
              {String(seconds).padStart(2, '0')}
            </span>
            <span className="text-[10px] font-mono uppercase text-stone-500 tracking-wider mt-1">Secs</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2 z-10">
        <div className="flex justify-between items-center text-[10px] font-mono text-stone-400 uppercase tracking-wider">
          <span>Last: {PRAYER_NAMES[current]}</span>
          <span className="text-amber-500 font-semibold">{Math.round(progressPercent)}% elapsed</span>
          <span>Next: {PRAYER_NAMES[next]}</span>
        </div>
        <div className="w-full h-2 bg-stone-950 rounded-full overflow-hidden border border-stone-800/50">
          <div 
            className="h-full bg-gradient-to-r from-emerald-600 to-amber-500 transition-all duration-1000 ease-linear rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
};
