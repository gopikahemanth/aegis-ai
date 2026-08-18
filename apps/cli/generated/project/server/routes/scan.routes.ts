import { Router } from "express";
import { analyzeScan, getScanHistory, uploadResume } from "../controllers/scan.controller";
import { uploadMiddleware } from "../middleware/upload.middleware";

export const router = Router();
router.post("/upload", uploadMiddleware.single("file"), uploadResume);
router.post("/analyze", analyzeScan);
router.get("/history", getScanHistory);

export default router;
