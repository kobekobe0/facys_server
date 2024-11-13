import express from "express";
import { processImage, uploadSingleImage } from "../middleware/uploadImage.js";
import { addVisitor, createVisitorLog } from "../controllers/mutation/visitor.mutation.js";

const visitorRouter = express.Router();

visitorRouter.post('/create', uploadSingleImage, processImage, addVisitor);
visitorRouter.post('/log', createVisitorLog);


export default visitorRouter;