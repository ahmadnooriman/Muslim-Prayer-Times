import React, { useState } from 'react';
import { PrayerSettings, Coordinates, CalculationSource } from '../types';
import { CALCULATION_METHODS } from '../utils/prayerCalc';
import { POPULAR_CITIES } from '../utils/cities';
import { Compass, MapPin, Globe, Database, HelpCircle } from 'lucide-react';

interface SettingsPanelProps {
  settings: PrayerSettings;
  coordinates: Coordinates;
  gpsSupported: boolean;
  gpsLoading: boolean;
  onUpdateSettings: (newSettings: PrayerSettings) => void;
  onUpdateCoordinates: (newCoords: Coordinates) => void;
  onRequestGPS: () => void;
  isRefreshing?: boolean;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  settings,
  coordinates,
  gpsSupported,
  gpsLoading,
  onUpdateSettings,
  onUpdateCoordinates,
  onRequestGPS,
  isRefreshing
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showManualForm, setShowManualForm] = useState(false);

  const handleSourceChange = (source: CalculationSource) => {
    onUpdateSettings({ ...settings, source });
  };

  const handleMethodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onUpdateSettings({ ...settings, methodId: parseInt(e.target.value, 10) });
  };

  const handleAsrChange = (asrMethod: 'standard' | 'hanafi') => {
    onUpdateSettings({ ...settings, asrMethod });
  };

  const handleHighLatChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onUpdateSettings({ 
      ...settings, 
      highLatRule: e.target.value as 'none' | 'middle-night' | 'one-seventh' | 'angle-based' 
    });
  };

  const handleCitySelect = (cityName: string) => {
    const selected = POPULAR_CITIES.find(c => c.name === cityName);
    if (selected) {
      const newCoords: Coordinates = {
        latitude: selected.latitude,
        longitude: selected.longitude,
        city: selected.name,
        country: selected.country,
        source: 'search',
        timezoneOffset: selected.timezoneOffset
      };
      onUpdateCoordinates(newCoords);
      
      const countryStr = (selected.country || '').toLowerCase();
      const cityStr = (selected.name || '').toLowerCase();
      
      let newSource: 'api' | 'kemenag' | 'jakim' | 'local' = 'api';
      if (countryStr.includes('indonesia') || cityStr.includes('jakarta')) {
        newSource = 'kemenag';
      } else if (countryStr.includes('malaysia') || cityStr.includes('kuala lumpur')) {
        newSource = 'jakim';
      }

      // Update recommended calculation method for that city
      onUpdateSettings({ ...settings, methodId: selected.methodId, source: newSource });
    }
  };

  const filteredCities = searchQuery.trim() === ''
    ? []
    : POPULAR_CITIES.filter(city => 
        city.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        city.country.toLowerCase().includes(searchQuery.toLowerCase())
      );

  return (
    <div id="settings-panel" className="bg-stone-50 dark:bg-stone-900/40 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 shadow-sm space-y-6">
      <div className="flex items-center justify-between border-b border-stone-200/60 dark:border-stone-800/60 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl text-emerald-800 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-serif text-lg font-semibold text-stone-800 dark:text-stone-100">Preferences</h3>
            <p className="text-xs text-stone-500 dark:text-stone-400">Configure coordinates, databases, and calculation rules</p>
          </div>
        </div>
      </div>

      {/* Location Settings (MOVED TO TOP) */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
            Geographic Location (Device GPS)
          </label>
          <span className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded-full border ${
            coordinates.source === 'gps'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-100 dark:border-emerald-900/50'
              : 'bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 border-amber-100 dark:border-amber-900/50'
          }`}>
            {coordinates.source === 'gps' ? 'Live GPS Location' : 'Static Coordinates'}
          </span>
        </div>

        {/* Current Location Quick Info */}
        <div className="flex items-center justify-between p-3.5 bg-white dark:bg-stone-900 border border-stone-200/60 dark:border-stone-800/80 rounded-2xl shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-stone-100 dark:bg-stone-800 rounded-xl text-stone-600 dark:text-stone-400">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-stone-800 dark:text-stone-100">
                {coordinates.city || 'Custom Coordinates'}, {coordinates.country || 'Custom'}
              </p>
              <p className="text-[11px] font-mono text-stone-500 dark:text-stone-400">
                Lat: {coordinates.latitude.toFixed(4)}° | Long: {coordinates.longitude.toFixed(4)}°
              </p>
            </div>
          </div>

          {gpsSupported && (
            <button
              type="button"
              disabled={gpsLoading || isRefreshing}
              onClick={onRequestGPS}
              className={`px-3 py-1.5 text-xs font-medium rounded-xl border transition-all flex items-center gap-1.5 active:scale-95 ${
                gpsLoading || isRefreshing
                  ? 'bg-stone-100 dark:bg-stone-800 text-stone-400 dark:text-stone-600 border-stone-200 dark:border-stone-800 cursor-not-allowed opacity-60'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/30'
              }`}
            >
              <Compass className={`w-3.5 h-3.5 ${gpsLoading ? 'animate-spin' : ''}`} />
              {gpsLoading ? 'Locating...' : 'Get GPS'}
            </button>
          )}
        </div>

        {/* Quick Select Cities */}
        <div className="space-y-1.5">
          <label htmlFor="city-select" className="block text-[11px] font-medium text-stone-600 dark:text-stone-400">
            Quick Select Major City
          </label>
          <select
            id="city-select"
            value={POPULAR_CITIES.find(c => c.name === coordinates.city)?.name || ''}
            onChange={(e) => handleCitySelect(e.target.value)}
            disabled={isRefreshing}
            className={`w-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700 rounded-2xl px-4 py-2.5 text-sm text-stone-700 dark:text-stone-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 ${isRefreshing ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <option value="">-- Choose an established city --</option>
            {POPULAR_CITIES.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name}, {c.country}
              </option>
            ))}
          </select>
        </div>

        {/* Toggle Manual Coordinates Form */}
        <div>
          <button
            type="button"
            onClick={() => {
              setShowManualForm(!showManualForm);
              setSearchQuery('');
            }}
            className="text-xs text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 font-medium underline underline-offset-4"
          >
            {showManualForm ? 'Hide manual city search' : 'Or search manually for any city'}
          </button>

          {showManualForm && (
            <div className="mt-3 p-4 bg-stone-100/60 dark:bg-stone-800/40 rounded-2xl border border-stone-200 dark:border-stone-800 space-y-3">
              <div className="space-y-1">
                <label htmlFor="city-search" className="block text-[10px] font-semibold text-stone-500 dark:text-stone-400 uppercase">
                  City Search (Case Insensitive)
                </label>
                <div className="relative">
                  <input
                    id="city-search"
                    type="text"
                    placeholder="Search city (e.g. Riyadh, London, Jakarta)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    disabled={isRefreshing}
                    className={`w-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl pl-3 pr-8 py-2 text-xs text-stone-700 dark:text-stone-200 placeholder:text-stone-400 dark:placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-all ${isRefreshing ? 'opacity-60 cursor-not-allowed' : ''}`}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-400 text-xs font-semibold"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Live search results */}
              {searchQuery.trim() !== '' && (
                <div className="space-y-1 max-h-48 overflow-y-auto rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-1 shadow-inner custom-scrollbar">
                  {filteredCities.length > 0 ? (
                    filteredCities.map((city) => {
                      const isSelected = coordinates.city === city.name;
                      const method = CALCULATION_METHODS.find(m => m.id === city.methodId)?.name || '';
                      return (
                        <button
                          key={`${city.name}-${city.country}`}
                          type="button"
                          disabled={isRefreshing}
                          onClick={() => {
                            handleCitySelect(city.name);
                            setSearchQuery('');
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-xs transition-colors ${
                            isSelected
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-medium'
                              : 'hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300'
                          } ${isRefreshing ? 'opacity-60 cursor-not-allowed' : ''}`}
                        >
                          <div>
                            <span className="font-semibold">{city.name}</span>
                            <span className="text-stone-400 dark:text-stone-500 font-normal">, {city.country}</span>
                          </div>
                          <div className="text-[10px] text-stone-400 dark:text-stone-500 text-right font-mono">
                            {method.replace(/Calculation|Method/g, '').trim()}
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    <div className="p-3 text-center text-xs text-stone-400 dark:text-stone-500">
                      No cities found matching "{searchQuery}"
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Database Sources */}
      <div className="space-y-3 pt-4 border-t border-stone-200/60 dark:border-stone-800/60">
        <label htmlFor="source-select" className="block text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
          Calculation Database Source
        </label>
        <div className="relative">
          <select
            id="source-select"
            value={settings.source}
            onChange={(e) => handleSourceChange(e.target.value as CalculationSource)}
            className="w-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700 rounded-2xl px-4 py-3 text-sm text-stone-700 dark:text-stone-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-all cursor-pointer appearance-none"
          >
            <option value="local">Offline Engine (Local Device Calculation)</option>
            <option value="api">Aladhan Public API (International)</option>
            <option value="kemenag">Kemenag API (Indonesia Official)</option>
            <option value="jakim">JAKIM API (Malaysia Official)</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-stone-400 dark:text-stone-500">
            <Database className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Select Database (Calculation Method) */}
      {(settings.source === 'api') && (
        <>
          <div className="space-y-2">
            <label htmlFor="method-select" className="block text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Prayer Database / Calculation Method
            </label>
            <div className="relative">
              <select
                id="method-select"
                value={settings.methodId}
                onChange={handleMethodChange}
                className="w-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700 rounded-2xl px-4 py-3 text-sm text-stone-700 dark:text-stone-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 transition-all cursor-pointer appearance-none"
              >
                {CALCULATION_METHODS.filter(m => settings.source === 'local' || (m.id !== 15 && m.id !== 16)).map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-stone-400 dark:text-stone-500">
                <Database className="w-4 h-4" />
              </div>
            </div>
            <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-normal pl-1">
              {CALCULATION_METHODS.find(m => m.id === settings.methodId)?.description}
            </p>
          </div>

          {/* Advanced Calculation Settings */}
          <div className="space-y-4 pt-4 border-t border-stone-200/60 dark:border-stone-800/60">
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Advanced Calculation Rules
            </label>
            
            {/* Asr Juristic Method */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400 flex items-center gap-1">
                Asr Shadow Method
                <HelpCircle className="w-3 h-3 text-stone-400 dark:text-stone-500" title="Standard is used by Shafi'i, Maliki, Hanbali. Hanafi shadow method is later." />
              </label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-stone-100 dark:bg-stone-800 rounded-xl border border-stone-200/60 dark:border-stone-800/60">
                <button
                  type="button"
                  onClick={() => handleAsrChange('standard')}
                  className={`py-2 text-xs font-medium rounded-lg transition-all ${
                    settings.asrMethod === 'standard'
                      ? 'bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-100 shadow-sm font-semibold'
                      : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300'
                  }`}
                >
                  Standard (Shafi'i, Maliki, Hanbali)
                </button>
                <button
                  type="button"
                  onClick={() => handleAsrChange('hanafi')}
                  className={`py-2 text-xs font-medium rounded-lg transition-all ${
                    settings.asrMethod === 'hanafi'
                      ? 'bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-100 shadow-sm font-semibold'
                      : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300'
                  }`}
                >
                  Hanafi
                </button>
              </div>
            </div>

            {/* High Latitude Adjustment Rules */}
            <div className="space-y-1.5">
              <label htmlFor="highlat-select" className="block text-xs font-semibold text-stone-600 dark:text-stone-400">
                High Latitude Rule (Extreme Locations)
              </label>
              <select
                id="highlat-select"
                value={settings.highLatRule}
                onChange={handleHighLatChange}
                className="w-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700 rounded-2xl px-4 py-2.5 text-sm text-stone-700 dark:text-stone-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 cursor-pointer"
              >
                <option value="none">No Adjustment (Default)</option>
                <option value="middle-night">Middle of the Night (Shab-e-Bedar)</option>
                <option value="one-seventh">One Seventh of Night Rule</option>
                <option value="angle-based">Angle-Based (Recommended for High Latitudes)</option>
              </select>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
