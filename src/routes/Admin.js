import express from "express";
import { loginAdmin, verifyJWT } from "../controllers/query/admin.query.js";
import { adminAuth } from "../middleware/adminAuth.js";
import { changeAdminEmail, changeAdminPassword, getAdmin } from "../controllers/mutation/admin.mutation.js";

const adminRouter = express.Router();

adminRouter.post('/login', loginAdmin)
adminRouter.post('/verify', verifyJWT)

adminRouter.put('/email', adminAuth, changeAdminEmail)
adminRouter.put('/password', adminAuth, changeAdminPassword)

adminRouter.get('/me', adminAuth, getAdmin)

export default adminRouter;