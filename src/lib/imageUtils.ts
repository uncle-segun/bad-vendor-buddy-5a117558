/**
 * Client-side image conversion utilities
 * Converts images to WebP format before upload
 */

/**
 * Convert an image file to WebP format
 * @param file - The original image file
 * @param quality - WebP quality (0-1), default 0.85
 * @returns Promise<Blob> - The converted WebP blob
 */
export async function convertToWebP(file: File, quality: number = 0.85): Promise<Blob> {
  return new Promise((resolve, reject) => {
    // If file is not an image, return as-is
    if (!file.type.startsWith('image/')) {
      resolve(file);
      return;
    }

    // Create an image element to load the file
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      
      // Create canvas and draw the image
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      ctx.drawImage(img, 0, 0);
      
      // Convert to WebP
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to convert image to WebP'));
          }
        },
        'image/webp',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

/**
 * Process a file for upload - converts images to WebP, keeps other files as-is
 * @param file - The file to process
 * @returns Promise with the processed file/blob and new filename
 */
export async function processFileForUpload(file: File): Promise<{ blob: Blob; fileName: string; mimeType: string }> {
  // For non-image files, return as-is
  if (!file.type.startsWith('image/')) {
    return {
      blob: file,
      fileName: file.name,
      mimeType: file.type,
    };
  }

  try {
    // Convert to WebP
    const webpBlob = await convertToWebP(file);
    
    // Generate new filename with .webp extension
    const originalName = file.name.replace(/\.[^/.]+$/, ''); // Remove original extension
    const newFileName = `${originalName}.webp`;
    
    return {
      blob: webpBlob,
      fileName: newFileName,
      mimeType: 'image/webp',
    };
  } catch (error) {
    console.error('Error converting image to WebP:', error);
    // Fallback to original file if conversion fails
    return {
      blob: file,
      fileName: file.name,
      mimeType: file.type,
    };
  }
}

/**
 * Get a preview URL for an image file (used for local preview before upload)
 */
export function getImagePreview(file: File): string | null {
  if (!file.type.startsWith('image/')) {
    return null;
  }
  return URL.createObjectURL(file);
}

/**
 * Revoke a preview URL to free memory
 */
export function revokeImagePreview(url: string): void {
  URL.revokeObjectURL(url);
}
