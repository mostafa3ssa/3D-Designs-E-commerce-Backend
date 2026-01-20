import multer from 'multer';
import path from 'path';

const storage = multer.memoryStorage();

const productFileFilter = (req, file, cb) => {
  if (file.fieldname === 'images') {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid image type. Only JPEG, PNG, etc. are allowed.'), false);
    }
  } else if (file.fieldname === 'stlFiles') {
    const fileExt = path.extname(file.originalname).toLowerCase();
    if (fileExt === '.stl') {
      cb(null, true);
    } else {
      cb(new Error('Invalid STL file. Only .stl files are allowed.'), false);
    }
  } else {
    cb(new Error('Invalid field name for file upload.'), false);
  }
};

const imageUpload = multer({
  storage: storage,
  fileFilter: productFileFilter,
  limits: {
    fileSize: 1024 * 1024 * 100
  }
}).fields([
  { name: 'images', maxCount: 5 },
  { name: 'stlFiles', maxCount: 10 }
]);

export default imageUpload;

