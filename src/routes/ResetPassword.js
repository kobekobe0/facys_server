import express from "express";
import { createResetPassword, resetPassword } from "../controllers/mutation/resetpassword.mutation.js";


const resetPasswordRouter = express.Router();

resetPasswordRouter.post('/create', createResetPassword)
resetPasswordRouter.post('/renew/:resetPasswordId', resetPassword)

export default resetPasswordRouter;