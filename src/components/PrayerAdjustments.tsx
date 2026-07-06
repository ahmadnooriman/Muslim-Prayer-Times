import React from 'react';
import { PrayerAdjustment } from '../types';
import { Minus, Plus, Settings2, CalendarDays } from 'lucide-react';
import { PRAYER_NAMES, PrayerKey } from '../utils/prayerHelpers';

interface PrayerAdjustmentsProps {
  adjustments: PrayerAdjustment;
  hijriOffset: number;
  onUpdateAdjustments: (newAdjustments: PrayerAdjustment) => void;
  onUpdateHijriOffset: (newOffset: number) => void;
}

export const PrayerAdjustments: React.FC<PrayerAdjustmentsProps> = ({
  adjustments,
  hijriOffset,
  onUpdateAdjustments,
  onUpdateHijriOffset
}) => {
  const handleAdjChange = (key: keyof PrayerAdjustment, delta: number) => {
    const currentValue = adjustments[key];
    const newValue = Math.max(-30, Math.min(30, currentValue + delta));
    onUpdateAdjustments({
      ...adjustments,
      [key]: newValue
    });
  };

  const handleHijriChange = (delta: number) => {
    const newValue = Math.max(-3, Math.min(3, hijriOffset + delta));
    onUpdateHijriOffset(newValue);
  };

  const keys: (keyof PrayerAdjustment)[] = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];

  return (
    <div id="prayer-adjustments" className="bg-stone-50 dark:bg-stone-900/40 border border-stone-200 dark:border-stone-800 rounded-3xl p-4 shadow-sm space-y-3">
      <div className="flex items-center justify-between border-b border-stone-200/60 dark:border-stone-800/60 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl text-emerald-800 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40">
            <Settings2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-serif text-lg font-semibold text-stone-800 dark:text-stone-100">Time Adjustments</h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">Fine-tune times to match your local mosque</p>
          </div>
        </div>
      </div>

      {/* Grid of prayer adjustments */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {keys.map((key) => {
          const value = adjustments[key];
          const name = PRAYER_NAMES[key as PrayerKey];
          const isNegative = value < 0;
          const isPositive = value > 0;
          const badgeClass = isPositive 
            ? 'bg-emerald-50 dark:bg-emerald-950/45 text-emerald-800 dark:text-emerald-300 border-emerald-100 dark:border-emerald-900/50' 
            : isNegative 
              ? 'bg-rose-50 dark:bg-rose-950/45 text-rose-800 dark:text-rose-300 border-rose-100 dark:border-rose-900/50' 
              : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-800';

          return (
            <div key={key} className="flex flex-col p-3 bg-white dark:bg-stone-900 border border-stone-200/60 dark:border-stone-800 rounded-2xl hover:border-stone-300 dark:hover:border-stone-700 transition-all shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-stone-700 dark:text-stone-300">{name}</span>
                <span className={`text-[11px] font-mono font-medium px-1.5 py-0.5 rounded-md border ${badgeClass}`}>
                  {value === 0 ? '0' : value > 0 ? `+${value}` : value}m
                </span>
              </div>
              
              <div className="flex items-center gap-1 mt-auto">
                <button
                  type="button"
                  onClick={() => handleAdjChange(key, -1)}
                  className="flex-1 py-1.5 flex items-center justify-center border border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800 rounded-lg active:scale-95 transition-all text-stone-600 dark:text-stone-400"
                  title={`Decrease ${name} adjustment`}
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleAdjChange(key, 1)}
                  className="flex-1 py-1.5 flex items-center justify-center border border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800 rounded-lg active:scale-95 transition-all text-stone-600 dark:text-stone-400"
                  title={`Increase ${name} adjustment`}
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Hijri Calendar Manual Correction */}
      <div className="pt-2 border-t border-stone-200/60 dark:border-stone-800/60">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white dark:bg-stone-900 border border-stone-200/60 dark:border-stone-800 rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-50 dark:bg-amber-950/45 rounded-xl text-amber-800 dark:text-amber-300 border border-amber-100 dark:border-amber-900/50">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-stone-800 dark:text-stone-100">Hijri Correction</h4>
              <p className="text-xs text-stone-500 dark:text-stone-400">Sync calendar with local moon sightings</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleHijriChange(-1)}
              className="p-2 border border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800 rounded-xl active:scale-95 transition-all text-stone-600 dark:text-stone-400"
              title="Subtract day"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="min-w-[4rem] text-center font-mono font-medium text-stone-700 dark:text-stone-300">
              {hijriOffset === 0 ? 'Standard' : hijriOffset > 0 ? `+${hijriOffset} days` : `${hijriOffset} days`}
            </span>
            <button
              type="button"
              onClick={() => handleHijriChange(1)}
              className="p-2 border border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800 rounded-xl active:scale-95 transition-all text-stone-600 dark:text-stone-400"
              title="Add day"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
