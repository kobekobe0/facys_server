import express from "express";
import { createStudentLog } from "../controllers/mutation/studentEntry.mutation.js";
import { getStudentLogs } from "../controllers/query/studentEntry.query.js";

const studentLogRouter = express.Router();

studentLogRouter.post('/', createStudentLog)
studentLogRouter.get('/', getStudentLogs)

export default studentLogRouter;