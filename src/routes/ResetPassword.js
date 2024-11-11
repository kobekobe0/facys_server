import express from "express";
import { adminCreateResetPassword, adminResetPassword, createResetPassword, resetPassword } from "../controllers/mutation/resetpassword.mutation.js";


const resetPasswordRouter = express.Router();

resetPasswordRouter.post('/create', createResetPassword)
resetPasswordRouter.post('/renew/:resetPasswordId', resetPassword)

resetPasswordRouter.post('/create-admin', adminCreateResetPassword)
resetPasswordRouter.post('/renew-admin/:resetPasswordId', adminResetPassword)


export default resetPasswordRouter;