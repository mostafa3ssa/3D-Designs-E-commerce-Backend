import Cart from '../models/cart.model.js';
import Product from '../models/product.model.js';
import { v4 as uuidv4 } from 'uuid';
import { deleteFolderFromStorage } from '../services/storage.service.js';
import { getCartData, getIdentifier } from '../utils/cartHelper.js';



export const addToCart = async (req, res) => {
    const { productId, quantity } = req.body;
    const query = getIdentifier(req, res);

    console.log("Query is", query);
    
    try {
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found.' });
        }

        const existingItem = await Cart.findOne({ ...query, productId });

        if (existingItem) {
            existingItem.quantity += parseInt(quantity, 10) || 1;
            await existingItem.save();
        } else {
            await Cart.create({
                ...query,
                productId,
                quantity: parseInt(quantity, 10) || 1
            });
        }
        
        const cart = await getCartData(query);
        res.status(200).json({ message: 'Item added to cart.', cart });

    } catch (error) {
        console.error("[Add To Cart Error]", error);
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
};

export const getCartProducts = async (req, res) => {
    try {        
        const query = getIdentifier(req, res);
        console.log("Query is", query);
        const cart = await getCartData(query);
        res.status(200).json(cart);
    } catch (error) {
        console.error("[Get Cart Error]", error);
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
};

export const updateQuanitity = async (req, res) => {
    const { productId, quantity } = req.body;
    const query = getIdentifier(req, res);

    try {
        if (!quantity || quantity < 1) {
            return res.status(400).json({ message: "Quantity must be at least 1." });
        }

        const updatedItem = await Cart.findOneAndUpdate(
            { ...query, productId },
            { quantity: parseInt(quantity, 10) },
            { new: true } 
        );

        if (!updatedItem) {
            return res.status(404).json({ message: "Item not found in cart." });
        }
        
        const cart = await getCartData(query);
        res.status(200).json({ message: 'Cart updated.', cart });

    } catch (error) {
        console.error("[Update Quantity Error]", error);
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
};

export const deleteFromCart = async (req, res) => {
    const { productId } = req.params;
    const query = getIdentifier(req, res);

    try {
        const deletedItem = await Cart.findOneAndDelete({ ...query, productId });
        
        if (!deletedItem) {
            return res.status(404).json({ message: "Item not found in cart." });
        }

        const product = await Product.findById(deletedItem.productId);

        if(product && product.type === "Custom") {
            await deleteFolderFromStorage(product.storageLink);
        }

        const cart = await getCartData(query);
        res.status(200).json({ message: 'Item removed from cart.', cart });

    } catch (error) {
        console.error("[Delete From Cart Error]", error);
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
};


export const clearCart = async (req, res) => {
    try {
        const query = getIdentifier(req, res);
        const deletedItems = await Cart.deleteMany({ ...query });

        if(!deletedItems) {
            return res.status(404).json({ message: "Cart is empty." });
        }

        res.status(200).json({ message: "Cart is cleared successfully." });

    } catch(error) {
        onsole.error("[Clear Cart Error]", error);
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
}
