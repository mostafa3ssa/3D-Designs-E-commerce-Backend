import { Router } from "express";
import { authMiddleware, optionalAuthMiddleware } from "../middlewares/auth.middleware";
import { createOrder, viewOrderDetails, viewOrders } from "../controllers/order.controller";

const router = Router();

router.use(authMiddleware);

router.get("/", authMiddleware, viewOrders);
router.get("/:orderId", authMiddleware, viewOrderDetails);
router.get("/create", optionalAuthMiddleware, createOrder);

export default router;