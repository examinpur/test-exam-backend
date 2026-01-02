import { Router } from "express";
import paperController from "../controller/paperController";
import { paperBulkUploadMemory } from "../helper";

const router = Router();

router.post("/", paperController.createPaper);

router.put("/:id", paperController.updatePaper);

router.get("/", paperController.getPapers);

router.get("/:id", paperController.getPaper);

router.delete("/:id", paperController.deletePaper);

router.post("/bulk", paperBulkUploadMemory.fields([
    { name: "data", maxCount: 1 },       
    { name: "imagesZip", maxCount: 1 },  
  ]),
  paperController.bulkUploadPapers,
);

export default router;
