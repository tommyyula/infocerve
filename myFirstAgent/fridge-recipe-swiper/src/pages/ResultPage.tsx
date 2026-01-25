import { useState } from 'react';
import { RecipeList, RecipeDetail } from '@/components/recipe';
import { Button, Modal } from '@/components/ui';
import { useAppStore } from '@/stores/useAppStore';
import { useFavoriteStore } from '@/stores/useFavoriteStore';
import type { Recipe } from '@/types';

export function ResultPage() {
  const { reset } = useAppStore();
  const { favorites } = useFavoriteStore();
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  return (
    <div className="flex-1 flex flex-col p-5">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-2">🎉 完成！</h2>
        <p className="text-gray-500 text-sm">
          你收藏了 {favorites.length} 个食谱
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        <RecipeList
          recipes={favorites}
          onItemClick={(recipe) => setSelectedRecipe(recipe)}
        />
      </div>

      <div className="mt-6">
        <Button onClick={reset} fullWidth>
          开始新的搜索 🔄
        </Button>
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
