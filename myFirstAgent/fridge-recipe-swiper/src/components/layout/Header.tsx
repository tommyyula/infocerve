import { useLanguageStore } from '@/stores/useLanguageStore';

interface HeaderProps {
  onFavoritesClick: () => void;
}

export function Header({ onFavoritesClick }: HeaderProps) {
  const { language, setLanguage, t } = useLanguageStore();

  const toggleLanguage = () => {
    setLanguage(language === 'zh' ? 'en' : 'zh');
  };

  return (
    <header className="flex justify-between items-center px-5 py-4 bg-white border-b border-gray-100">
      <h1 className="text-lg font-bold text-gray-800">🍳 {t('appName')}</h1>
      <div className="flex items-center gap-3">
        <button
          onClick={toggleLanguage}
          className="px-2 py-1 text-sm font-medium text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
          title="Switch language"
        >
          {language === 'zh' ? 'EN' : '中文'}
        </button>
        <button
          onClick={onFavoritesClick}
          className="text-2xl hover:scale-110 transition-transform"
          title="View favorites"
        >
          ❤️
        </button>
      </div>
    </header>
  );
}
