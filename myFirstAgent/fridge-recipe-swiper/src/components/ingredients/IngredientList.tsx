import { Tag } from '@/components/ui';
import type { Ingredient } from '@/types';

interface IngredientListProps {
  ingredients: Ingredient[];
  onRemove: (index: number) => void;
}

export function IngredientList({ ingredients, onRemove }: IngredientListProps) {
  if (ingredients.length === 0) {
    return (
      <p className="text-gray-500 text-center py-4">
        No ingredients detected
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-3">
      {ingredients.map((ingredient, index) => (
        <Tag key={`${ingredient.name}-${index}`} onRemove={() => onRemove(index)}>
          {ingredient.name}
          {ingredient.confidence && (
            <span className="text-xs text-gray-400">
              {Math.round(ingredient.confidence * 100)}%
            </span>
          )}
        </Tag>
      ))}
    </div>
  );
}
