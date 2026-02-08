import { UploadArea } from '@/components/upload';
import { Button } from '@/components/ui';
import { useAppStore } from '@/stores/useAppStore';
import { useLanguageStore } from '@/stores/useLanguageStore';

export function UploadPage() {
  const { uploadedImage, setUploadedImage, setStep, setApiLanguage } = useAppStore();
  const { t, language } = useLanguageStore();

  const handleImageSelect = (_file: File, preview: string) => {
    setUploadedImage(preview);
  };

  const handleContinue = () => {
    if (uploadedImage) {
      // Capture current language before navigating
      setApiLanguage(language);
      setStep('loading');
    }
  };

  return (
    <div className="flex-1 flex flex-col p-5">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-2">📸 {t('uploadTitle')}</h2>
        <p className="text-gray-500 text-sm">{t('uploadSubtitle')}</p>
      </div>

      <div className="flex-1 flex flex-col justify-center items-center">
        <UploadArea
          onImageSelect={handleImageSelect}
          preview={uploadedImage}
        />
      </div>

      {uploadedImage && (
        <div className="mt-6 space-y-3">
          <Button onClick={handleContinue} fullWidth>
            {t('recognizeButton')} 🔍
          </Button>
          <Button
            variant="secondary"
            onClick={() => setUploadedImage(null)}
            fullWidth
          >
            {t('reuploadButton')}
          </Button>
        </div>
      )}
    </div>
  );
}
