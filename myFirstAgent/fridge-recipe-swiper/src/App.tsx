import { useState } from 'react';
import { AppContainer, Header } from '@/components/layout';
import {
  UploadPage,
  IngredientsPage,
  LoadingPage,
  SwipePage,
  ResultPage,
  FavoritesPage,
} from '@/pages';
import { useAppStore } from '@/stores/useAppStore';

function App() {
  const { step, error, clearError } = useAppStore();
  const [showFavorites, setShowFavorites] = useState(false);

  const renderPage = () => {
    if (showFavorites) {
      return <FavoritesPage onBack={() => setShowFavorites(false)} />;
    }

    switch (step) {
      case 'upload':
        return <UploadPage />;
      case 'ingredients':
        return <IngredientsPage />;
      case 'loading':
        return <LoadingPage />;
      case 'swipe':
        return <SwipePage />;
      case 'result':
        return <ResultPage />;
      default:
        return <UploadPage />;
    }
  };

  return (
    <AppContainer>
        <Header onFavoritesClick={() => setShowFavorites(!showFavorites)} />

        {error && (
          <div className="mx-5 mt-4 p-3 bg-red-100 border border-red-300 rounded-lg text-red-700 text-sm flex justify-between items-center">
            <span>{error}</span>
            <button
              onClick={clearError}
              className="text-red-500 hover:text-red-700"
            >
              ✕
            </button>
          </div>
        )}

        {renderPage()}
      </AppContainer>
  );
}

export default App;
