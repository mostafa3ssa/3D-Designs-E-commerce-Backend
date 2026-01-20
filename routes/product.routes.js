import { Router } from "express";
import { authMiddleware, isAdmin, optionalAuthMiddleware } from "../middlewares/auth.middleware.js";
import { addProduct, deleteProduct, getAllProducts, viewProduct } from "../controllers/product.controller.js";
import imageUpload from "../middlewares/imageUpload.middleware.js";

const router = Router();

router.use(optionalAuthMiddleware);

router.get("/", getAllProducts);
router.get("/:productId", viewProduct);
router.post("/", isAdmin, imageUpload, addProduct);
router.delete("/delete/:productId", isAdmin, deleteProduct);

export default router;