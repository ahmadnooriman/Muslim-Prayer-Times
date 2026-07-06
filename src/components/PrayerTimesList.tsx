import React from 'react';
import { PrayerTimesData, PrayerAdjustment } from '../types';
import { getActivePrayerState, formatPrayerTime, PRAYER_NAMES, PRAYER_ARABIC_NAMES, PrayerKey } from '../utils/prayerHelpers';
import { Bell, BellOff, Sunrise, Sun, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface PrayerTimesListProps {
  times: PrayerTimesData;
  adjustments: PrayerAdjustment;
  now: Date;
}

export const PrayerTimesList: React.FC<PrayerTimesListProps> = ({
  times,
  adjustments,
  now
}) => {
  const { current } = getActivePrayerState(times, now);

  const keys: PrayerKey[] = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];

  // Map icons for a beautiful visual touch
  const getPrayerIcon = (key: PrayerKey, isActive: boolean) => {
    const sizeClass = "w-5 h-5";
    const colorClass = isActive ? "text-emerald-700" : "text-stone-400";
    
    switch (key) {
      case 'fajr':
        return <Moon className={`${sizeClass} ${colorClass} -rotate-45`} />;
      case 'sunrise':
        return <Sunrise className={`${sizeClass} ${colorClass}`} />;
      case 'dhuhr':
        return <Sun className={`${sizeClass} ${colorClass}`} />;
      case 'asr':
        return <Sun className={`${sizeClass} ${colorClass} opacity-80`} />;
      case 'maghrib':
        return <Sunrise className={`${sizeClass} ${colorClass} rotate-180`} />;
      case 'isha':
        return <Moon className={`${sizeClass} ${colorClass}`} />;
    }
  };

  return (
    <div id="prayer-times-list" className="space-y-3">
      <div className="flex items-center justify-between px-2">
        <h3 className="font-serif text-lg font-semibold text-stone-800 dark:text-stone-200">Today's Schedule</h3>
        <span className="text-[10px] font-mono uppercase tracking-wider text-stone-500 dark:text-stone-400">
          6 Timings Configured
        </span>
      </div>

      <div className="space-y-2.5">
        {keys.map((key) => {
          const name = PRAYER_NAMES[key];
          const arabicName = PRAYER_ARABIC_NAMES[key];
          const time = times[key];
          const isActive = current === key;
          
          // Get offset for this key
          const adjustment = adjustments[key as keyof PrayerAdjustment] || 0;

          return (
            <div
              key={key}
              className={`relative flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 ${
                isActive
                  ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-600/40 dark:border-emerald-500/30 shadow-md shadow-emerald-900/5 ring-1 ring-emerald-600/10'
                  : 'bg-white dark:bg-stone-900 border-stone-200/60 dark:border-stone-800/80 hover:border-stone-300 dark:hover:border-stone-700 shadow-sm'
              }`}
            >
              {/* Highlight bar for active prayer */}
              {isActive && (
                <div className="absolute left-0 top-3 bottom-3 w-1 bg-emerald-600 dark:bg-emerald-500 rounded-r-md" />
              )}

              {/* Left Column: Icon + Name */}
              <div className="flex items-center gap-3.5 z-10">
                <div className={`p-2.5 rounded-xl border transition-all ${
                  isActive 
                    ? 'bg-emerald-100/60 dark:bg-emerald-900/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-400' 
                    : 'bg-stone-50 dark:bg-stone-800/60 border-stone-100 dark:border-stone-800 text-stone-500 dark:text-stone-400'
                }`}>
                  {getPrayerIcon(key, isActive)}
                </div>
                
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`font-serif font-semibold text-base ${isActive ? 'text-emerald-900 dark:text-emerald-300' : 'text-stone-800 dark:text-stone-200'}`}>
                      {name}
                    </span>
                    
                    {/* Adjustment Badge */}
                    {adjustment !== 0 && (
                      <span className={`text-[9px] font-mono px-1 rounded-sm border ${
                        adjustment > 0 
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-100/50 dark:border-emerald-900/30' 
                          : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-100/50 dark:border-rose-900/30'
                      }`}>
                        {adjustment > 0 ? `+${adjustment}` : adjustment}m
                      </span>
                    )}

                    {/* Active Glowing Badge */}
                    {isActive && (
                      <span className="flex items-center gap-1 bg-emerald-100 dark:bg-emerald-950/45 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-850 text-[10px] font-medium px-2 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-500 animate-pulse" />
                        Active
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-stone-400 dark:text-stone-500 font-mono tracking-wide">{arabicName}</span>
                </div>
              </div>

              {/* Right Column: Time */}
              <div className="text-right z-10">
                <span className={`font-mono font-bold text-lg ${isActive ? 'text-emerald-950 dark:text-emerald-200 text-xl' : 'text-stone-800 dark:text-stone-100'}`}>
                  {formatPrayerTime(time)}
                </span>
                <span className="block text-[10px] text-stone-400 dark:text-stone-500 font-mono tracking-tight uppercase">
                  {key === 'sunrise' ? 'End of Fajr' : 'Prayer Time'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Simple embedded fallback Icon component to avoid import issues
const Moon: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  );
};
