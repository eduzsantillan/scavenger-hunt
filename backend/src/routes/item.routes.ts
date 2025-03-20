import { Router } from "express";
import { ItemController } from "../controllers/item.controller";
import { param } from "express-validator";
import { validateRequest } from "../middleware/validate-request";

const router = Router();
const itemController = new ItemController();

router.get(
  "/:themeId",
  [param("themeId").isString().notEmpty()],
  validateRequest,
  itemController.getItemsByThemeId
);

export default router;
