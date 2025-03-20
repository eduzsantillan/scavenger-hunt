import { Router } from "express";
import { SeedController } from "../controllers/seed.controller";

const router = Router();
const seedController = new SeedController();

router.post("/", seedController.seedData);

export default router;
