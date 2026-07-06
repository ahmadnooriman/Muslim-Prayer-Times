export interface CityInfo {
  name: string;
  country: string;
  latitude: number;
  longitude: number;
  methodId: number; // Suggested calculation method for this region
  timezoneOffset: number; // Timezone offset in hours
}

export const POPULAR_CITIES: CityInfo[] = [
  { name: "Makkah", country: "Saudi Arabia", latitude: 21.4225, longitude: 39.8262, methodId: 4, timezoneOffset: 3 }, // Umm Al-Qura
  { name: "Medina", country: "Saudi Arabia", latitude: 24.4672, longitude: 39.6111, methodId: 4, timezoneOffset: 3 }, // Umm Al-Qura
  { name: "Riyadh", country: "Saudi Arabia", latitude: 24.7136, longitude: 46.6753, methodId: 4, timezoneOffset: 3 }, // Umm Al-Qura
  { name: "Jeddah", country: "Saudi Arabia", latitude: 21.5433, longitude: 39.1728, methodId: 4, timezoneOffset: 3 }, // Umm Al-Qura
  { name: "Cairo", country: "Egypt", latitude: 30.0444, longitude: 31.2357, methodId: 5, timezoneOffset: 2 }, // Egypt Survey
  { name: "Alexandria", country: "Egypt", latitude: 31.2001, longitude: 29.9187, methodId: 5, timezoneOffset: 2 }, // Egypt Survey
  { name: "Giza", country: "Egypt", latitude: 30.0131, longitude: 31.2089, methodId: 5, timezoneOffset: 2 }, // Egypt Survey
  { name: "Karachi", country: "Pakistan", latitude: 24.8607, longitude: 67.0011, methodId: 1, timezoneOffset: 5 }, // Karachi
  { name: "Lahore", country: "Pakistan", latitude: 31.5204, longitude: 74.3587, methodId: 1, timezoneOffset: 5 }, // Karachi
  { name: "Islamabad", country: "Pakistan", latitude: 33.6844, longitude: 73.0479, methodId: 1, timezoneOffset: 5 }, // Karachi
  { name: "Jakarta", country: "Indonesia", latitude: -6.2088, longitude: 106.8456, methodId: 15, timezoneOffset: 7 }, // Kemenag Indonesia
  { name: "Surabaya", country: "Indonesia", latitude: -7.2575, longitude: 112.7521, methodId: 15, timezoneOffset: 7 }, // Kemenag Indonesia
  { name: "Bandung", country: "Indonesia", latitude: -6.9175, longitude: 107.6191, methodId: 15, timezoneOffset: 7 }, // Kemenag Indonesia
  { name: "Medan", country: "Indonesia", latitude: 3.5952, longitude: 98.6722, methodId: 15, timezoneOffset: 7 }, // Kemenag Indonesia
  { name: "Kuala Lumpur", country: "Malaysia", latitude: 3.1390, longitude: 101.6869, methodId: 16, timezoneOffset: 8 }, // JAKIM Malaysia
  { name: "Penang", country: "Malaysia", latitude: 5.4141, longitude: 100.3288, methodId: 16, timezoneOffset: 8 }, // JAKIM Malaysia
  { name: "Singapore", country: "Singapore", latitude: 1.3521, longitude: 103.8198, methodId: 16, timezoneOffset: 8 }, // JAKIM/MUIS
  { name: "Istanbul", country: "Turkey", latitude: 41.0082, longitude: 28.9784, methodId: 13, timezoneOffset: 3 }, // Diyanet
  { name: "Ankara", country: "Turkey", latitude: 39.9334, longitude: 32.8597, methodId: 13, timezoneOffset: 3 }, // Diyanet
  { name: "London", country: "United Kingdom", latitude: 51.5074, longitude: -0.1278, methodId: 3, timezoneOffset: 1 }, // MWL
  { name: "Birmingham", country: "United Kingdom", latitude: 52.4862, longitude: -1.8904, methodId: 3, timezoneOffset: 1 }, // MWL
  { name: "New York", country: "United States", latitude: 40.7128, longitude: -74.0060, methodId: 2, timezoneOffset: -4 }, // ISNA
  { name: "Los Angeles", country: "United States", latitude: 34.0522, longitude: -118.2437, methodId: 2, timezoneOffset: -7 }, // ISNA
  { name: "Chicago", country: "United States", latitude: 41.8781, longitude: -87.6298, methodId: 2, timezoneOffset: -5 }, // ISNA
  { name: "Houston", country: "United States", latitude: 29.7604, longitude: -95.3698, methodId: 2, timezoneOffset: -5 }, // ISNA
  { name: "Sydney", country: "Australia", latitude: -33.8688, longitude: 151.2093, methodId: 3, timezoneOffset: 10 }, // MWL
  { name: "Melbourne", country: "Australia", latitude: -37.8136, longitude: 144.9631, methodId: 3, timezoneOffset: 10 }, // MWL
  { name: "Dubai", country: "United Arab Emirates", latitude: 25.2048, longitude: 55.2708, methodId: 8, timezoneOffset: 4 }, // Gulf Region
  { name: "Abu Dhabi", country: "United Arab Emirates", latitude: 24.4539, longitude: 54.3773, methodId: 8, timezoneOffset: 4 }, // Gulf Region
  { name: "Toronto", country: "Canada", latitude: 43.6532, longitude: -79.3832, methodId: 2, timezoneOffset: -4 }, // ISNA
  { name: "Montreal", country: "Canada", latitude: 45.5017, longitude: -73.5673, methodId: 2, timezoneOffset: -4 }, // ISNA
  { name: "Paris", country: "France", latitude: 48.8566, longitude: 2.3522, methodId: 3, timezoneOffset: 2 }, // MWL
  { name: "Berlin", country: "Germany", latitude: 52.5200, longitude: 13.4050, methodId: 3, timezoneOffset: 2 }, // MWL
  { name: "Sarajevo", country: "Bosnia and Herzegovina", latitude: 43.8563, longitude: 18.4131, methodId: 3, timezoneOffset: 2 }, // MWL
  { name: "Casablanca", country: "Morocco", latitude: 33.5731, longitude: -7.5898, methodId: 5, timezoneOffset: 1 },
  { name: "Algiers", country: "Algeria", latitude: 36.7538, longitude: 3.0588, methodId: 5, timezoneOffset: 1 },
  { name: "Tunis", country: "Tunisia", latitude: 36.8065, longitude: 10.1815, methodId: 5, timezoneOffset: 1 },
  { name: "Amman", country: "Jordan", latitude: 31.9522, longitude: 35.9106, methodId: 4, timezoneOffset: 3 },
  { name: "Beirut", country: "Lebanon", latitude: 33.8938, longitude: 35.5018, methodId: 3, timezoneOffset: 3 },
  { name: "Jerusalem", country: "Palestine", latitude: 31.7683, longitude: 35.2137, methodId: 4, timezoneOffset: 3 },
  { name: "Baghdad", country: "Iraq", latitude: 33.3152, longitude: 44.3661, methodId: 4, timezoneOffset: 3 },
  { name: "Damascus", country: "Syria", latitude: 33.5138, longitude: 36.2765, methodId: 4, timezoneOffset: 3 },
  { name: "Kuwait City", country: "Kuwait", latitude: 29.3759, longitude: 47.9774, methodId: 4, timezoneOffset: 3 },
  { name: "Doha", country: "Qatar", latitude: 25.2854, longitude: 51.5310, methodId: 4, timezoneOffset: 3 },
  { name: "Manama", country: "Bahrain", latitude: 26.2285, longitude: 50.5860, methodId: 4, timezoneOffset: 3 },
  { name: "Muscat", country: "Oman", latitude: 23.5859, longitude: 58.4059, methodId: 4, timezoneOffset: 4 },
  { name: "Sanaa", country: "Yemen", latitude: 15.3694, longitude: 44.1910, methodId: 4, timezoneOffset: 3 },
  { name: "Tehran", country: "Iran", latitude: 35.6892, longitude: 51.3890, methodId: 7, timezoneOffset: 3.5 },
  { name: "Kabul", country: "Afghanistan", latitude: 34.5553, longitude: 69.1775, methodId: 1, timezoneOffset: 4.5 },
  { name: "Dhaka", country: "Bangladesh", latitude: 23.8103, longitude: 90.4125, methodId: 1, timezoneOffset: 6 },
  { name: "New Delhi", country: "India", latitude: 28.6139, longitude: 77.2090, methodId: 1, timezoneOffset: 5.5 },
  { name: "Mumbai", country: "India", latitude: 19.0760, longitude: 72.8777, methodId: 1, timezoneOffset: 5.5 },
  { name: "Bangkok", country: "Thailand", latitude: 13.7563, longitude: 100.5018, methodId: 3, timezoneOffset: 7 },
  { name: "Manila", country: "Philippines", latitude: 14.5995, longitude: 120.9842, methodId: 3, timezoneOffset: 8 },
  { name: "Tokyo", country: "Japan", latitude: 35.6762, longitude: 139.6503, methodId: 3, timezoneOffset: 9 },
  { name: "Seoul", country: "South Korea", latitude: 37.5665, longitude: 126.9780, methodId: 3, timezoneOffset: 9 },
  { name: "Cape Town", country: "South Africa", latitude: -33.9249, longitude: 18.4241, methodId: 3, timezoneOffset: 2 },
  { name: "Nairobi", country: "Kenya", latitude: -1.2921, longitude: 36.8219, methodId: 3, timezoneOffset: 3 },
  { name: "Lagos", country: "Nigeria", latitude: 6.5244, longitude: 3.3792, methodId: 3, timezoneOffset: 1 }
];
