import multer from "multer";
import { Request } from "express";

export interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

const storage = multer.memoryStorage();
export const uploadMiddleware = multer({ storage });
export default uploadMiddleware;
