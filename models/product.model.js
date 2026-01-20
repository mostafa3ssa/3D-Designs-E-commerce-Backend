import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        required: true,
        enum: ['Pre-designed', 'Custom']
    },
    price: {
        type: Number,
        required: true
    },
    weight: {
        type: Number,
        required: true
    }
    ,
    description: {
        type: String,
    },
    storageLink: {
        type: String,
        required: true,
    },
    imagesLinks: [{
        type: String,
    }]

}, {timestamps: true});

const Product = mongoose.model("Product", productSchema);

export default Product;