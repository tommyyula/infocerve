import { useState } from 'react';
import { RecipeList, RecipeDetail } from '@/components/recipe';
import { Button, Modal } from '@/components/ui';
import { useFavoriteStore } from '@/stores/useFavoriteStore';
import { useLanguageStore } from '@/stores/useLanguageStore';
import type { Recipe } from '@/types';

interface FavoritesPageProps {
  onBack: () => void;
}

export function FavoritesPage({ onBack }: FavoritesPageProps) {
  const { favorites, removeFavorite, clearFavorites } = useFavoriteStore();
  const { t } = useLanguageStore();
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  return (
    <div className="flex-1 flex flex-col p-5">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-2">❤️ {t('favoritesTitle')}</h2>
        <p className="text-gray-500 text-sm">
          {t('totalRecipes', { count: favorites.length })}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        <RecipeList
          recipes={favorites}
          onItemClick={(recipe) => setSelectedRecipe(recipe)}
        />
      </div>

      <div className="mt-6 space-y-3">
        <Button onClick={onBack} fullWidth>
          {t('backButton')} ←
        </Button>
        {favorites.length > 0 && (
          <Button
            variant="danger"
            onClick={clearFavorites}
            fullWidth
          >
            {t('clearFavorites')}
          </Button>
        )}
      </div>

      <Modal
        isOpen={selectedRecipe !== null}
        onClose={() => setSelectedRecipe(null)}
        title={selectedRecipe?.name || ''}
      >
        {selectedRecipe && (
          <div>
            <RecipeDetail recipe={selectedRecipe} />
            <div className="mt-4">
              <Button
                variant="danger"
                onClick={() => {
                  removeFavorite(selectedRecipe.id);
                  setSelectedRecipe(null);
                }}
                fullWidth
              >
                {t('removeFavorite')}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
