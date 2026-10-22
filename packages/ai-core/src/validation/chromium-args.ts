/**
 * Shared Chromium launch arguments for headless browser validation with SwiftShader WebGL support.
 */
export const CHROMIUM_ARGS: string[] = [
  "--no-sandbox",
  "--disable-setuid-sandbox",
  "--disable-dev-shm-usage",
  "--enable-webgl",
  "--use-angle=swiftshader",
  "--enable-unsafe-swiftshader",
  "--ignore-gpu-blocklist",
];

/**
 * Computes the pixel variance of an RGBA image buffer (e.g. 200x200 crop).
 * Returns true if variance is below the blank threshold (e.g., 1.0).
 */
export function isPixelBufferBlank(pixelData: Uint8Array | Uint8ClampedArray, threshold = 1.0): boolean {
  if (!pixelData || pixelData.length === 0) return true;
  let sum = 0;
  let sumSq = 0;
  const n = Math.floor(pixelData.length / 4);
  if (n === 0) return true;
  for (let i = 0; i < pixelData.length; i += 4) {
    const lum = 0.299 * pixelData[i] + 0.587 * pixelData[i + 1] + 0.114 * pixelData[i + 2];
    sum += lum;
    sumSq += lum * lum;
  }
  const mean = sum / n;
  const variance = (sumSq / n) - (mean * mean);
  return variance < threshold;
}

export default CHROMIUM_ARGS;
