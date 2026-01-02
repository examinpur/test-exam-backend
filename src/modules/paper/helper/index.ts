import multer from "multer";
import path from "path";

const memoryStorage = multer.memoryStorage();

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimeTypes = [
    "application/json",
    "text/plain",
    "application/zip",
    "application/x-zip-compressed",
  ];

  const allowedExtensions = [".json", ".txt", ".zip"];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedMimeTypes.includes(file.mimetype) || allowedExtensions.includes(ext)) cb(null, true);
  else cb(new Error("Only JSON/TXT and ZIP files are allowed"));
};

export const paperBulkUploadMemory = multer({
  storage: memoryStorage,
  fileFilter,
  limits: { fileSize: 200 * 1024 * 1024 }, // 200MB
});
