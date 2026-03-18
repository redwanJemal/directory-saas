import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en.json';
import am from './am.json';
import { getTelegramWebApp } from '../lib/telegram';

const tgLang = getTelegramWebApp()?.initDataUnsafe?.user?.language_code;
const defaultLang = tgLang === 'am' ? 'am' : 'en';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    am: { translation: am },
  },
  lng: defaultLang,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;
