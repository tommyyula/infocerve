import type { Recipe } from '@/types';
import { useLanguageStore } from '@/stores/useLanguageStore';

interface RecipeDetailProps {
  recipe: Recipe;
}

export function RecipeDetail({ recipe }: RecipeDetailProps) {
  const { t } = useLanguageStore();

  return (
    <div className="space-y-6">
      {/* Meta info */}
      <div className="flex gap-4 text-gray-600">
        <span>⏱️ {recipe.cookingTime}{t('minutes')}</span>
        <span>📊 {t(`difficulty.${recipe.difficulty}`)}</span>
      </div>

      {/* Ingredients */}
      <div>
        <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
          🥬 {t('requiredIngredients')}
        </h4>
        <ul className="space-y-2">
          {recipe.ingredients.map((ing, idx) => (
            <li key={idx} className="text-gray-600 border-b border-gray-100 pb-2">
              {ing.name} - {ing.amount}
              {ing.optional && <span className="text-gray-400 text-sm ml-2">({t('optional')})</span>}
            </li>
          ))}
        </ul>
      </div>

      {/* Steps */}
      <div>
        <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
          👨‍🍳 {t('cookingSteps')}
        </h4>
        <ol className="space-y-3">
          {recipe.steps.map((step, idx) => (
            <li key={idx} className="flex gap-3 text-gray-600">
              <span className="flex-shrink-0 w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm">
                {idx + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
