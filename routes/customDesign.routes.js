import { Router } from 'express';
import { uploadCustomDesign } from '../controllers/customDesign.controller.js';
import { stlUpload } from '../config/multer.config.js';

const router = Router();

router.post(
    '/upload', 
    stlUpload.array('stlFiles', 10),
    uploadCustomDesign
);

export default router;