/**
 * Client-side image processing utilities for compressing and converting images before upload.
 * Uses native browser Canvas API - no external dependencies required.
 */

const MAX_IMAGE_SIZE = 800 // pixels
const JPEG_QUALITY = 0.6

/**
 * Process an image file: resize, convert to JPEG, and compress
 * @param file - Image file to process
 * @returns Base64 data URL of processed image
 */
export async function processImage(file: File): Promise<string> {
  const dataUrl = await fileToDataUrl(file)
  return resizeImage(dataUrl, MAX_IMAGE_SIZE, JPEG_QUALITY)
}

/**
 * Read a file as a data URL
 */
function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * Resize and compress an image using Canvas
 */
function resizeImage(
  dataUrl: string,
  maxSize: number,
  quality: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      // Calculate new dimensions maintaining aspect ratio
      let { width, height } = img
      if (width > maxSize || height > maxSize) {
        if (width > height) {
          height = (height / width) * maxSize
          width = maxSize
        } else {
          width = (width / height) * maxSize
          height = maxSize
        }
      }

      // Draw to canvas and export as JPEG
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Failed to get canvas context'))
        return
      }
      ctx.drawImage(img, 0, 0, width, height)

      // Convert to JPEG with compression
      const result = canvas.toDataURL('image/jpeg', quality)
      resolve(result)
    }
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = dataUrl
  })
}

/**
 * Get the size of a base64 data URL in bytes (approximate)
 */
export function getBase64Size(dataUrl: string): number {
  // Remove the data URL prefix to get just the base64 part
  const base64 = dataUrl.split(',')[1] || dataUrl
  // Base64 encodes 3 bytes as 4 characters
  return Math.ceil((base64.length * 3) / 4)
}
