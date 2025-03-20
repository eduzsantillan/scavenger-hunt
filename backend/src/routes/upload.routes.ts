import { Router } from "express";
import { UploadController } from "../controllers/upload.controller";
import { param } from "express-validator";
import { validateRequest } from "../middleware/validate-request";

const router = Router();
const uploadController = new UploadController();

router.post(
  "/:sessionId/:itemId",
  [
    param("sessionId").isString().notEmpty(),
    param("itemId").isString().notEmpty()
  ],
  validateRequest,
  uploadController.upload.single("image"),
  uploadController.uploadImage
);

export default router;
