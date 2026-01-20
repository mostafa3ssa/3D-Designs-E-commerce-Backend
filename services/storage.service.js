import { S3Client, PutObjectCommand, DeleteObjectsCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();

const r2Client = new S3Client({
  region: "auto",
  endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET_NAME;

export const uploadFilesToStorage = async (files, folderName) => {
  if (!BUCKET_NAME) {
    throw new Error("Cloudflare R2 bucket name is not set in .env file!");
  }

  const uploadedFileResults = [];

  for (const file of files) {
    const uniqueFileName = `${uuidv4()}-${file.originalname.replace(/\s+/g, '-')}`;
    
    const filePath = `${folderName}/${uniqueFileName}`;

    const params = {
      Bucket: BUCKET_NAME,
      Key: filePath,
      Body: file.buffer,
      ContentType: file.mimetype || 'application/octet-stream',
    };

    try {
      await r2Client.send(new PutObjectCommand(params));
      console.log(`[Storage Service] Successfully uploaded ${file.originalname} to ${filePath}`);
      uploadedFileResults.push({
        fileName: uniqueFileName,
        originalName: file.originalname,
        storagePath: filePath, 
      });
    } catch (error) {
      console.error(`[Storage Service] Error uploading ${file.originalname}:`, error);
      throw new Error(`Failed to upload ${file.originalname}. ${error.message}`);
    }
  }
  return uploadedFileResults;
};

export const deleteFolderFromStorage = async (folderName) => {
  if (!BUCKET_NAME) {
    throw new Error("Cloudflare R2 bucket name is not set in .env file!");
  }
  if (!folderName) {
    console.warn("[Storage Service] No folderName provided to delete.");
    return;
  }

  const listParams = {
    Bucket: BUCKET_NAME,
    Prefix: `${folderName}/`
  };

  try {
    const listedObjects = await r2Client.send(new ListObjectsV2Command(listParams));

    if (!listedObjects.Contents || listedObjects.Contents.length === 0) {
      console.log(`[Storage Service] No files found in folder '${folderName}'. Nothing to delete.`);
      return;
    }

    const deleteParams = {
      Bucket: BUCKET_NAME,
      Delete: {
        Objects: listedObjects.Contents.map(({ Key }) => ({ Key })),
      },
    };

    await r2Client.send(new DeleteObjectsCommand(deleteParams));
    console.log(`[Storage Service] Successfully deleted ${deleteParams.Delete.Objects.length} files from folder '${folderName}'.`);

  } catch (error) {
    console.error(`[Storage Service] Error deleting folder ${folderName}:`, error);
    throw new Error(`Failed to delete folder ${folderName} from storage. ${error.message}`);
  }
};

