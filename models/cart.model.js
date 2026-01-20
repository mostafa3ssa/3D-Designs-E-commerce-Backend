import mongoose from "mongoose";

const cartSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        sparse: true
    },
    guestId: {
        type: String,
        index: true
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
}, { timestamps: true });

cartSchema.index({ userId: 1, productId: 1 }, { unique: true, partialFilterExpression: { userId: { $exists: true } } });
cartSchema.index({ guestId: 1, productId: 1 }, { unique: true, partialFilterExpression: { guestId: { $exists: true } } });


const Cart = mongoose.model("Cart", cartSchema);

export default Cart;