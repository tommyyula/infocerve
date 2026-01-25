import { useRef, ChangeEvent, DragEvent, useState } from 'react';

interface UploadAreaProps {
  onImageSelect: (file: File, preview: string) => void;
  preview: string | null;
  disabled?: boolean;
}

export function UploadArea({ onImageSelect, preview, disabled }: UploadAreaProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleClick = () => {
    if (!disabled) {
      inputRef.current?.click();
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
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
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        w-full max-w-[300px] aspect-square
        rounded-2xl cursor-pointer
        transition-all duration-300
        flex flex-col items-center justify-center
        ${preview
          ? 'border-none p-0'
          : `border-3 border-dashed ${isDragging ? 'border-purple-500 bg-purple-50' : 'border-gray-300 bg-white hover:border-purple-400 hover:bg-purple-50'}`
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled}
      />

      {preview ? (
        <img
          src={preview}
          alt="Selected ingredients"
          className="w-full h-full object-cover rounded-2xl"
        />
      ) : (
        <>
          <span className="text-6xl mb-4">📷</span>
          <p className="text-gray-600 text-center px-4">
            Click to upload or drag & drop
          </p>
          <p className="text-gray-400 text-sm mt-2">
            Take a photo of your fridge
          </p>
        </>
      )}
    </div>
  );
}
