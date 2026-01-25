import { useState } from 'react';
import { RecipeList, RecipeDetail } from '@/components/recipe';
import { Button, Modal } from '@/components/ui';
import { useFavoriteStore } from '@/stores/useFavoriteStore';
import type { Recipe } from '@/types';

interface FavoritesPageProps {
  onBack: () => void;
}

export function FavoritesPage({ onBack }: FavoritesPageProps) {
  const { favorites, removeFavorite, clearFavorites } = useFavoriteStore();
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  return (
    <div className="flex-1 flex flex-col p-5">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-2">❤️ 我的收藏</h2>
        <p className="text-gray-500 text-sm">
          共 {favorites.length} 个食谱
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
          返回 ←
        </Button>
        {favorites.length > 0 && (
          <Button
            variant="danger"
            onClick={clearFavorites}
            fullWidth
          >
            清空收藏
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
                取消收藏
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
