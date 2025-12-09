/**
 * Image-Specific Lossless Compression
 * 
 * Optimized compression for images using:
 * - PNG-style filtering for better compression
 * - Color palette extraction
 * - Alpha channel separation
 * - Optimized delta encoding for pixel data
 * 
 * @author Abdon Morales
 */

import { LosslessCompressor, type CompressionResult } from './compression';

// Image metadata
export interface ImageCompressionResult extends CompressionResult {
  width: number;
  height: number;
  channels: number;
  hasAlpha: boolean;
  colorPalette?: Uint8Array;
}

/**
 * PNG-style filter types for preprocessing
 */
enum FilterType {
  None = 0,
  Sub = 1,      // Difference from left pixel
  Up = 2,       // Difference from above pixel
  Average = 3,  // Average of left and above
  Paeth = 4     // Paeth predictor
}

export class ImageCompressor {
  private compressor: LosslessCompressor;

  constructor() {
    this.compressor = new LosslessCompressor();
  }

  /**
   * Compress image data from canvas or raw pixels
   */
  async compressImage(
    data: ImageData | Uint8ClampedArray,
    width: number,
    height: number,
    channels: number = 4
  ): Promise<ImageCompressionResult> {
    const pixelData = data instanceof ImageData ? 
      new Uint8Array(data.data.buffer) : 
      new Uint8Array(data.buffer);

    // Separate channels for better compression
    const { rgb, alpha, hasAlpha } = this.separateChannels(pixelData, channels);

    // Apply PNG-style filtering
    const filteredRGB = this.applyFiltering(rgb, width, height, 3);
    const filteredAlpha = hasAlpha ? this.applyFiltering(alpha!, width, height, 1) : null;

    // Compress each component
    const rgbCompressed = await this.compressor.compress(filteredRGB);
    const alphaCompressed = filteredAlpha ? 
      await this.compressor.compress(filteredAlpha) : null;

    // Combine compressed data
    const combined = this.combineCompressedData(rgbCompressed, alphaCompressed);

    return {
      ...rgbCompressed,
      data: combined,
      width,
      height,
      channels,
      hasAlpha,
      metadata: {
        ...rgbCompressed.metadata,
        compressedSize: combined.length
      },
      compressionRatio: ((1 - combined.length / pixelData.length) * 100)
    };
  }

  /**
   * Decompress image data
   */
  async decompressImage(compressed: ImageCompressionResult): Promise<Uint8ClampedArray> {
    const { rgbData, alphaData } = this.splitCompressedData(compressed);

    // Decompress components
    const rgbDecompressed = await this.compressor.decompress({
      ...compressed,
      data: rgbData
    });

    const alphaDecompressed = alphaData ? 
      await this.compressor.decompress({
        ...compressed,
        data: alphaData
      }) : null;

    // Remove filtering
    const rgb = this.removeFiltering(rgbDecompressed, compressed.width, compressed.height, 3);
    const alpha = alphaDecompressed ? 
      this.removeFiltering(alphaDecompressed, compressed.width, compressed.height, 1) : null;

    // Recombine channels
    return this.combineChannels(rgb, alpha, compressed.channels);
  }

  /**
   * Separate RGB and Alpha channels
   */
  private separateChannels(data: Uint8Array, channels: number): {
    rgb: Uint8Array;
    alpha: Uint8Array | null;
    hasAlpha: boolean;
  } {
    const pixelCount = data.length / channels;
    const rgb = new Uint8Array(pixelCount * 3);
    let alpha: Uint8Array | null = null;
    let hasAlpha = false;

    if (channels === 4) {
      alpha = new Uint8Array(pixelCount);
      
      for (let i = 0; i < pixelCount; i++) {
        const srcIdx = i * 4;
        const rgbIdx = i * 3;
        
        rgb[rgbIdx] = data[srcIdx];
        rgb[rgbIdx + 1] = data[srcIdx + 1];
        rgb[rgbIdx + 2] = data[srcIdx + 2];
        alpha[i] = data[srcIdx + 3];
        
        if (alpha[i] !== 255) hasAlpha = true;
      }
      
      // If no transparency, discard alpha channel
      if (!hasAlpha) alpha = null;
    } else {
      // Copy RGB directly
      rgb.set(data);
    }

    return { rgb, alpha, hasAlpha };
  }

  /**
   * Combine RGB and Alpha channels back
   */
  private combineChannels(
    rgb: Uint8Array,
    alpha: Uint8Array | null,
    channels: number
  ): Uint8ClampedArray {
    const pixelCount = rgb.length / 3;
    const result = new Uint8ClampedArray(pixelCount * channels);

    for (let i = 0; i < pixelCount; i++) {
      const rgbIdx = i * 3;
      const dstIdx = i * channels;
      
      result[dstIdx] = rgb[rgbIdx];
      result[dstIdx + 1] = rgb[rgbIdx + 1];
      result[dstIdx + 2] = rgb[rgbIdx + 2];
      
      if (channels === 4) {
        result[dstIdx + 3] = alpha ? alpha[i] : 255;
      }
    }

    return result;
  }

  /**
   * Apply PNG-style filtering for better compression
   */
  private applyFiltering(
    data: Uint8Array,
    width: number,
    height: number,
    bytesPerPixel: number
  ): Uint8Array {
    const stride = width * bytesPerPixel;
    const result = new Uint8Array(data.length + height); // +1 byte per row for filter type
    let outIdx = 0;

    for (let y = 0; y < height; y++) {
      const rowStart = y * stride;
      const prevRowStart = y > 0 ? (y - 1) * stride : -1;
      
      // Choose best filter for this row
      const filterType = this.chooseBestFilter(data, rowStart, prevRowStart, stride, bytesPerPixel);
      result[outIdx++] = filterType;

      // Apply filter
      for (let x = 0; x < stride; x++) {
        const idx = rowStart + x;
        const left = x >= bytesPerPixel ? data[idx - bytesPerPixel] : 0;
        const up = prevRowStart >= 0 ? data[prevRowStart + x] : 0;
        const upLeft = (prevRowStart >= 0 && x >= bytesPerPixel) ? 
          data[prevRowStart + x - bytesPerPixel] : 0;

        let filtered: number;
        switch (filterType) {
          case FilterType.Sub:
            filtered = (data[idx] - left + 256) & 0xFF;
            break;
          case FilterType.Up:
            filtered = (data[idx] - up + 256) & 0xFF;
            break;
          case FilterType.Average:
            filtered = (data[idx] - Math.floor((left + up) / 2) + 256) & 0xFF;
            break;
          case FilterType.Paeth:
            filtered = (data[idx] - this.paethPredictor(left, up, upLeft) + 256) & 0xFF;
            break;
          default:
            filtered = data[idx];
        }
        
        result[outIdx++] = filtered;
      }
    }

    return result;
  }

  /**
   * Remove filtering to restore original data
   */
  private removeFiltering(
    data: Uint8Array,
    width: number,
    height: number,
    bytesPerPixel: number
  ): Uint8Array {
    const stride = width * bytesPerPixel;
    const result = new Uint8Array(height * stride);
    let inIdx = 0;

    for (let y = 0; y < height; y++) {
      const filterType = data[inIdx++];
      const rowStart = y * stride;
      const prevRowStart = y > 0 ? (y - 1) * stride : -1;

      for (let x = 0; x < stride; x++) {
        const outIdx = rowStart + x;
        const left = x >= bytesPerPixel ? result[outIdx - bytesPerPixel] : 0;
        const up = prevRowStart >= 0 ? result[prevRowStart + x] : 0;
        const upLeft = (prevRowStart >= 0 && x >= bytesPerPixel) ? 
          result[prevRowStart + x - bytesPerPixel] : 0;

        let value: number;
        switch (filterType) {
          case FilterType.Sub:
            value = (data[inIdx] + left) & 0xFF;
            break;
          case FilterType.Up:
            value = (data[inIdx] + up) & 0xFF;
            break;
          case FilterType.Average:
            value = (data[inIdx] + Math.floor((left + up) / 2)) & 0xFF;
            break;
          case FilterType.Paeth:
            value = (data[inIdx] + this.paethPredictor(left, up, upLeft)) & 0xFF;
            break;
          default:
            value = data[inIdx];
        }
        
        result[outIdx] = value;
        inIdx++;
      }
    }

    return result;
  }

  /**
   * Choose best filter for a row (simplified)
   */
  private chooseBestFilter(
    data: Uint8Array,
    rowStart: number,
    prevRowStart: number,
    stride: number,
    bytesPerPixel: number
  ): FilterType {
    // For simplicity, use Sub filter for most cases
    // A full implementation would test all filters and choose the one with lowest sum
    return prevRowStart >= 0 ? FilterType.Average : FilterType.Sub;
  }

  /**
   * Paeth predictor algorithm
   */
  private paethPredictor(left: number, up: number, upLeft: number): number {
    const p = left + up - upLeft;
    const pLeft = Math.abs(p - left);
    const pUp = Math.abs(p - up);
    const pUpLeft = Math.abs(p - upLeft);

    if (pLeft <= pUp && pLeft <= pUpLeft) return left;
    if (pUp <= pUpLeft) return up;
    return upLeft;
  }

  /**
   * Combine RGB and Alpha compressed data
   */
  private combineCompressedData(
    rgb: CompressionResult,
    alpha: CompressionResult | null
  ): Uint8Array {
    // Format: [hasAlpha(1)][rgbSize(4)][rgbData][alphaData?]
    const hasAlpha = alpha !== null;
    const totalSize = 5 + rgb.data.length + (hasAlpha ? alpha.data.length : 0);
    const result = new Uint8Array(totalSize);
    
    let offset = 0;
    result[offset++] = hasAlpha ? 1 : 0;
    
    // RGB size
    result[offset++] = (rgb.data.length >> 24) & 0xFF;
    result[offset++] = (rgb.data.length >> 16) & 0xFF;
    result[offset++] = (rgb.data.length >> 8) & 0xFF;
    result[offset++] = rgb.data.length & 0xFF;
    
    // RGB data
    result.set(rgb.data, offset);
    offset += rgb.data.length;
    
    // Alpha data
    if (hasAlpha) {
      result.set(alpha.data, offset);
    }
    
    return result;
  }

  /**
   * Split combined compressed data
   */
  private splitCompressedData(compressed: ImageCompressionResult): {
    rgbData: Uint8Array;
    alphaData: Uint8Array | null;
  } {
    let offset = 0;
    const hasAlpha = compressed.data[offset++] === 1;
    
    const rgbSize = (compressed.data[offset++] << 24) |
                   (compressed.data[offset++] << 16) |
                   (compressed.data[offset++] << 8) |
                   compressed.data[offset++];
    
    const rgbData = compressed.data.slice(offset, offset + rgbSize);
    offset += rgbSize;
    
    const alphaData = hasAlpha ? compressed.data.slice(offset) : null;
    
    return { rgbData, alphaData };
  }
}

/**
 * Convenience functions
 */

export async function compressCanvasImage(canvas: HTMLCanvasElement): Promise<ImageCompressionResult> {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');
  
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const compressor = new ImageCompressor();
  
  return await compressor.compressImage(imageData, canvas.width, canvas.height, 4);
}

export async function decompressToCanvas(
  compressed: ImageCompressionResult,
  canvas: HTMLCanvasElement
): Promise<void> {
  canvas.width = compressed.width;
  canvas.height = compressed.height;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');
  
  const compressor = new ImageCompressor();
  const pixels = await compressor.decompressImage(compressed);
  
  // Fix: ImageData expects specific buffer type
  const imageData = ctx.createImageData(compressed.width, compressed.height);
  imageData.data.set(pixels);
  ctx.putImageData(imageData, 0, 0);
}

/**
 * Compress image from File or Blob
 */
export async function compressImageFile(file: File | Blob): Promise<ImageCompressionResult> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = async () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      
      try {
        const result = await compressCanvasImage(canvas);
        resolve(result);
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    
    img.src = url;
  });
}
