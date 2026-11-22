import type { Screenshot } from './model';
export const MAX_SCREENSHOT_BYTES = 2 * 1024 * 1024;
const types = ['image/png', 'image/jpeg', 'image/webp'];
export function validScreenshot(value: Screenshot): boolean {
  return typeof value.name === 'string' && typeof value.dataUrl === 'string'
    && /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(value.dataUrl)
    && value.dataUrl.length <= Math.ceil(MAX_SCREENSHOT_BYTES / 3) * 4 + 32;
}
export async function readScreenshot(file: File): Promise<Screenshot> {
  if (!types.includes(file.type)) throw new Error('Choose a PNG, JPEG or WebP image.');
  if (!file.size || file.size > MAX_SCREENSHOT_BYTES) throw new Error('Choose an image up to 2 MB.');
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('This image could not be read. Choose another image.'));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
  await new Promise<void>((resolve, reject) => {
    const img = new Image();
    img.onload = () => img.naturalWidth && img.naturalHeight ? resolve() : reject(new Error('Choose a valid image.'));
    img.onerror = () => reject(new Error('This image could not be read. Choose another image.'));
    img.src = dataUrl;
  });
  return { name: file.name, dataUrl };
}
