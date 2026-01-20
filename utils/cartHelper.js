import Cart from "../models/cart.model.js";
import { v4 as uuidv4 } from 'uuid';

export const getCartData = async (query) => {
    const cartItems = await Cart.find(query).populate('productId');

    console.log();
    
    let subtotal = 0;
    cartItems.forEach(item => {
        if (item.productId && item.productId.price) {
            subtotal += item.quantity * item.productId.price;
        }
    });

    return { items: cartItems, subtotal };
};

export const getIdentifier = (req, res) => {
    if (req.user) {
        console.log("User is registerd");
        return { userId: req.user._id };
    }

    let guestId = req.cookies.guestId;
    if (!guestId) {
        console.log("guest user is registerd");
        guestId = uuidv4();
        res.cookie('guestId', guestId, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 30 * 24 * 60 * 60 * 1000, 
        });
    }
    return { guestId: guestId };
};