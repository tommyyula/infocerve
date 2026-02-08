import { IngredientList, AddIngredient } from '@/components/ingredients';
import { Button } from '@/components/ui';
import { useAppStore } from '@/stores/useAppStore';
import { useLanguageStore } from '@/stores/useLanguageStore';

export function IngredientsPage() {
  const { ingredients, removeIngredient, addIngredient, setStep, setApiLanguage } = useAppStore();
  const { t, language } = useLanguageStore();

  const handleGenerateRecipes = () => {
    if (ingredients.length > 0) {
      // Capture current language before navigating
      setApiLanguage(language);
      console.log('Setting API language to:', language);
      setStep('loading');
    }
  };

  return (
    <div className="flex-1 flex flex-col p-5">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-2">🥬 {t('confirmIngredients')}</h2>
        <p className="text-gray-500 text-sm">{t('ingredientsSubtitle')}</p>
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
          {t('generateRecipes')} 🍳 ({ingredients.length} {t('ingredientCount')})
        </Button>
        <Button
          variant="secondary"
          onClick={() => setStep('upload')}
          fullWidth
        >
          {t('backToUpload')}
        </Button>
      </div>
    </div>
  );
}
