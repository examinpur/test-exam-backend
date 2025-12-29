import { uploadImageBuffer } from "../modules/question/helper/cloudinaryHelper";
import fs from "fs/promises";



export const uploading = async (file : any) =>{
    
        if (file) {
          const anyFile = file as any;
    
          const buffer = file.buffer
            ? file.buffer
            : anyFile.path
              ? await fs.readFile(anyFile.path)
              : null;
    
          if (!buffer) {
            return {
              success: false,
              statusCode: 500,
              message: "No buffer/path found from multer file.",
            };
          }
    
          const publicId = (file.originalname || "board").replace(/\.[^/.]+$/, "");
    
          const upload = await uploadImageBuffer(buffer, "board-images", publicId);
    
          if (!upload.success) {
            return {
              success: false,
              statusCode: 500,
              message: "Failed to upload board image",
              error: upload.error,
            };
          }
    
        return upload.data ?? null;
        }
}