import { useRef, ChangeEvent, DragEvent, useState } from 'react';
import { useLanguageStore } from '@/stores/useLanguageStore';

interface UploadAreaProps {
  onImageSelect: (file: File, preview: string) => void;
  preview: string | null;
  disabled?: boolean;
}

export function UploadArea({ onImageSelect, preview, disabled }: UploadAreaProps) {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const { t } = useLanguageStore();

  const handleCameraClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!disabled) {
      cameraInputRef.current?.click();
    }
  };

  const handleGalleryClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!disabled) {
      galleryInputRef.current?.click();
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
    // Reset input value to allow selecting the same file again
    e.target.value = '';
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert(t('selectImageFile'));
      return;
    }
    const previewUrl = URL.createObjectURL(file);
    onImageSelect(file, previewUrl);
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        w-full max-w-[300px] aspect-square
        rounded-2xl
        transition-all duration-300
        flex flex-col items-center justify-center
        ${preview
          ? 'border-none p-0'
          : `border-3 border-dashed ${isDragging ? 'border-purple-500 bg-purple-50' : 'border-gray-300 bg-white'}`
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      {/* Camera input - opens camera directly on mobile */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled}
      />

      {/* Gallery input - opens file picker/gallery */}
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled}
      />

      {preview ? (
        <img
          src={preview}
          alt="Selected ingredients"
          className="w-full h-full object-cover rounded-2xl cursor-pointer"
          onClick={handleGalleryClick}
        />
      ) : (
        <div className="flex flex-col items-center gap-4 p-4">
          <span className="text-5xl">📷</span>

          {/* Two buttons for mobile - Camera and Gallery */}
          <div className="flex flex-col gap-3 w-full">
            <button
              onClick={handleCameraClick}
              disabled={disabled}
              className="w-full px-4 py-3 bg-purple-500 text-white rounded-xl font-medium hover:bg-purple-600 transition-colors disabled:opacity-50"
            >
              📸 {t('takePhoto')}
            </button>
            <button
              onClick={handleGalleryClick}
              disabled={disabled}
              className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              🖼️ {t('chooseFromGallery')}
            </button>
          </div>

          <p className="text-gray-400 text-xs text-center mt-2">
            {t('dragDropHint')}
          </p>
        </div>
      )}
    </div>
  );
}
