import Product from '../models/product.model.js';
import { deleteFolderFromCloudinary, uploadToCloudinary } from '../config/cloudinary.config.js';
import { deleteFolderFromStorage, uploadFilesToStorage } from '../services/storage.service.js';
import { calculateTotalWeight } from '../services/stl.service.js';


const sanitizeForFolderName = (text) => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};


export const addProduct = async (req, res) => {
    const { name, price, description } = req.body;
    
    const images = req.files?.images;
    const stlFiles = req.files?.stlFiles;

    try {
        if (!name || !price || !description || !stlFiles || stlFiles.length === 0 || !images || images.length === 0) {
            return res.status(400).json({ message: 'All fields, including at least one STL file and one image, are required.' });
        }
        
        const folderName = sanitizeForFolderName(name);
        if (!folderName) {
            return res.status(400).json({ message: "Invalid product name, results in empty folder name." });
        }

        const cloudinaryUploadPromises = images.map(file => 
            uploadToCloudinary(file.buffer, `products/${folderName}`)
        );
        const cloudinaryResults = await Promise.all(cloudinaryUploadPromises);
        const imagesLinks = cloudinaryResults.map(result => result.secure_url);

        const r2UploadResults = await uploadFilesToStorage(stlFiles, folderName);
        if (!r2UploadResults || r2UploadResults.length === 0) {
            throw new Error('Failed to upload STL file(s) to R2.');
        }

        const fileBuffers = stlFiles.map(file => file.buffer);
        const estimatedWeightGrams = await calculateTotalWeight(fileBuffers);
        
        const newProduct = new Product({
            name,
            price: parseFloat(price),
            weight: estimatedWeightGrams,
            description: description,
            type: 'Pre-designed',
            storageLink: folderName,
            imagesLinks: imagesLinks,
        });

        const savedProduct = await newProduct.save();
        res.status(201).json({ message: "Product added successfully", product: savedProduct });

    } catch (error) {
        console.error("[Add Product Error]", error);
        if (error.code === 11000) {
            return res.status(400).json({ message: 'A product with this name already exists.' });
        }
        res.status(500).json({ message: 'Server error while adding product: ' + error.message });
    }
};


export const deleteProduct = async (req, res) =>{
    try {
        const productId = req.params.productId;
        const product = await Product.findById(productId);

        if(!product) {
            return res.status(400).json({ message: "Product not found." });
        }

        await Product.findByIdAndDelete(productId);

        const cloudinaryFolder = `products/${product.storageLink}`;

        await deleteFolderFromStorage(product.storageLink);
        await deleteFolderFromCloudinary(cloudinaryFolder);

        res.status(200).json({ message: "Product deleted successfully." });
    } catch(error) {
        console.error("[Delete Product Error]", error);
        res.status(500).json({ message: 'Server error while deleting product.' });  
    }
};

export const viewProduct = async (req, res) => {
    try {
        const productId = req.params.productId;
        const product = await Product.findById(productId);

        if(!product) {
            return res.status(400).json({ message: "Product not found." });
        }

        res.status(200).json(product);
    } catch(error) {
        console.error("[Get Product Error]", error);
        res.status(500).json({ message: 'Server error while fetching product.' });    
    }
};

export const getAllProducts = async (req, res) => {
    try {
        const products = await Product.find({ type: 'Pre-designed' });
        res.status(200).json(products);
    } catch (error) {
        console.error("[Get Products Error]", error);
        res.status(500).json({ message: 'Server error while fetching products.' });
    }
};
