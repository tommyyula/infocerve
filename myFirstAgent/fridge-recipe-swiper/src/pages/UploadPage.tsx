import { UploadArea } from '@/components/upload';
import { Button } from '@/components/ui';
import { useAppStore } from '@/stores/useAppStore';

export function UploadPage() {
  const { uploadedImage, setUploadedImage, setStep } = useAppStore();

  const handleImageSelect = (_file: File, preview: string) => {
    setUploadedImage(preview);
  };

  const handleContinue = () => {
    if (uploadedImage) {
      setStep('loading');
    }
  };

  return (
    <div className="flex-1 flex flex-col p-5">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-2">📸 上传冰箱照片</h2>
        <p className="text-gray-500 text-sm">拍摄或上传你的冰箱食材照片</p>
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
            识别食材 🔍
          </Button>
          <Button
            variant="secondary"
            onClick={() => setUploadedImage(null)}
            fullWidth
          >
            重新上传
          </Button>
        </div>
      )}
    </div>
  );
}
