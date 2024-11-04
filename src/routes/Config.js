import express from 'express';
import { queryFace } from '../controllers/query/face.query.js';
import { adminAuth } from '../middleware/adminAuth.js';
import { addDepartment, getConfig, updateSY, removeDepartment, getUniqueDepartments } from '../controllers/mutation/config.mutation.js';

const configRouter = express.Router();

configRouter.post("/add-department", adminAuth, addDepartment)
configRouter.post("/delete-department", adminAuth, removeDepartment)

configRouter.post('/update-sy', adminAuth, updateSY)

configRouter.get('/', getConfig)

configRouter.get('/department', getUniqueDepartments)

export default configRouter;