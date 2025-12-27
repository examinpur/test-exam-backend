import AdmZip from 'adm-zip';
import path from 'path';
import { uploadImagesInBatch, CloudinaryImage } from './cloudinaryHelper';
import logger from '../../../utils/logger';

const SUPPORTED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

/**
 * Extract images from a zip file buffer
 */
export const extractImagesFromZip = (zipBuffer: Buffer): Map<string, Buffer> => {
  const images = new Map<string, Buffer>();
  
  try {
    const zip = new AdmZip(zipBuffer);
    const entries = zip.getEntries();
    
    for (const entry of entries) {
      if (entry.isDirectory) continue;
      
      const ext = path.extname(entry.entryName).toLowerCase();
      if (!SUPPORTED_EXTENSIONS.includes(ext)) continue;
      
      // Get filename without extension as the key (e.g., "1122" from "1122.png")
      const baseName = path.basename(entry.entryName, ext);
      const buffer = entry.getData();
      
      images.set(baseName, buffer);
    }
  } catch (error: any) {
    logger.error(`Error extracting zip: ${error?.message}`);
  }
  
  return images;
};

/**
 * Process zip file and upload all images to Cloudinary
 * Returns a map of image name -> CloudinaryImage data
 */
export const processAndUploadImages = async (
  zipBuffer: Buffer,
  folder: string = 'question-images',
): Promise<Map<string, CloudinaryImage>> => {
  const extractedImages = extractImagesFromZip(zipBuffer);
  
  if (extractedImages.size === 0) {
    return new Map();
  }
  
  const imagesToUpload = Array.from(extractedImages.entries()).map(([name, buffer]) => ({
    name,
    buffer,
  }));
  
  logger.info(`Uploading ${imagesToUpload.length} images to Cloudinary...`);
  
  const uploadedImages = await uploadImagesInBatch(imagesToUpload, folder);
  
  logger.info(`Successfully uploaded ${uploadedImages.size} images`);
  
  return uploadedImages;
};

export const mapImageIdsToCloudinary = (
  imageIds: string[],
  uploadedImages: Map<string, CloudinaryImage> | undefined,
): CloudinaryImage[] => {
  if (!uploadedImages || !imageIds || imageIds.length === 0) {
    return [];
  }
  
  const result: CloudinaryImage[] = [];
  
  for (const id of imageIds) {
    const imageData = uploadedImages.get(id);
    if (imageData) {
      result.push(imageData);
    }
  }
  
  return result;
};

export default {
  extractImagesFromZip,
  processAndUploadImages,
  mapImageIdsToCloudinary,
};

