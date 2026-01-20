import multer from 'multer';
import path from 'path';

const stlFileFilter = (req, file, cb) => {
    console.log(`[Debug Multer] Original Filename: ${file.originalname}`);
    const fileExt = path.extname(file.originalname).toLowerCase();
    console.log(`[Debug Multer] File Extension: ${fileExt}`);
    
    cb(null, true);
};

const storage = multer.memoryStorage();

export const stlUpload = multer({
    storage: storage,
    fileFilter: stlFileFilter,
    limits: { fileSize: 100 * 1024 * 1024 } 
});

