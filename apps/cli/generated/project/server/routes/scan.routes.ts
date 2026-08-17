import { Router } from "express";
import { uploadResume, analyzeResume, getScanHistory } from "../controllers/scan.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import multer from "multer";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/upload", authMiddleware, upload.single("file"), uploadResume);
router.post("/analyze", authMiddleware, analyzeResume);
router.get("/history", authMiddleware, getScanHistory);

export default router;
