import { v2 as cloudinary } from 'cloudinary';
import logger from '../../../utils/logger';
import env from '../../../config/env';

// Configure cloudinary
cloudinary.config({
  cloud_name: env.cloudinary.cloudName,
  api_key: env.cloudinary.apiKey,
  api_secret: env.cloudinary.apiSecret,
});

export interface CloudinaryImage {
  publicId: string;
  version: number;
  width: number;
  height: number;
  alt: string;
}

export interface UploadResult {
  success: boolean;
  data?: CloudinaryImage;
  error?: string;
}

/**
 * Upload a single image buffer to Cloudinary
 */
export const uploadImageBuffer = async (
  buffer: Buffer,
  folder: string = 'question-images',
  fileName?: string,
): Promise<UploadResult> => {
  try {
    const result = await new Promise<any>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          public_id: fileName,
          resource_type: 'image',
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        },
      );
      uploadStream.end(buffer);
    });

    return {
      success: true,
      data: {
        publicId: result.public_id,
        version: result.version,
        width: result.width,
        height: result.height,
        alt: '',
      },
    };
  } catch (error: any) {
    logger.error(`Cloudinary upload error: ${error?.message}`);
    return {
      success: false,
      error: error?.message || 'Failed to upload image',
    };
  }
};

/**
 * Upload multiple images in parallel with concurrency control
 */
export const uploadImagesInBatch = async (
  images: Array<{ name: string; buffer: Buffer }>,
  folder: string = 'question-images',
  concurrency: number = 5,
): Promise<Map<string, CloudinaryImage>> => {
  const results = new Map<string, CloudinaryImage>();
  
  // Process in batches
  for (let i = 0; i < images.length; i += concurrency) {
    const batch = images.slice(i, i + concurrency);
    const uploadPromises = batch.map(async (img) => {
      const result = await uploadImageBuffer(img.buffer, folder, img.name);
      if (result.success && result.data) {
        results.set(img.name, result.data);
      }
      return { name: img.name, result };
    });
    
    await Promise.all(uploadPromises);
  }
  
  return results;
};

/**
 * Generate Cloudinary URL from stored image data
 */
export const generateImageUrl = (
  image: CloudinaryImage,
  width: number = 720,
): string => {
  const cloud = env.cloudinary.cloudName;
  return `https://res.cloudinary.com/${cloud}/image/upload/f_auto,q_auto,w_${width}/v${image.version}/${image.publicId}`;
};

/**
 * Transform image data to include URL for response
 */
export const transformImageForResponse = (
  image: CloudinaryImage,
  width: number = 720,
): CloudinaryImage & { url: string } => {
  return {
    ...image,
    url: generateImageUrl(image, width),
  };
};

/**
 * Transform array of images for response
 */
export const transformImagesForResponse = (
  images: CloudinaryImage[],
  width: number = 720,
): Array<CloudinaryImage & { url: string }> => {
  return images.map((img) => transformImageForResponse(img, width));
};

export default {
  uploadImageBuffer,
  uploadImagesInBatch,
  generateImageUrl,
  transformImageForResponse,
  transformImagesForResponse,
};

