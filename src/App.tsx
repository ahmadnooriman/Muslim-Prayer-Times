import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PrayerTimesData, PrayerSettings, Coordinates } from './types';
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
import { POPULAR_CITIES, CityInfo } from './utils/cities';
import { Calendar, ShieldCheck, WifiOff, Info, HelpCircle, Sun, Moon, MapPin } from 'lucide-react';

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
  const [apiError, setApiError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [bannerMessage, setBannerMessage] = useState<{ text: string; type: 'success' | 'warning' } | null>(null);
  const [isCityModalOpen, setIsCityModalOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'home' | 'settings' | 'information'>('home');

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
  const handleUpdateSettings = (newSettings: PrayerSettings) => {
    setSettings(newSettings);
    localStorage.setItem('prayer_times_settings', JSON.stringify(newSettings));
  };

  const handleUpdateCoordinates = (newCoords: Coordinates) => {
    setCoordinates(newCoords);
    localStorage.setItem('prayer_times_coords', JSON.stringify(newCoords));
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
    setApiError(null);
    
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
          handleUpdateSettings({
            ...settings,
            methodId: nearestCity.methodId
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
      setApiError(null);
      
      try {
        if (settings.source === 'api') {
          const times = await fetchAladhanPrayerTimes(now, coordinates, settings);
          if (active) setPrayerTimes(times);
        } else if (settings.source === 'kemenag') {
          const times = await fetchKemenagPrayerTimes(now, coordinates, settings);
          if (active) setPrayerTimes(times);
        } else if (settings.source === 'jakim') {
          const times = await fetchJakimPrayerTimes(now, coordinates, settings);
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
          setApiError(`Unable to connect to ${sourceName} online database. Using local precision engine.`);
          // Graceful fallback to offline astronomical calculator
          const localTimes = calculateLocalPrayerTimes(now, coordinates.latitude, coordinates.longitude, settings, coordinates.timezoneOffset);
          setPrayerTimes(localTimes);
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

      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12 space-y-8">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-b border-stone-200/60 dark:border-stone-800/60 pb-8">
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
                className="text-xs bg-stone-100 hover:bg-stone-200 dark:bg-stone-900 dark:hover:bg-stone-800 px-3 py-1.5 rounded-full font-medium text-stone-800 dark:text-stone-200 transition-all duration-200 active:scale-95 flex items-center gap-1.5 cursor-pointer border border-stone-200/40 dark:border-stone-800 shadow-xs"
                title="Click to change city"
              >
                <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>{coordinates.city || 'Custom Coordinates'}, {coordinates.country || 'Custom'}</span>
              </button>
              <span className={`text-xs px-3 py-1 rounded-full font-medium flex items-center gap-1.5 border ${
                (settings.source === 'api' || settings.source === 'kemenag' || settings.source === 'jakim') && !apiError
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/40'
                  : 'bg-stone-100 dark:bg-stone-900 text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-800'
              }`}>
                {(settings.source === 'api' || settings.source === 'kemenag' || settings.source === 'jakim') && !apiError ? (
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
              
              {apiError && (
                <span className="text-[10px] bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-100 dark:border-amber-900/40 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                  <HelpCircle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                  Local Fallback
                </span>
              )}
            </div>
          </div>

          {/* Theme Switcher & Hijri & Gregorian Calendar display */}
          <div className="flex items-center gap-3 self-stretch md:self-auto w-full md:w-auto">
            {/* Quick accessible theme switch for prayer times */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-3.5 bg-white dark:bg-stone-900 border border-stone-200/60 dark:border-stone-800 rounded-2xl shadow-sm hover:border-stone-300 dark:hover:border-stone-700 active:scale-95 transition-all text-stone-600 dark:text-stone-400 flex items-center justify-center shrink-0"
              aria-label="Toggle eye-strain theme mode"
              title={isDarkMode ? "Switch to daylight mode" : "Switch to late-night eye-strain mode"}
            >
              {isDarkMode ? (
                <Sun className="w-5 h-5 text-amber-400 animate-[spin_20s_linear_infinite]" />
              ) : (
                <Moon className="w-5 h-5 text-emerald-700" />
              )}
            </button>

            <div className="flex-1 md:flex-initial flex items-center gap-3.5 p-4 bg-white dark:bg-stone-900 border border-stone-200/60 dark:border-stone-800/80 rounded-2xl shadow-sm justify-between md:justify-start">
              <div className="p-2.5 bg-amber-50/50 dark:bg-amber-950/40 rounded-xl text-amber-800 dark:text-amber-400 border border-amber-100/50 dark:border-amber-900/30">
                <Calendar className="w-5 h-5" />
              </div>
              <div className="text-right sm:text-left">
                <p className="font-serif text-base font-semibold text-stone-800 dark:text-stone-100 leading-tight">
                  {hijriDate.formatted}
                </p>
                <p className="text-xs text-stone-400 dark:text-stone-500 font-mono mt-0.5">
                  {now.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Info notice about current database being used */}
        {apiError && (
          <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 rounded-2xl flex gap-3 text-amber-800 dark:text-amber-300 text-xs">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Offline Precision Fallback:</strong> The online Aladhan database timing is currently unreachable.
              We have automatically initiated the local high-precision astronomical engine so your schedule remains 100% active and accurate.
            </p>
          </div>
        )}

        {/* Navigation Menu */}
        <nav className="flex overflow-x-auto hide-scrollbar space-x-2 p-1.5 bg-stone-100 dark:bg-stone-900 rounded-2xl w-full sm:w-fit border border-stone-200/60 dark:border-stone-800/80">
          <button 
            type="button"
            onClick={() => setActiveTab('home')} 
            className={`flex-1 sm:flex-none px-6 py-2.5 text-sm font-medium rounded-xl transition-all ${activeTab === 'home' ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-white shadow-xs' : 'text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200 hover:bg-stone-200/50 dark:hover:bg-stone-800/50'}`}
          >
            Home
          </button>
          <button 
            type="button"
            onClick={() => setActiveTab('settings')} 
            className={`flex-1 sm:flex-none px-6 py-2.5 text-sm font-medium rounded-xl transition-all ${activeTab === 'settings' ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-white shadow-xs' : 'text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200 hover:bg-stone-200/50 dark:hover:bg-stone-800/50'}`}
          >
            Settings
          </button>
          <button 
            type="button"
            onClick={() => setActiveTab('information')} 
            className={`flex-1 sm:flex-none px-6 py-2.5 text-sm font-medium rounded-xl transition-all ${activeTab === 'information' ? 'bg-white dark:bg-stone-800 text-stone-900 dark:text-white shadow-xs' : 'text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200 hover:bg-stone-200/50 dark:hover:bg-stone-800/50'}`}
          >
            Information
          </button>
        </nav>

        {/* Dashboard Grid Layout */}
        <main className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {activeTab === 'home' && (
            <>
              {/* Main Panel - Left Side (8 cols on lg) */}
              <section className="lg:col-span-8 space-y-8">
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
              </section>

              {/* Secondary Panel - Right Side (4 cols on lg) */}
              <aside className="lg:col-span-4 space-y-8">
                {/* Moon Phase Dynamic Card */}
                <MoonPhaseCard date={now} />
              </aside>
            </>
          )}

          {activeTab === 'settings' && (
            <>
              <section className="lg:col-span-8 space-y-8">
                {/* Core Settings / DB & Location Panel */}
                <SettingsPanel 
                  settings={settings}
                  coordinates={coordinates}
                  gpsSupported={gpsSupported}
                  gpsLoading={gpsLoading}
                  onUpdateSettings={handleUpdateSettings}
                  onUpdateCoordinates={handleUpdateCoordinates}
                  onRequestGPS={handleRequestGPS}
                />
              </section>

              <aside className="lg:col-span-4 space-y-8">
                {prayerTimes && (
                  <PrayerAdjustments 
                    adjustments={settings.adjustments}
                    hijriOffset={settings.hijriOffset}
                    onUpdateAdjustments={(adj) => handleUpdateSettings({ ...settings, adjustments: adj })}
                    onUpdateHijriOffset={(offset) => handleUpdateSettings({ ...settings, hijriOffset: offset })}
                  />
                )}
              </aside>
            </>
          )}

          {activeTab === 'information' && (
            <section className="lg:col-span-8 lg:col-start-3 space-y-8">
              {/* General Information Card */}
              <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-8 shadow-sm space-y-6">
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
            </section>
          )}

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
      />
    </div>
  );
}
