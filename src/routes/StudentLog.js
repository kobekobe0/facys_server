import express from "express";
import { createStudentLog } from "../controllers/mutation/studentEntry.mutation.js";
import { getNumberOfTotalLogs, getStudentLogs, getStudentLogsById } from "../controllers/query/studentEntry.query.js";

const studentLogRouter = express.Router();

studentLogRouter.post('/', createStudentLog)
studentLogRouter.get('/', getStudentLogs)

studentLogRouter.get('/student/:id', getStudentLogsById)
studentLogRouter.get('/number/:id', getNumberOfTotalLogs)



export default studentLogRouter;