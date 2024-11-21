import express from "express";
import { blockStudent, createStudent, deleteAccountPermanently, deleteOutdatedAccounts, deleteStudent, detectFace, restoreAccount, unblockStudent, updateEmail, updateFaceData, updateFaceDataByStudent, updateGuardianEmail, updatePassword, updatePasswordByAdmin, updateStudent } from "../controllers/mutation/student.mutation.js";
import { getStudent, verifyJWT, getStudents, loginStudent, getSelf, getOutdatedAccounts, getBlockedStudents, getOutdatedStudents, getDeletedAccounts } from "../controllers/query/student.query.js";
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
studentRouter.get('/blocked', getBlockedStudents)
studentRouter.get('/outdated', getOutdatedStudents)
studentRouter.get('/student/:id', getStudent)
studentRouter.get('/self', studentAuth, getSelf)

studentRouter.post('/cor', parseCOR)


studentRouter.post('/detect', detectFace)
studentRouter.put('/block/:id', adminAuth, blockStudent)
studentRouter.put('/unblock/:id', adminAuth, unblockStudent)

studentRouter.put('/password-by-admin/:id', adminAuth, updatePasswordByAdmin)

studentRouter.post('/update-face/:id', adminAuth, uploadSingleImage, processImage, updateFaceData)
studentRouter.post('/update-face-by-student/:id', uploadSingleImage, processImage, updateFaceDataByStudent)

studentRouter.get('/outdated', getOutdatedAccounts)
studentRouter.get('/deleted', getDeletedAccounts)
studentRouter.put('/delete-outdated', adminAuth, deleteOutdatedAccounts)
studentRouter.post('/delete-permanently', adminAuth, deleteAccountPermanently)
studentRouter.post('/restore-account', adminAuth, restoreAccount)

studentRouter.put('/email', studentAuth, updateEmail)
studentRouter.put('/guardian-email', studentAuth, updateGuardianEmail)
studentRouter.put('/password', studentAuth, updatePassword)

export default studentRouter;