import express from "express";
import { blockStudent, createStudent, deleteStudent, detectFace, unblockStudent, updateStudent } from "../controllers/mutation/student.mutation.js";
import { getStudent, verifyJWT, getStudents, loginStudent, getSelf } from "../controllers/query/student.query.js";
import parseCOR from "../middleware/parseCOR.js";
import { processImage, uploadSingleImage } from "../middleware/uploadImage.js";
import { studentAuth } from "../middleware/studentAuth.js";
import {adminAuth} from "../middleware/adminAuth.js";

const studentRouter = express.Router();

//add auth here to verify the token

studentRouter.post('/login', loginStudent)
studentRouter.post('/verify', verifyJWT)
studentRouter.post('/create', uploadSingleImage, processImage, createStudent)
studentRouter.put('/update/:id', updateStudent)
studentRouter.delete('/delete/:id', adminAuth, deleteStudent)
studentRouter.get('/all', getStudents)
studentRouter.get('/student/:id', getStudent)
studentRouter.get('/self', studentAuth, getSelf)

studentRouter.post('/cor', parseCOR)


studentRouter.post('/detect', detectFace)
studentRouter.put('/block/:id', blockStudent)
studentRouter.put('/unblock/:id', unblockStudent)

export default studentRouter;