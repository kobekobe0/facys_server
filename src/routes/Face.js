import express from 'express';
import { queryFace } from '../controllers/query/face.query.js';

const faceRouter = express.Router();

faceRouter.post("/scan", queryFace)

export default faceRouter;