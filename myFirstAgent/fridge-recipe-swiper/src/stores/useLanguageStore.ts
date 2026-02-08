import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { translations, type Language } from '@/i18n/translations';

interface LanguageState {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set, get) => ({
      language: 'zh',

      setLanguage: (language) => set({ language }),

      t: (key, params) => {
        const { language } = get();
        const keys = key.split('.');
        let value: unknown = translations[language];

        for (const k of keys) {
          if (value && typeof value === 'object' && k in value) {
            value = (value as Record<string, unknown>)[k];
          } else {
            return key; // Return key if translation not found
          }
        }

        if (typeof value !== 'string') {
          return key;
        }

        // Replace parameters like {count}
        if (params) {
          return Object.entries(params).reduce(
            (str, [k, v]) => str.replace(`{${k}}`, String(v)),
            value
          );
        }

        return value;
      },
    }),
    {
      name: 'language-storage',
    }
  )
);
