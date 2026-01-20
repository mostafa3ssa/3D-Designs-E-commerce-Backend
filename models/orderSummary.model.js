import mongoose from "mongoose";

const orderSummarySchema = new mongoose.Schema({
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Order'
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Product'
    },
    quantity: {
        type: Number,
        default: 1
    }
});

const OrderSummary = mongoose.model("OrderSummary", orderSummarySchema);

export default OrderSummary;