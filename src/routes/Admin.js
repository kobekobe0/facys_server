import express from "express";
import { loginAdmin, verifyJWT } from "../controllers/query/admin.query.js";

const adminRouter = express.Router();

adminRouter.post('/login', loginAdmin)
adminRouter.post('/verify', verifyJWT)



export default adminRouter;