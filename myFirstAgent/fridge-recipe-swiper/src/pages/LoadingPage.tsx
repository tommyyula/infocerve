import { useEffect } from 'react';
import { Spinner } from '@/components/ui';
import { useAppStore } from '@/stores/useAppStore';
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
    setIngredients,
    setRecipes,
    setStep,
    setError,
  } = useAppStore();

  useEffect(() => {
    const process = async () => {
      try {
        // If we have an image but no ingredients, recognize them first
        if (uploadedImage && ingredients.length === 0) {
          // Convert blob URL to base64 for API
          const base64Image = await blobUrlToBase64(uploadedImage);
          const recognized = await recognizeIngredients(base64Image);
          setIngredients(recognized);
          setStep('ingredients');
        }
        // If we have ingredients, generate recipes
        else if (ingredients.length > 0) {
          const recipes = await generateRecipes(ingredients);
          setRecipes(recipes);
          setStep('swipe');
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : '处理失败，请重试');
        setStep('upload');
      }
    };

    process();
  }, []);

  const message = ingredients.length === 0
    ? '正在识别食材...'
    : '正在生成美味食谱...';

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-5">
      <Spinner size="lg" />
      <p className="mt-4 text-gray-600 text-lg">{message}</p>
      <p className="mt-2 text-gray-400 text-sm">AI 正在努力工作中</p>
    </div>
  );
}
