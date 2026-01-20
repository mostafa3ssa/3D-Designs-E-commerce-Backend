import Order from "../models/order.model.js";
import OrderSummary from "../models/orderSummary.model.js";
import Product from "../models/product.model.js";
import { calculateShippingRate } from "../services/aramex.service.js";
import { getCartData, getIdentifier } from '../utils/cartHelper.js';


export const createOrder = async (req, res) => {
    try {
        const { shippingAddress, billingAddress, email } = req.body;
    
        if (!shippingAddress || !billingAddress) {
            return res.status(400).json({ message: 'Shipping and billing addresses are required.' });
        }
        
        if (!shippingAddress.city || !shippingAddress.country) {
            return res.status(400).json({ message: 'Shipping address must include City and Country Code (e.g., "EG").' });
        }

        const query = getIdentifier(req, res);
        
        if (!req.user && !email) {
            return res.status(400).json({ message: 'Email is required for guest checkout.' });
        }

        const cart = await getCartData(query);

        if (cart.items.length === 0) {
            return res.status(400).json({ message: 'Your cart is empty.' });
        }

        const shippingPrice = await calculateShippingRate(shippingAddress, cart);
        const totalPrice = cart.subtotal + shippingPrice;

        const orderItems = cart.items.map(item => ({
            productId: item.productId._id,
            name: item.productId.name,
            quantity: item.quantity,
            price: item.productId.price,
            productType: item.productId.type,
            storagePaths: item.productId.storagePaths
        }));
        
        const order = new Order({
            user: req.user ? req.user._id : undefined,
            guestEmail: req.user ? undefined : email,
            orderItems: orderItems,
            shippingAddress,
            billingAddress,
            subtotal: cart.subtotal,
            shippingPrice,
            totalPrice,
            orderStatus: 'Pending'
        });

        const createdOrder = await order.save();
        
        res.status(200).json(createdOrder);

    } catch (error) {
        console.error('[Create Order Error]', error);
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
};

export const viewOrders = async (req, res) => {
    try {
        const userId = req.user._id;
        const orders = await Order.find({ userId: userId}).sort({ createdAt: -1 });

        if(!orders) {
            return res.status(404).json({ message: 'Order not found.' });
        }


        res.status(200).json(orders);
    } catch(error) {
        console.error("[View Orders Error]", error);
        res.status(500).json({ message: 'Server error while viewing orders.' });
    }
};


export const viewOrderDetails = async (req, res) => {
    try{
        const orderId = req.params.orderId;
        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({ message: 'Order not found.' });
        }

        if(req.user._id !== order.userId) {
            return res.status(401).json({ message: "Not authorized" });
        }

        const orderSummary = await OrderSummary.find({orderId: orderId});

        let items = [];

        for(let i = 0; i < orderSummary.length; ++i) {
            const productId = orderSummary[i].orderId;
            const product = await Product.findById(productId);
            items.push({
                itemId: productId,
                name: product.name,
                quantity: orderSummary[i].quantity,
                pricePerItem: product.price
            });
        }

        const totalPrice = order.total + order.shippingFees;

        res.status(200).json({
            orderId: orderId,
            orderDate: order.createdAt,
            totalPrice: totalPrice,
            status: order.status,
            items
        });

    } catch(error) {
        console.error("[View Order Details Error]", error);
        res.status(500).json({ message: 'Server error while viewing order details.' });
    }
};

