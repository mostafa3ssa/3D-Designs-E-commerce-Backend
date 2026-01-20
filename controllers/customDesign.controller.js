import { calculateTotalWeight, calculatePrice } from '../services/stl.service.js';
import { uploadFilesToStorage } from '../services/storage.service.js';
import Product from '../models/product.model.js';

const sanitizeForFolderName = (text) => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') 
    .replace(/[\s-]+/g, '-') 
    .replace(/^-+|-+$/g, ''); 
};

export const uploadCustomDesign = async (req, res) => {
    try {

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: "No .stl files were uploaded or files are not .stl" });
        }
        const { customLabel, quantity } = req.body;
        const parsedQuantity = parseInt(quantity, 10);

        if (!customLabel || !parsedQuantity || parsedQuantity < 1) {
            return res.status(400).json({ message: "Invalid customLabel or quantity." });
        }

        const folderName = sanitizeForFolderName(customLabel);
        if (!folderName) {
            return res.status(400).json({ message: "Invalid customLabel, results in empty folder name." });
        }

        

        const fileBuffers = req.files.map(file => file.buffer);
        const estimatedWeightGrams = await calculateTotalWeight(fileBuffers);
        const estimatedPrice = calculatePrice(estimatedWeightGrams, 1);

        console.log(`Starting upload to R2 storage in folder: ${folderName}`);
        
        const storageFileResults = await uploadFilesToStorage(req.files, folderName);
        
        const newProduct = new Product({
            name: customLabel,
            type: 'Custom',
            price: estimatedPrice,
            weight: estimatedWeightGrams,
            description: "This is a custom design",
            storageLink: folderName,
            imagesLinks: []
        });

        const savedProduct = await newProduct.save();
        
        res.status(200).json({
            message: "Files uploaded and product created.",
            product: savedProduct,
            quantity: parsedQuantity,
            estimatedWeightGrams: estimatedWeightGrams,
            estimatedPrice: estimatedPrice
        });

    } catch (error) {
        console.error("File upload processing error:", error);
        
        if (error.code === 11000) {
            return res.status(400).json({ message: "A product with this name or storage link already exists. Please use the modified Product model." });
        }

        if (error.message === 'StlParseError') {
            return res.status(400).json({ message: "File processing failed. One or more .stl files may be corrupt." });
        }
        
        res.status(500).json({ message: error.message || "File processing failed. Please try again." });
    }
};

