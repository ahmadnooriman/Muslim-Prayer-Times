import React from 'react';
import { PrayerTimesData, PrayerAdjustment } from '../types';
import { getActivePrayerState, formatPrayerTime, PRAYER_NAMES, PrayerKey } from '../utils/prayerHelpers';
import { Bell, BellOff } from 'lucide-react';

interface PrayerTimesListProps {
  times: PrayerTimesData;
  adjustments: PrayerAdjustment;
  now: Date;
  notifications: Record<PrayerKey, boolean>;
  toggleNotification: (key: PrayerKey) => void;
}

export const PrayerTimesList: React.FC<PrayerTimesListProps> = ({
  times,
  adjustments,
  now,
  notifications,
  toggleNotification
}) => {
  const { current } = getActivePrayerState(times, now);
  const keys: PrayerKey[] = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];

  return (
    <div id="prayer-times-list" className="space-y-4">
      <div className="flex items-center justify-between px-2">
        <h3 className="font-serif text-lg font-semibold text-stone-800 dark:text-stone-200">Today's Schedule</h3>
        <span className="text-[10px] font-mono uppercase tracking-wider text-stone-500 dark:text-stone-400">
          6 Timings
        </span>
      </div>

      <div className="bg-white dark:bg-stone-900 border border-stone-200/60 dark:border-stone-800/80 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex flex-col divide-y divide-stone-200/60 dark:divide-stone-800/80">
          {keys.map((key) => {
            const name = PRAYER_NAMES[key];
            const time = times[key];
            const isActive = current === key && key !== 'sunrise';
            const adjustment = adjustments[key as keyof PrayerAdjustment] || 0;
            const isNotified = notifications[key];

            return (
              <div 
                key={key} 
                className={`flex items-center px-4 sm:px-6 py-3.5 sm:py-4 transition-colors relative ${
                  isActive 
                    ? 'bg-emerald-50/50 dark:bg-emerald-950/20 shadow-[inset_2px_0_0_0_rgba(16,185,129,0.8)] dark:shadow-[inset_2px_0_0_0_rgba(16,185,129,0.6)]' 
                    : 'hover:bg-stone-50/50 dark:hover:bg-stone-800/30'
                }`}
              >
                {/* Left: Prayer Name */}
                <div className="flex-1 flex items-center gap-2">
                  <span className={`text-sm sm:text-base font-serif font-semibold uppercase tracking-wider ${
                    isActive ? 'text-emerald-800 dark:text-emerald-300' : 'text-stone-700 dark:text-stone-300'
                  }`}>
                    {name}
                  </span>
                  {adjustment !== 0 && key !== 'sunrise' && (
                    <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded-md border ${
                      adjustment > 0 
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-100/50 dark:border-emerald-900/30' 
                        : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-100/50 dark:border-rose-900/30'
                    }`}>
                      {adjustment > 0 ? `+${adjustment}` : adjustment}
                    </span>
                  )}
                </div>
                
                {/* Middle: Notification Button */}
                <div className="flex-1 flex justify-center">
                  <button 
                    onClick={() => toggleNotification(key)}
                    className={`p-2 rounded-full transition-all active:scale-95 ${
                      isNotified 
                        ? 'text-emerald-600 dark:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/30' 
                        : 'text-stone-400 dark:text-stone-600 hover:bg-stone-100 dark:hover:bg-stone-800'
                    }`}
                    aria-label={`Toggle notification for ${name}`}
                  >
                    {isNotified ? <Bell className="w-4 h-4 sm:w-5 sm:h-5" /> : <BellOff className="w-4 h-4 sm:w-5 sm:h-5" />}
                  </button>
                </div>

                {/* Right: Prayer Time */}
                <div className="flex-1 flex justify-end">
                  <span className={`font-mono text-sm sm:text-base font-bold ${
                    isActive ? 'text-emerald-950 dark:text-emerald-100' : 'text-stone-900 dark:text-stone-100'
                  }`}>
                    {formatPrayerTime(time)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
