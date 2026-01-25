import type { Recipe } from '@/types';

interface RecipeListProps {
  recipes: Recipe[];
  onItemClick: (recipe: Recipe) => void;
}

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

const difficultyMap = {
  easy: '简单',
  medium: '中等',
  hard: '困难',
};

export function RecipeList({ recipes, onItemClick }: RecipeListProps) {
  if (recipes.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p className="text-4xl mb-2">😅</p>
        <p>没有收藏任何食谱</p>
        <p className="text-sm">试试多右滑几个吧！</p>
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
              ⏱️ {recipe.cookingTime}分钟 · {difficultyMap[recipe.difficulty]}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
