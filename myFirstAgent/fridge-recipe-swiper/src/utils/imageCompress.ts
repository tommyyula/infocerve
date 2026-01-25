const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Check if file should be compressed
 * @param fileSize - File size in bytes
 * @returns true if file exceeds 5MB
 */
export function shouldCompress(fileSize: number): boolean {
  return fileSize > MAX_FILE_SIZE;
}

/**
 * Compress image file if it exceeds size limit
 * @param file - Image file to compress
 * @param quality - JPEG quality (0-1), default 0.8
 * @returns Compressed file or original if no compression needed
 */
export async function compressImage(
  file: File,
  quality: number = 0.8
): Promise<File> {
  // Return original if no compression needed
  if (!shouldCompress(file.size)) {
    return file;
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // Calculate new dimensions (max 1920px)
        const maxDimension = 1920;
        let { width, height } = img;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = (height / width) * maxDimension;
            width = maxDimension;
          } else {
            width = (width / height) * maxDimension;
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'));
              return;
            }

            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });

            resolve(compressedFile);
          },
          'image/jpeg',
          quality
        );
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.src = event.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
}
