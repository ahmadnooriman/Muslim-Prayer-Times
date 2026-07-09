import React, { useState, useMemo, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Info, Star, ChevronDown, ChevronUp } from 'lucide-react';
import { gregorianToHijri, HIJRI_MONTHS } from '../utils/hijri';
import { getIslamicEvents, IslamicEvent } from '../utils/islamicEvents';
import { HijriDate } from '../types';

interface HijriCalendarProps {
  today: Date;
  hijriOffset: number;
}

const WEEKDAYS = ['Ahad', 'Ithnayn', 'Thulatha', "Arba'a", 'Khamis', "Jumu'ah", 'Sabt'];

export const HijriCalendar: React.FC<HijriCalendarProps> = ({ today, hijriOffset }) => {
  const currentHijri = gregorianToHijri(today, hijriOffset);
  
  const [displayedMonth, setDisplayedMonth] = useState(currentHijri.monthNumber);
  const [displayedYear, setDisplayedYear] = useState(currentHijri.year);
  const [isEventsExpanded, setIsEventsExpanded] = useState(false);

  const goToToday = () => {
    setDisplayedMonth(currentHijri.monthNumber);
    setDisplayedYear(currentHijri.year);
  };

  const nextMonth = () => {
    if (displayedMonth === 12) {
      setDisplayedMonth(1);
      setDisplayedYear(y => y + 1);
    } else {
      setDisplayedMonth(m => m + 1);
    }
  };

  const prevMonth = () => {
    if (displayedMonth === 1) {
      setDisplayedMonth(12);
      setDisplayedYear(y => y - 1);
    } else {
      setDisplayedMonth(m => m - 1);
    }
  };

  const monthData = useMemo(() => {
    // Find the 1st Gregorian day of the displayed Hijri month
    let curr = new Date(today);
    curr.setHours(12, 0, 0, 0);
    
    // Jump towards target month
    let safety = 1000;
    while (safety-- > 0) {
      const h = gregorianToHijri(curr, hijriOffset);
      if (h.year === displayedYear && h.monthNumber === displayedMonth) break;
      if (h.year < displayedYear || (h.year === displayedYear && h.monthNumber < displayedMonth)) {
        curr.setDate(curr.getDate() + 15);
      } else {
        curr.setDate(curr.getDate() - 15);
      }
    }
    
    // Find exact 1st day
    safety = 40;
    while (safety-- > 0) {
      const prev = new Date(curr);
      prev.setDate(prev.getDate() - 1);
      const hPrev = gregorianToHijri(prev, hijriOffset);
      if (hPrev.monthNumber !== displayedMonth || hPrev.year !== displayedYear) {
        break; // curr is 1st day
      }
      curr = prev;
    }

    const startDate = curr;
    const startDayOfWeek = startDate.getDay(); // 0 = Sunday
    
    // Generate days for this month
    const days = [];
    let currentGregorian = new Date(startDate);
    safety = 40;
    while (safety-- > 0) {
      const h = gregorianToHijri(currentGregorian, hijriOffset);
      if (h.monthNumber !== displayedMonth || h.year !== displayedYear) {
        break;
      }
      const dayOfWeek = currentGregorian.getDay();
      const events = getIslamicEvents(h.day, h.monthNumber, dayOfWeek);
      days.push({
        hijri: h,
        gregorian: new Date(currentGregorian),
        events,
        dayOfWeek
      });
      currentGregorian.setDate(currentGregorian.getDate() + 1);
    }
    
    return { startDate, startDayOfWeek, days };
  }, [displayedMonth, displayedYear, today, hijriOffset]);

  const isCurrentMonth = displayedMonth === currentHijri.monthNumber && displayedYear === currentHijri.year;

  return (
    <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-serif font-bold text-stone-900 dark:text-stone-50 flex items-center gap-3">
            <CalendarIcon className="w-6 h-6 text-emerald-600 dark:text-emerald-500" />
            {HIJRI_MONTHS[displayedMonth - 1]} {displayedYear} AH
          </h2>
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">
            {monthData.startDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })} - {monthData.days[monthData.days.length - 1].gregorian.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {!isCurrentMonth && (
            <button 
              onClick={goToToday}
              className="text-xs px-3 py-1.5 rounded-full font-medium border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-800/40 transition-colors"
            >
              Today
            </button>
          )}
          <div className="flex items-center bg-stone-100 dark:bg-stone-800 rounded-xl p-1">
            <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {WEEKDAYS.map(day => (
          <div key={day} className="text-center py-2 text-[10px] sm:text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
            <span className="hidden sm:inline">{day}</span>
            <span className="sm:hidden">{day.slice(0, 3)}</span>
          </div>
        ))}
        
        {Array.from({ length: monthData.startDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square rounded-xl bg-stone-50/50 dark:bg-stone-900/30 border border-stone-100/50 dark:border-stone-800/30" />
        ))}
        
        {monthData.days.map((dayData, i) => {
          const isToday = dayData.hijri.day === currentHijri.day && dayData.hijri.monthNumber === currentHijri.monthNumber && dayData.hijri.year === currentHijri.year;
          const hasHoliday = dayData.events.some(e => e.type === 'holiday');
          const hasFast = dayData.events.some(e => e.type === 'fast');
          
          return (
            <div 
              key={dayData.hijri.day} 
              className={`aspect-square rounded-xl p-1 sm:p-2 border flex flex-col items-center justify-center relative transition-all ${
                isToday 
                  ? 'bg-emerald-600 text-white border-emerald-700 shadow-md transform scale-105 z-10' 
                  : hasHoliday 
                  ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/50 text-amber-900 dark:text-amber-100'
                  : hasFast
                  ? 'bg-sky-50 dark:bg-sky-900/20 border-sky-200 dark:border-sky-800/50 text-sky-900 dark:text-sky-100'
                  : 'bg-stone-50 dark:bg-stone-800/50 border-stone-200 dark:border-stone-700/50 text-stone-800 dark:text-stone-200 hover:border-emerald-300 dark:hover:border-emerald-700/50'
              }`}
            >
              <span className={`text-sm sm:text-lg font-serif font-bold ${isToday ? 'text-white' : ''}`}>
                {dayData.hijri.day}
              </span>
              <span className={`text-[8px] sm:text-[10px] mt-0.5 sm:mt-1 font-mono ${isToday ? 'text-emerald-100' : 'text-stone-400 dark:text-stone-500'}`}>
                {dayData.gregorian.getDate()}
              </span>
              
              {dayData.events.length > 0 && (
                <div className="absolute top-1 right-1 flex gap-0.5">
                  {hasHoliday && <Star className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${isToday ? 'text-emerald-200' : 'text-amber-500'}`} fill="currentColor" />}
                  {hasFast && !hasHoliday && <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${isToday ? 'bg-emerald-200' : 'bg-sky-400'}`} />}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend / Events List */}
      <div className="mt-6 border-t border-stone-200 dark:border-stone-800 pt-6">
        <button 
          onClick={() => setIsEventsExpanded(!isEventsExpanded)}
          className="w-full flex items-center justify-between text-sm font-semibold text-stone-800 dark:text-stone-200 mb-4 hover:opacity-80 transition-opacity"
        >
          <span className="flex items-center gap-2">
            <Info className="w-4 h-4 text-emerald-600" /> Key Events this Month
          </span>
          {isEventsExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        
        {isEventsExpanded && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {monthData.days.filter(d => d.events.length > 0).map(d => (
              <div key={d.hijri.day} className="flex items-start gap-3 p-3 rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-stone-100 dark:border-stone-800 text-sm">
                <div className="w-10 text-center shrink-0">
                  <span className="block font-bold text-stone-900 dark:text-stone-100">{d.hijri.day}</span>
                </div>
                <div className="flex-1 space-y-1">
                  {d.events.map((e, idx) => (
                    <p key={idx} className={`font-medium ${e.type === 'holiday' ? 'text-amber-700 dark:text-amber-400' : 'text-sky-700 dark:text-sky-400'}`}>
                      {e.name}
                    </p>
                  ))}
                </div>
              </div>
            ))}
            {monthData.days.filter(d => d.events.length > 0).length === 0 && (
               <p className="text-sm text-stone-500 dark:text-stone-400 italic">No major holidays or sunnah fasts tracked this month.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
