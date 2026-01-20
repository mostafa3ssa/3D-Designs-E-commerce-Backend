import { Router } from "express";
import { addToCart, getCartProducts, updateQuanitity, deleteFromCart, clearCart } from "../controllers/cart.controller.js";
import { optionalAuthMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(optionalAuthMiddleware);

router.post("/", addToCart);
router.get("/", getCartProducts);
router.put("/update", updateQuanitity);
router.delete("/:productId", deleteFromCart);
router.delete("/", clearCart);

export default router;