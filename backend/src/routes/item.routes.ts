import { Router } from "express";
import { ItemController } from "../controllers/item.controller";
import { param } from "express-validator";
import { validateRequest } from "../middleware/validate-request";

const router = Router();
const itemController = new ItemController();

router.get(
  "/:itemId",
  [param("itemId").isString().notEmpty()],
  validateRequest,
  itemController.getItemById
);

export default router;
