import type { Recipe } from '@/types';

interface RecipeCardProps {
  recipe: Recipe;
  onClick?: () => void;
}

const difficultyMap = {
  easy: '简单',
  medium: '中等',
  hard: '困难',
};

const emojiMap: Record<string, string> = {
  炒蛋: '🍳',
  蛋: '🥚',
  汤: '🍲',
  面: '🍜',
  饭: '🍚',
  肉: '🥩',
  鱼: '🐟',
  虾: '🦐',
  菜: '🥬',
  default: '🍽️',
};

function getEmoji(name: string): string {
  for (const [key, emoji] of Object.entries(emojiMap)) {
    if (name.includes(key)) return emoji;
  }
  return emojiMap.default;
}

export function RecipeCard({ recipe, onClick }: RecipeCardProps) {
  return (
    <div
      onClick={onClick}
      className="w-full bg-white rounded-2xl shadow-xl overflow-hidden cursor-pointer"
    >
      {/* Image area */}
      <div className="h-48 bg-gradient-to-br from-pink-400 to-red-400 flex items-center justify-center">
        <span className="text-7xl">{getEmoji(recipe.name)}</span>
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="text-xl font-bold text-gray-800 mb-2">{recipe.name}</h3>

        <div className="flex gap-4 text-sm text-gray-500 mb-3">
          <span>⏱️ {recipe.cookingTime}分钟</span>
          <span>📊 {difficultyMap[recipe.difficulty]}</span>
        </div>

        <p className="text-gray-600 text-sm line-clamp-2">{recipe.description}</p>
      </div>
    </div>
  );
}
