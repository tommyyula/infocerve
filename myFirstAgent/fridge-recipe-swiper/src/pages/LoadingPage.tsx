import { useEffect } from 'react';
import { Spinner } from '@/components/ui';
import { useAppStore } from '@/stores/useAppStore';
import { useLanguageStore } from '@/stores/useLanguageStore';
import { recognizeIngredients, generateRecipes } from '@/services/api';

// Convert blob URL to base64
async function blobUrlToBase64(blobUrl: string): Promise<string> {
  const response = await fetch(blobUrl);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export function LoadingPage() {
  const {
    uploadedImage,
    ingredients,
    apiLanguage,
    setIngredients,
    setRecipes,
    setStep,
    setError,
  } = useAppStore();
  const { t } = useLanguageStore();

  useEffect(() => {
    const process = async () => {
      try {
        // Use the language that was captured when the user started the process
        const language = apiLanguage;
        console.log('LoadingPage using apiLanguage from store:', language);

        // If we have an image but no ingredients, recognize them first
        if (uploadedImage && ingredients.length === 0) {
          // Convert blob URL to base64 for API
          const base64Image = await blobUrlToBase64(uploadedImage);
          console.log('Calling recognizeIngredients with language:', language);
          const recognized = await recognizeIngredients(base64Image, language);
          setIngredients(recognized);
          setStep('ingredients');
        }
        // If we have ingredients, generate recipes
        else if (ingredients.length > 0) {
          console.log('Calling generateRecipes with language:', language);
          const recipes = await generateRecipes(ingredients, language);
          setRecipes(recipes);
          setStep('swipe');
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : t('errorRecognize'));
        setStep('upload');
      }
    };

    process();
  }, [apiLanguage]);

  const message = ingredients.length === 0
    ? t('recognizingText')
    : t('generatingText');

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-5">
      <Spinner size="lg" />
      <p className="mt-4 text-gray-600 text-lg">{message}</p>
      <p className="mt-2 text-gray-400 text-sm">{t('aiWorking')}</p>
    </div>
  );
}
