import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export const uploadToCloudinary = (fileBuffer, folder) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }
        if (result) {
          resolve(result);
        } else {
          reject(new Error("Cloudinary upload failed for an unknown reason."));
        }
      }
    );
    streamifier.createReadStream(fileBuffer).pipe(uploadStream);
  });
};

export const deleteFolderFromCloudinary = async (folderName) => {
  if (!folderName) {
    console.warn("[Cloudinary] No folderName provided to delete.");
    return;
  }
  try {
    await cloudinary.api.delete_resources_by_prefix(folderName);
    await cloudinary.api.delete_folder(folderName);
    console.log(`[Cloudinary] Successfully deleted folder and its contents: ${folderName}`);
  } catch (error) {
    console.error(`[Cloudinary] Error deleting folder ${folderName}:`, error);
    throw new Error('Cloudinary folder deletion failed.');
  }
};

export default cloudinary;
