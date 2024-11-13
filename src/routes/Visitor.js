import express from "express";
import { processImage, uploadSingleImage } from "../middleware/uploadImage.js";
import { addVisitor, createVisitorLog, deleteVisitor, getVisitorLogs, getVisitors } from "../controllers/mutation/visitor.mutation.js";
import { adminAuth } from "../middleware/adminAuth.js";

const visitorRouter = express.Router();

visitorRouter.post('/create', uploadSingleImage, processImage, addVisitor);
visitorRouter.post('/log', createVisitorLog);

visitorRouter.delete('/delete/:id', adminAuth, deleteVisitor)

visitorRouter.get('/visitors', getVisitors)

visitorRouter.get('/logs', getVisitorLogs)


export default visitorRouter;