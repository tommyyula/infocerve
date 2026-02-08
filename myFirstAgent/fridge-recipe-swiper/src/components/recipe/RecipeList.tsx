import type { Recipe } from '@/types';
import { useLanguageStore } from '@/stores/useLanguageStore';

interface RecipeListProps {
  recipes: Recipe[];
  onItemClick: (recipe: Recipe) => void;
}

const emojiMap: Record<string, string> = {
  // Chinese keywords
  炒蛋: '🍳',
  蛋: '🥚',
  汤: '🍲',
  面: '🍜',
  饭: '🍚',
  肉: '🥩',
  鱼: '🐟',
  虾: '🦐',
  菜: '🥬',
  沙拉: '🥗',
  // English keywords
  egg: '🥚',
  soup: '🍲',
  noodle: '🍜',
  rice: '🍚',
  meat: '🥩',
  fish: '🐟',
  shrimp: '🦐',
  salad: '🥗',
  vegetable: '🥬',
  pancake: '🥞',
  sandwich: '🥪',
  default: '🍽️',
};

function getEmoji(name: string): string {
  const lowerName = name.toLowerCase();
  for (const [key, emoji] of Object.entries(emojiMap)) {
    if (key !== 'default' && (name.includes(key) || lowerName.includes(key.toLowerCase()))) {
      return emoji;
    }
  }
  return emojiMap.default;
}

export function RecipeList({ recipes, onItemClick }: RecipeListProps) {
  const { t } = useLanguageStore();

  if (recipes.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p className="text-4xl mb-2">😅</p>
        <p>{t('noFavorites')}</p>
        <p className="text-sm">{t('trySwipeRight')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {recipes.map((recipe) => (
        <div
          key={recipe.id}
          onClick={() => onItemClick(recipe)}
          className="flex gap-4 p-4 bg-white rounded-xl shadow-md cursor-pointer hover:shadow-lg transition-shadow"
        >
          <div className="w-14 h-14 bg-gradient-to-br from-pink-400 to-red-400 rounded-xl flex items-center justify-center text-2xl">
            {getEmoji(recipe.name)}
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-gray-800">{recipe.name}</h4>
            <p className="text-sm text-gray-500">
              ⏱️ {recipe.cookingTime}{t('minutes')} · {t(`difficulty.${recipe.difficulty}`)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
