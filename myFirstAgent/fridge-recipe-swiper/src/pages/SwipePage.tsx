import { useState } from 'react';
import { SwipeableCard, RecipeDetail } from '@/components/recipe';
import { Modal } from '@/components/ui';
import { useAppStore } from '@/stores/useAppStore';
import { useFavoriteStore } from '@/stores/useFavoriteStore';
import { useLanguageStore } from '@/stores/useLanguageStore';
import type { Recipe, SwipeDirection } from '@/types';

export function SwipePage() {
  const { recipes, currentIndex, setCurrentIndex, setStep } = useAppStore();
  const { addFavorite } = useFavoriteStore();
  const { t } = useLanguageStore();
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  const handleSwipe = (direction: SwipeDirection) => {
    const recipe = recipes[currentIndex];

    if (direction === 'right') {
      addFavorite(recipe);
    }

    if (currentIndex < recipes.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setStep('result');
    }
  };

  const visibleCards = recipes.slice(currentIndex, currentIndex + 3);

  return (
    <div className="flex-1 flex flex-col p-5">
      <div className="text-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">👆 {t('swipeHint')}</h2>
        <p className="text-gray-500 text-sm mt-1">
          {currentIndex + 1} / {recipes.length}
        </p>
      </div>

      <div className="flex-1 relative flex items-center justify-center">
        {visibleCards.length > 0 ? (
          visibleCards.map((recipe, index) => (
            <SwipeableCard
              key={recipe.id}
              recipe={recipe}
              onSwipe={handleSwipe}
              onClick={() => setSelectedRecipe(recipe)}
              isTop={index === 0}
              index={index}
            />
          )).reverse()
        ) : (
          <div className="text-center text-gray-500">
            <p className="text-4xl mb-2">🎉</p>
            <p>{t('allRecipesDone')}</p>
          </div>
        )}
      </div>

      <div className="flex justify-center gap-8 mt-4">
        <button
          onClick={() => handleSwipe('left')}
          className="w-14 h-14 rounded-full bg-white shadow-lg flex items-center justify-center text-2xl hover:scale-110 transition-transform"
          disabled={visibleCards.length === 0}
        >
          ❌
        </button>
        <button
          onClick={() => handleSwipe('right')}
          className="w-14 h-14 rounded-full bg-white shadow-lg flex items-center justify-center text-2xl hover:scale-110 transition-transform"
          disabled={visibleCards.length === 0}
        >
          ❤️
        </button>
      </div>

      <Modal
        isOpen={selectedRecipe !== null}
        onClose={() => setSelectedRecipe(null)}
        title={selectedRecipe?.name || ''}
      >
        {selectedRecipe && <RecipeDetail recipe={selectedRecipe} />}
      </Modal>
    </div>
  );
}
