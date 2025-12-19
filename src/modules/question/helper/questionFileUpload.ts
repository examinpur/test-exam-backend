import fs from 'fs';
import path from 'path';
import multer from 'multer';

const uploadDir = path.resolve(process.cwd(), 'src/modules/question/uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, 'questions-' + uniqueSuffix + ext);
  },
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimeTypes = [
    'application/json',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/msword', // .doc
    'text/plain', // .txt
    'text/markdown', // .md
    'text/x-markdown', // .md
    'application/zip', // .zip
    'application/x-zip-compressed', // .zip (Windows)
  ];

  const allowedExtensions = ['.json', '.docx', '.doc', '.txt', '.zip', '.md'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedMimeTypes.includes(file.mimetype) || allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only JSON, DOCX, DOC, TXT, MD, or ZIP files are allowed'));
  }
};

const questionFileUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit for images
});

// Memory storage for zip files (to pass buffer directly)
const memoryStorage = multer.memoryStorage();

export const questionFileUploadMemory = multer({
  storage: memoryStorage,
  fileFilter,
  limits: { fileSize: 100 * 1024 * 1024 },
});

export default questionFileUpload;

