import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PrayerTimesData, PrayerSettings, Coordinates, ApiLog } from './types';
import { calculateLocalPrayerTimes } from './utils/prayerCalc';
import { fetchAladhanPrayerTimes, fetchKemenagPrayerTimes, fetchJakimPrayerTimes } from './utils/prayerApi';
import { gregorianToHijri } from './utils/hijri';
import { PrayerKey } from './utils/prayerHelpers';
import { CountdownWidget } from './components/CountdownWidget';
import { PrayerTimesList } from './components/PrayerTimesList';
import { PrayerAdjustments } from './components/PrayerAdjustments';
import { SettingsPanel } from './components/SettingsPanel';
import { MoonPhaseCard } from './components/MoonPhaseCard';
import { CitySelectionModal } from './components/CitySelectionModal';
import { SyncLogsViewer } from './components/SyncLogsViewer';
import { POPULAR_CITIES, CityInfo } from './utils/cities';
import { HijriCalendar } from './components/HijriCalendar';
import { Calendar, ShieldCheck, WifiOff, Info, Sun, Moon, MapPin, Menu, X, Home, Settings as SettingsIcon } from 'lucide-react';

// Default initial state
const DEFAULT_COORDS: Coordinates = {
  latitude: 21.4225,
  longitude: 39.8262,
  city: "Makkah",
  country: "Saudi Arabia",
  source: "default",
  timezoneOffset: 3
};

const DEFAULT_SETTINGS: PrayerSettings = {
  source: 'local',
  methodId: 4, // Umm Al-Qura by default
  asrMethod: 'standard',
  highLatRule: 'none',
  hijriOffset: 0,
  adjustments: {
    fajr: 0,
    sunrise: 0,
    dhuhr: 0,
    asr: 0,
    maghrib: 0,
    isha: 0
  }
};

// Simple offline distance calculation to match custom coordinates to closest major cities
function findNearestCity(lat: number, lng: number): CityInfo | null {
  let minDistance = Infinity;
  let nearest: CityInfo | null = null;
  
  for (const city of POPULAR_CITIES) {
    // Standard Euclidean distance as an approximation for nearby coordinates
    const distance = Math.sqrt(
      Math.pow(city.latitude - lat, 2) + Math.pow(city.longitude - lng, 2)
    );
    if (distance < minDistance) {
      minDistance = distance;
      nearest = city;
    }
  }
  
  // Only match if within 1.5 degrees of coordinate
  return minDistance < 1.5 ? nearest : null;
}

export default function App() {
  const [now, setNow] = useState<Date>(new Date());
  const [coordinates, setCoordinates] = useState<Coordinates>(DEFAULT_COORDS);
  const [settings, setSettings] = useState<PrayerSettings>(DEFAULT_SETTINGS);
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimesData | null>(null);
  
  const [notifications, setNotifications] = useState<Record<PrayerKey, boolean>>({
    fajr: true,
    sunrise: false,
    dhuhr: true,
    asr: true,
    maghrib: true,
    isha: true
  });

  const toggleNotification = (key: PrayerKey) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };
  
  // Theme state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('prayer_times_theme');
    if (saved !== null) {
      return saved === 'dark';
    }
    try {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch (_) {
      return false;
    }
  });

  const toggleTheme = () => {
    setIsDarkMode(prev => {
      const next = !prev;
      localStorage.setItem('prayer_times_theme', next ? 'dark' : 'light');
      return next;
    });
  };

  // Sync dark class on document element to ensure proper theme rendering throughout the app
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);
  
  // UI States
  const [gpsSupported, setGpsSupported] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [bannerMessage, setBannerMessage] = useState<{ text: string; type: 'success' | 'warning' } | null>(null);
  const [isCityModalOpen, setIsCityModalOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'home' | 'calendar' | 'settings' | 'information'>('home');
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [apiLogs, setApiLogs] = useState<ApiLog[]>([]);

  // Time ticker - runs once per second
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Initialize and load persistent settings from localStorage
  useEffect(() => {
    setGpsSupported('geolocation' in navigator);
    
    const storedCoords = localStorage.getItem('prayer_times_coords');
    const storedSettings = localStorage.getItem('prayer_times_settings');
    
    if (storedCoords) {
      try {
        setCoordinates(JSON.parse(storedCoords));
      } catch (e) {
        console.error("Failed to parse coordinates from localStorage");
      }
    }
    
    if (storedSettings) {
      try {
        setSettings(JSON.parse(storedSettings));
      } catch (e) {
        console.error("Failed to parse settings from localStorage");
      }
    }
  }, []);

  // Write adjustments & configurations to local storage on change
  const handleUpdateSettings = (newSettings: PrayerSettings, isFallback = false) => {
    setSettings(newSettings);
    localStorage.setItem('prayer_times_settings', JSON.stringify(newSettings));
    if (!isFallback) {
      setApiLogs([]);
    }
  };

  const handleUpdateCoordinates = (newCoords: Coordinates) => {
    setCoordinates(newCoords);
    localStorage.setItem('prayer_times_coords', JSON.stringify(newCoords));
    setApiLogs([]);
  };

  // Trigger active alert overlay banner
  const triggerAlertBanner = (prayerName: string) => {
    setBannerMessage({
      text: `It is now time for the ${prayerName} prayer.`,
      type: 'success'
    });
    // dismiss automatically after 10 seconds
    setTimeout(() => {
      setBannerMessage(null);
    }, 10000);
  };

  // Browser GPS Navigator
  const handleRequestGPS = () => {
    if (!('geolocation' in navigator)) return;
    setGpsLoading(true);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const nearestCity = findNearestCity(latitude, longitude);
        const deviceTzOffset = -new Date().getTimezoneOffset() / 60;
        
        const newCoords: Coordinates = {
          latitude,
          longitude,
          city: nearestCity ? nearestCity.name : "My Location",
          country: nearestCity ? nearestCity.country : "Device GPS",
          source: 'gps',
          timezoneOffset: deviceTzOffset
        };
        
        handleUpdateCoordinates(newCoords);
        setGpsLoading(false);
        setBannerMessage({
          text: `GPS coordinates retrieved successfully: Nearest city is ${newCoords.city}.`,
          type: 'success'
        });
        setTimeout(() => setBannerMessage(null), 5000);
        
        // If a nearest city matches, optionally pre-select its local regional database
        if (nearestCity) {
          const countryStr = (nearestCity.country || '').toLowerCase();
          const cityStr = (nearestCity.name || '').toLowerCase();
          let newSource: 'api' | 'kemenag' | 'jakim' | 'local' = 'api';
          if (countryStr.includes('indonesia') || cityStr.includes('jakarta')) {
            newSource = 'kemenag';
          } else if (countryStr.includes('malaysia') || cityStr.includes('kuala lumpur')) {
            newSource = 'jakim';
          }

          handleUpdateSettings({
            ...settings,
            methodId: nearestCity.methodId,
            source: newSource
          });
        }
      },
      (error) => {
        setGpsLoading(false);
        let errorMsg = "Failed to access device GPS coordinates.";
        if (error.code === error.PERMISSION_DENIED) {
          errorMsg = "GPS Permission denied. Please select a major city manually or input coordinates.";
        }
        setBannerMessage({
          text: errorMsg,
          type: 'warning'
        });
        setTimeout(() => setBannerMessage(null), 6000);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Re-calculate or fetch prayer times whenever dates, coordinates or settings change
  useEffect(() => {
    let active = true;
    const loadPrayerTimes = async () => {
      setIsRefreshing(true);
      
      const handleApiLog = (log: ApiLog) => {
        if (!active) return;
        setApiLogs(prev => {
          // Clone the log to avoid mutation issues
          const clonedLog = { ...log };
          
          // Remove any previous versions of this exact same request (same URL and approx same time)
          const filtered = prev.filter(l => !(l.url === clonedLog.url && Math.abs(l.timestamp.getTime() - clonedLog.timestamp.getTime()) < 5000));
          
          return [clonedLog, ...filtered].slice(0, 50);
        });
      };
      
      try {
        if (settings.source === 'api') {
          const times = await fetchAladhanPrayerTimes(now, coordinates, settings, handleApiLog);
          if (active) setPrayerTimes(times);
        } else if (settings.source === 'kemenag') {
          const times = await fetchKemenagPrayerTimes(now, coordinates, settings, handleApiLog);
          if (active) setPrayerTimes(times);
        } else if (settings.source === 'jakim') {
          const times = await fetchJakimPrayerTimes(now, coordinates, settings, handleApiLog);
          if (active) setPrayerTimes(times);
        } else {
          // Local direct offline astronomical computation
          const localTimes = calculateLocalPrayerTimes(now, coordinates.latitude, coordinates.longitude, settings, coordinates.timezoneOffset);
          if (active) setPrayerTimes(localTimes);
        }
      } catch (err: any) {
        console.warn(`${settings.source} API failed, falling back to local engine:`, err);
        if (active) {
          const sourceName = settings.source === 'kemenag' ? 'Kemenag' : settings.source === 'jakim' ? 'JAKIM' : 'Aladhan';
          
          let errorText = `Unable to connect to ${sourceName} database. Falling back to offline engine.`;
          if (err.message && err.message.includes('City not found')) {
            errorText = `City not found in ${sourceName} database. Falling back to offline engine. Check API Sync Logs for details.`;
          } else if (err.message && err.message.includes('Schedule not found')) {
            errorText = `Schedule not found in ${sourceName} database for this location. Falling back to offline engine. Check API Sync Logs for details.`;
          } else {
            errorText = `Network error: Unable to connect to ${sourceName}. Check API Sync Logs for details. Falling back to offline engine.`;
          }

          setBannerMessage({
            text: errorText,
            type: 'warning'
          });
          setTimeout(() => setBannerMessage(null), 8000);
          
          // Graceful fallback to offline astronomical calculator
          const localTimes = calculateLocalPrayerTimes(now, coordinates.latitude, coordinates.longitude, settings, coordinates.timezoneOffset);
          setPrayerTimes(localTimes);
          handleUpdateSettings({...settings, source: 'local'}, true);
        }
      }
      if (active) setIsRefreshing(false);
    };

    loadPrayerTimes();
    
    return () => {
      active = false;
    };
  }, [coordinates.latitude, coordinates.longitude, coordinates.timezoneOffset, settings.source, settings.methodId, settings.asrMethod, settings.highLatRule, settings.adjustments, now.toDateString()]);

  // Check if current time is after Maghrib to advance Hijri date
  const isAfterMaghrib = prayerTimes ? now.getTime() >= prayerTimes.maghrib.getTime() : false;
  // Translate Gregorian date to Hijri Calendar Date
  const hijriDate = gregorianToHijri(now, settings.hijriOffset, isAfterMaghrib);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'dark bg-stone-950 text-stone-100' : 'bg-[#FAF9F6] text-stone-800'} font-sans selection:bg-emerald-100 selection:text-emerald-900`}>
      
      {/* Alert Banners / Notifications */}
      <AnimatePresence>
        {bannerMessage && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className={`fixed top-4 left-4 right-4 md:left-1/2 md:right-auto md:w-full md:max-w-md md:-translate-x-1/2 z-50 p-4 rounded-2xl shadow-xl flex items-start gap-3 border ${
              bannerMessage.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/90 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                : 'bg-amber-50 dark:bg-amber-950/90 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300'
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {bannerMessage.type === 'success' ? (
                <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Info className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold leading-relaxed">
                {bannerMessage.type === 'success' ? 'Notification' : 'Alert'}
              </p>
              <p className="text-xs text-stone-600 dark:text-stone-300 mt-0.5 leading-relaxed">{bannerMessage.text}</p>
            </div>
            <button
              type="button"
              onClick={() => setBannerMessage(null)}
              className="text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 text-xs font-semibold px-2"
            >
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 py-4 md:py-6 space-y-4">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border-b border-stone-200/60 dark:border-stone-800/60 pb-4">
          <div className="space-y-2 w-full md:w-auto">
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-stone-900 dark:text-stone-50 tracking-tight flex items-center gap-3">
              Muslim Prayer Times
              {isRefreshing && (
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
              )}
            </h1>
            
            {/* Metadata Badges */}
            <div className="flex flex-wrap items-center gap-2 text-stone-500 dark:text-stone-400">
              <button
                type="button"
                onClick={() => setIsCityModalOpen(true)}
                disabled={isRefreshing || gpsLoading}
                className={`text-xs bg-stone-100 hover:bg-stone-200 dark:bg-stone-900 dark:hover:bg-stone-800 px-3 py-1.5 rounded-full font-medium text-stone-800 dark:text-stone-200 transition-all duration-200 active:scale-95 flex items-center gap-1.5 border border-stone-200/40 dark:border-stone-800 shadow-xs ${isRefreshing || gpsLoading ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                title={isRefreshing || gpsLoading ? "Syncing schedule..." : "Click to change city"}
              >
                <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>{coordinates.city || 'Custom Coordinates'}, {coordinates.country || 'Custom'}</span>
              </button>
              <span className={`text-xs px-3 py-1 rounded-full font-medium flex items-center gap-1.5 border ${
                isRefreshing 
                  ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400 border-amber-100 dark:border-amber-900/40'
                  : (settings.source === 'api' || settings.source === 'kemenag' || settings.source === 'jakim')
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/40'
                  : 'bg-stone-100 dark:bg-stone-900 text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-800'
              }`}>
                {isRefreshing ? (
                  <>
                    <div className="w-3 h-3 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
                    Syncing...
                  </>
                ) : (settings.source === 'api' || settings.source === 'kemenag' || settings.source === 'jakim') ? (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                    Synced with {settings.source === 'kemenag' ? 'Kemenag' : settings.source === 'jakim' ? 'JAKIM' : 'Aladhan'}
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3 h-3 text-stone-400 dark:text-stone-500" />
                    Offline Precision Mode
                  </>
                )}
              </span>
            </div>
          </div>

          {/* Theme Switcher & Hijri & Gregorian Calendar display & Burger Menu */}
          <div className="flex items-center gap-2 sm:gap-3 self-stretch md:self-auto w-full md:w-auto relative">
            {/* Quick accessible theme switch for prayer times */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-3 bg-white dark:bg-stone-900 border border-stone-200/60 dark:border-stone-800 rounded-2xl shadow-sm hover:border-stone-300 dark:hover:border-stone-700 active:scale-95 transition-all text-stone-600 dark:text-stone-400 flex items-center justify-center shrink-0"
              aria-label="Toggle eye-strain theme mode"
              title={isDarkMode ? "Switch to daylight mode" : "Switch to late-night eye-strain mode"}
            >
              {isDarkMode ? (
                <Sun className="w-5 h-5 text-amber-400 animate-[spin_20s_linear_infinite]" />
              ) : (
                <Moon className="w-5 h-5 text-emerald-700" />
              )}
            </button>

            <div className="flex-1 md:flex-initial flex items-center gap-3 p-3 sm:p-4 bg-white dark:bg-stone-900 border border-stone-200/60 dark:border-stone-800/80 rounded-2xl shadow-sm justify-between md:justify-start">
              <div className="p-2 sm:p-2.5 bg-amber-50/50 dark:bg-amber-950/40 rounded-xl text-amber-800 dark:text-amber-400 border border-amber-100/50 dark:border-amber-900/30 shrink-0">
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="text-right sm:text-left min-w-0">
                <p className="font-serif text-sm sm:text-base font-semibold text-stone-800 dark:text-stone-100 leading-tight truncate">
                  {hijriDate.formatted}
                </p>
                <p className="text-[10px] sm:text-xs text-stone-400 dark:text-stone-500 font-mono mt-0.5 truncate">
                  {now.toLocaleDateString([], { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                </p>
              </div>
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-3 bg-white dark:bg-stone-900 border border-stone-200/60 dark:border-stone-800 rounded-2xl shadow-sm hover:border-stone-300 dark:hover:border-stone-700 active:scale-95 transition-all text-stone-600 dark:text-stone-400 flex items-center justify-center shrink-0"
                aria-label="Menu"
              >
                {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>

              <AnimatePresence>
                {isMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-xl z-50 overflow-hidden"
                  >
                    <div className="py-2">
                      <button
                        onClick={() => { setActiveTab('home'); setIsMenuOpen(false); }}
                        className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-3 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 transition-colors"
                      >
                        <Home className="w-4 h-4 text-stone-400" />
                        Home
                      </button>
                      <button
                        onClick={() => { setActiveTab('settings'); setIsMenuOpen(false); }}
                        className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-3 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 transition-colors"
                      >
                        <SettingsIcon className="w-4 h-4 text-stone-400" />
                        Settings
                      </button>
                      <button
                        onClick={() => { setActiveTab('information'); setIsMenuOpen(false); }}
                        className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-3 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 transition-colors"
                      >
                        <Info className="w-4 h-4 text-stone-400" />
                        Information
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Navigation Menu */}
        <nav className="flex overflow-x-auto hide-scrollbar space-x-2 p-1.5 bg-stone-100 dark:bg-stone-900 rounded-2xl w-full sm:w-fit border border-stone-200/60 dark:border-stone-800/80">
          <button 
            type="button"
            onClick={() => setActiveTab('home')} 
            className={`flex-1 sm:flex-none px-6 py-2.5 text-sm font-medium rounded-xl transition-all ${activeTab === 'home' ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-white shadow-xs' : 'text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200 hover:bg-stone-200/50 dark:hover:bg-stone-800/50'}`}
          >
            Salah
          </button>
          <button 
            type="button"
            onClick={() => setActiveTab('calendar')} 
            className={`flex-1 sm:flex-none px-6 py-2.5 text-sm font-medium rounded-xl transition-all ${activeTab === 'calendar' ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-white shadow-xs' : 'text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200 hover:bg-stone-200/50 dark:hover:bg-stone-800/50'}`}
          >
            Calendar
          </button>
        </nav>

        {/* Dashboard Grid Layout */}
        <main className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          
          <section className="lg:col-span-8 space-y-4">
            {activeTab === 'home' && (
              <>
                {prayerTimes ? (
                  <>
                    {/* Countdown Widget */}
                    <CountdownWidget 
                      times={prayerTimes} 
                      now={now} 
                      onAlertTriggered={triggerAlertBanner}
                      notifications={notifications}
                      toggleNotification={toggleNotification}
                    />

                    {/* Prayer Times Schedule List */}
                    <PrayerTimesList 
                      times={prayerTimes} 
                      adjustments={settings.adjustments}
                      now={now}
                      notifications={notifications}
                      toggleNotification={toggleNotification}
                    />
                  </>
                ) : (
                  <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
                    <div className="w-10 h-10 border-4 border-stone-200 dark:border-stone-800 border-t-emerald-600 dark:border-t-emerald-500 rounded-full animate-spin mb-4" />
                    <h3 className="font-serif text-lg font-semibold text-stone-800 dark:text-stone-200">Calculating Prayer Times</h3>
                    <p className="text-sm text-stone-400 dark:text-stone-500 mt-1">Please wait while we determine coordinates and astronomical angles...</p>
                  </div>
                )}
              </>
            )}

            {activeTab === 'calendar' && (
               <HijriCalendar today={now} hijriOffset={settings.hijriOffset} />
            )}

            {activeTab === 'settings' && (
              <SettingsPanel 
                settings={settings}
                coordinates={coordinates}
                gpsSupported={gpsSupported}
                gpsLoading={gpsLoading}
                onUpdateSettings={handleUpdateSettings}
                onUpdateCoordinates={handleUpdateCoordinates}
                onRequestGPS={handleRequestGPS}
                isRefreshing={isRefreshing}
              />
            )}

            {activeTab === 'information' && (
              <>
                {/* General Information Card */}
                <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 shadow-sm space-y-4">
                  <h4 className="font-serif font-bold text-xl text-stone-800 dark:text-stone-100 flex items-center gap-3">
                    <Info className="w-6 h-6 text-emerald-600 dark:text-emerald-500" />
                    Islamic Calculation Guide
                  </h4>
                  <div className="space-y-4">
                    <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
                      Prayer times are computed astronomically using the Sun's altitude angles relative to the horizon. 
                      Slight variations exist between international organizations (databases) due to differing twilight angles:
                    </p>
                    <ul className="text-sm text-stone-600 dark:text-stone-300 space-y-3 list-disc pl-6 leading-normal">
                      <li><strong>Umm Al-Qura:</strong> Official Saudi Arabian standard (Fajr 18.5°, Isha fixed interval).</li>
                      <li><strong>Kemenag:</strong> Kementerian Agama RI, official Indonesian standard (Fajr 20°, Isha 18°).</li>
                      <li><strong>JAKIM:</strong> Jabatan Kemajuan Islam Malaysia, official Malaysian standard (Fajr 20°, Isha 18°).</li>
                      <li><strong>MWL:</strong> Muslim World League standard (Fajr 18°, Isha 17°).</li>
                      <li><strong>ISNA:</strong> North American standard (Fajr 15°, Isha 15°).</li>
                      <li><strong>Karachi:</strong> University of Islamic Sciences standard (Fajr 18°, Isha 18°).</li>
                    </ul>
                    <p className="text-sm text-stone-500 dark:text-stone-400 leading-relaxed italic border-t border-stone-100 dark:border-stone-800/80 pt-4 mt-6">
                      Note: In extreme northern/southern latitudes, twilight can persist all night. Use the "High Latitude Rules" option in Settings to prevent calculation errors.
                    </p>
                  </div>
                </div>
                
                {/* API Sync Logs Card */}
                <SyncLogsViewer logs={apiLogs} />
              </>
            )}
          </section>

          {/* Persistent Right Side */}
          <aside className="lg:col-span-4 space-y-4">
            {/* Moon Phase Dynamic Card (Visible on home and calendar tabs) */}
            {(activeTab === 'home' || activeTab === 'calendar') && (
              <MoonPhaseCard date={now} />
            )}

            {/* Tab-specific sidecards */}
            {activeTab === 'settings' && prayerTimes && (
              <PrayerAdjustments 
                adjustments={settings.adjustments}
                hijriOffset={settings.hijriOffset}
                onUpdateAdjustments={(adj) => handleUpdateSettings({ ...settings, adjustments: adj })}
                onUpdateHijriOffset={(offset) => handleUpdateSettings({ ...settings, hijriOffset: offset })}
              />
            )}
          </aside>
        </main>
      </div>

      <CitySelectionModal
        isOpen={isCityModalOpen}
        onClose={() => setIsCityModalOpen(false)}
        coordinates={coordinates}
        gpsSupported={gpsSupported}
        gpsLoading={gpsLoading}
        onUpdateCoordinates={handleUpdateCoordinates}
        onRequestGPS={handleRequestGPS}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        isRefreshing={isRefreshing}
      />
    </div>
  );
}
