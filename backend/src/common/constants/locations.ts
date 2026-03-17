export interface Country {
  code: string;
  name: string;
  nameAm: string;
  nameAr: string;
}

export interface City {
  name: string;
  nameAm: string;
  nameAr: string;
}

export const SUPPORTED_COUNTRIES: Country[] = [
  { code: 'AE', name: 'United Arab Emirates', nameAm: 'ዩናይትድ አረብ ኤሚሬትስ', nameAr: 'الإمارات العربية المتحدة' },
  { code: 'SA', name: 'Saudi Arabia', nameAm: 'ሳዑዲ አረቢያ', nameAr: 'المملكة العربية السعودية' },
  { code: 'KW', name: 'Kuwait', nameAm: 'ኩዌት', nameAr: 'الكويت' },
  { code: 'QA', name: 'Qatar', nameAm: 'ቃታር', nameAr: 'قطر' },
  { code: 'BH', name: 'Bahrain', nameAm: 'ባህሬን', nameAr: 'البحرين' },
  { code: 'OM', name: 'Oman', nameAm: 'ኦማን', nameAr: 'عمان' },
];

export const CITIES: Record<string, City[]> = {
  AE: [
    { name: 'Dubai', nameAm: 'ዱባይ', nameAr: 'دبي' },
    { name: 'Abu Dhabi', nameAm: 'አቡ ዳቢ', nameAr: 'أبو ظبي' },
    { name: 'Sharjah', nameAm: 'ሻርጃ', nameAr: 'الشارقة' },
    { name: 'Ajman', nameAm: 'አጅማን', nameAr: 'عجمان' },
    { name: 'Al Ain', nameAm: 'አል አይን', nameAr: 'العين' },
    { name: 'Ras Al Khaimah', nameAm: 'ራስ አል ኸይማ', nameAr: 'رأس الخيمة' },
    { name: 'Fujairah', nameAm: 'ፉጃይራ', nameAr: 'الفجيرة' },
  ],
  SA: [
    { name: 'Riyadh', nameAm: 'ሪያድ', nameAr: 'الرياض' },
    { name: 'Jeddah', nameAm: 'ጅዳ', nameAr: 'جدة' },
    { name: 'Dammam', nameAm: 'ዳማም', nameAr: 'الدمام' },
    { name: 'Mecca', nameAm: 'መካ', nameAr: 'مكة المكرمة' },
    { name: 'Medina', nameAm: 'መዲና', nameAr: 'المدينة المنورة' },
  ],
  KW: [
    { name: 'Kuwait City', nameAm: 'ኩዌት ሲቲ', nameAr: 'مدينة الكويت' },
    { name: 'Hawalli', nameAm: 'ሀዋሊ', nameAr: 'حولي' },
    { name: 'Farwaniya', nameAm: 'ፋርዋኒያ', nameAr: 'الفروانية' },
  ],
  QA: [
    { name: 'Doha', nameAm: 'ዶሃ', nameAr: 'الدوحة' },
    { name: 'Al Wakrah', nameAm: 'አል ዋክራ', nameAr: 'الوكرة' },
  ],
  BH: [
    { name: 'Manama', nameAm: 'ማናማ', nameAr: 'المنامة' },
    { name: 'Riffa', nameAm: 'ሪፋ', nameAr: 'الرفاع' },
  ],
  OM: [
    { name: 'Muscat', nameAm: 'ሙስካት', nameAr: 'مسقط' },
    { name: 'Salalah', nameAm: 'ሳላላ', nameAr: 'صلالة' },
  ],
};

/** Get country by code, or undefined if not supported */
export function getCountryByCode(code: string): Country | undefined {
  return SUPPORTED_COUNTRIES.find((c) => c.code === code);
}

/** Get cities for a country code, or undefined if country not supported */
export function getCitiesForCountry(code: string): City[] | undefined {
  return CITIES[code];
}

/** Check if a city name is valid for a given country code (case-insensitive) */
export function isValidCity(countryCode: string, cityName: string): boolean {
  const cities = CITIES[countryCode];
  if (!cities) return false;
  return cities.some((c) => c.name.toLowerCase() === cityName.toLowerCase());
}

/** All supported country codes */
export const SUPPORTED_COUNTRY_CODES = SUPPORTED_COUNTRIES.map((c) => c.code);
