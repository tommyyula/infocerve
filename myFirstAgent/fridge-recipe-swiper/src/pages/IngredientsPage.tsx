import { IngredientList, AddIngredient } from '@/components/ingredients';
import { Button } from '@/components/ui';
import { useAppStore } from '@/stores/useAppStore';

export function IngredientsPage() {
  const { ingredients, removeIngredient, addIngredient, setStep } = useAppStore();

  const handleGenerateRecipes = () => {
    if (ingredients.length > 0) {
      setStep('loading');
    }
  };

  return (
    <div className="flex-1 flex flex-col p-5">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-2">🥬 确认食材</h2>
        <p className="text-gray-500 text-sm">检查识别结果，可以添加或删除</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        <IngredientList
          ingredients={ingredients}
          onRemove={removeIngredient}
        />

        <div className="mt-4">
          <AddIngredient onAdd={addIngredient} />
        </div>
      </div>

      <div className="mt-6 space-y-3">
        <Button
          onClick={handleGenerateRecipes}
          disabled={ingredients.length === 0}
          fullWidth
        >
          生成食谱 🍳 ({ingredients.length} 种食材)
        </Button>
        <Button
          variant="secondary"
          onClick={() => setStep('upload')}
          fullWidth
        >
          返回上传
        </Button>
      </div>
    </div>
  );
}
