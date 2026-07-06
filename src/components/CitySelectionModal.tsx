import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Coordinates, PrayerSettings } from '../types';
import { POPULAR_CITIES, CityInfo } from '../utils/cities';
import { Compass, MapPin, Search, X, Globe, Navigation } from 'lucide-react';

interface CitySelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  coordinates: Coordinates;
  gpsSupported: boolean;
  gpsLoading: boolean;
  onUpdateCoordinates: (newCoords: Coordinates) => void;
  onRequestGPS: () => void;
  settings: PrayerSettings;
  onUpdateSettings: (newSettings: PrayerSettings) => void;
}

export const CitySelectionModal: React.FC<CitySelectionModalProps> = ({
  isOpen,
  onClose,
  coordinates,
  gpsSupported,
  gpsLoading,
  onUpdateCoordinates,
  onRequestGPS,
  settings,
  onUpdateSettings,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Reset search when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
    }
  }, [isOpen]);

  // Filter cities by name or country
  const filteredCities = searchQuery.trim() === ''
    ? POPULAR_CITIES // Show all by default so user can browse
    : POPULAR_CITIES.filter(city => 
        city.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        city.country.toLowerCase().includes(searchQuery.toLowerCase())
      );

  const handleCitySelect = (city: CityInfo) => {
    const newCoords: Coordinates = {
      latitude: city.latitude,
      longitude: city.longitude,
      city: city.name,
      country: city.country,
      source: 'search',
      timezoneOffset: city.timezoneOffset
    };
    onUpdateCoordinates(newCoords);
    
    // Also recommend regional calculation method
    onUpdateSettings({ ...settings, methodId: city.methodId });
    onClose();
  };

  const handleUseGPS = () => {
    onRequestGPS();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-stone-900/60 backdrop-blur-xs"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh] z-10"
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl text-emerald-800 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-stone-900 dark:text-stone-50">Select Location</h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400">Choose your city for precise prayer timings</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-full transition-colors"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
              {/* GPS Detection Card */}
              <div className="space-y-2">
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500">
                  Automatic Detection
                </label>
                
                <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100/70 dark:border-emerald-900/40 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-xl text-emerald-800 dark:text-emerald-300 mt-0.5">
                      <Navigation className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-stone-800 dark:text-stone-200">
                        Detect via Device GPS
                      </p>
                      <p className="text-xs text-stone-500 dark:text-stone-400 leading-normal mt-0.5">
                        Fetches active GPS coordinates for offline calculation and database synchronization.
                      </p>
                    </div>
                  </div>

                  {gpsSupported && (
                    <button
                      type="button"
                      disabled={gpsLoading}
                      onClick={handleUseGPS}
                      className={`shrink-0 w-full sm:w-auto px-4 py-2.5 text-xs font-semibold rounded-xl border transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer ${
                        gpsLoading 
                          ? 'bg-stone-100 dark:bg-stone-800 text-stone-400 dark:text-stone-600 border-stone-200 dark:border-stone-850 cursor-not-allowed'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700 shadow-md hover:shadow-lg dark:bg-emerald-700 dark:hover:bg-emerald-600'
                      }`}
                    >
                      <Compass className={`w-3.5 h-3.5 ${gpsLoading ? 'animate-spin' : ''}`} />
                      {gpsLoading ? 'Locating...' : 'Use GPS Location'}
                    </button>
                  )}
                </div>
              </div>

              {/* Current Selection Status */}
              <div className="p-3 bg-stone-50 dark:bg-stone-900/50 border border-stone-200/60 dark:border-stone-800/80 rounded-xl flex items-center justify-between text-xs text-stone-600 dark:text-stone-400">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-amber-500" />
                  <span>
                    Current: <strong>{coordinates.city || 'Custom Coordinates'}</strong> ({coordinates.country})
                  </span>
                </div>
                <span className="font-mono text-[10px] bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded">
                  {coordinates.latitude.toFixed(2)}°, {coordinates.longitude.toFixed(2)}°
                </span>
              </div>

              {/* Manual Selection Search */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label htmlFor="modal-city-search" className="block text-[10px] font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500">
                    Search and Select City
                  </label>
                  <span className="text-[10px] text-stone-400 font-mono">
                    {filteredCities.length} cities available
                  </span>
                </div>

                {/* Search Input */}
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 dark:text-stone-500 w-4 h-4" />
                  <input
                    id="modal-city-search"
                    type="text"
                    placeholder="Search city (e.g. Makkah, London, Jakarta, Cairo)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700 rounded-2xl pl-10 pr-10 py-3 text-sm text-stone-800 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-all shadow-inner"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 rounded-full hover:bg-stone-150 dark:hover:bg-stone-800 transition-all text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Cities List */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[30vh] overflow-y-auto p-1 border border-stone-100 dark:border-stone-800/80 rounded-2xl bg-stone-50/50 dark:bg-stone-950/20 custom-scrollbar">
                  {filteredCities.length > 0 ? (
                    filteredCities.map((city) => {
                      const isCurrent = coordinates.city === city.name;
                      return (
                        <button
                          key={`${city.name}-${city.country}`}
                          type="button"
                          onClick={() => handleCitySelect(city)}
                          className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all active:scale-97 cursor-pointer ${
                            isCurrent
                              ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300 shadow-xs'
                              : 'bg-white dark:bg-stone-900 border-stone-200/60 dark:border-stone-800/80 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-850 hover:border-stone-300 dark:hover:border-stone-750'
                          }`}
                        >
                          <div className={`p-1.5 rounded-lg shrink-0 ${
                            isCurrent
                              ? 'bg-emerald-200/50 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300'
                              : 'bg-stone-100 dark:bg-stone-800 text-stone-400 dark:text-stone-500'
                          }`}>
                            <MapPin className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold truncate leading-tight">
                              {city.name}
                            </p>
                            <p className="text-[10px] text-stone-400 dark:text-stone-500 truncate mt-0.5">
                              {city.country}
                            </p>
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    <div className="col-span-full py-8 text-center text-stone-400 dark:text-stone-500">
                      No cities found matching "{searchQuery}"
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-stone-50 dark:bg-stone-950/40 border-t border-stone-100 dark:border-stone-800 text-center text-[10px] text-stone-400 dark:text-stone-550 leading-relaxed px-6">
              You can also customize coordinates and calculation methods directly using the general Preferences panel.
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
