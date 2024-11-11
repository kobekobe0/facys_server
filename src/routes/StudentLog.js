import express from "express";
import { createStudentLog } from "../controllers/mutation/studentEntry.mutation.js";
import { getLast15DaysNumbers, getNumberOfTotalLogs, getNumbers, getStudentLogs, getStudentLogsById } from "../controllers/query/studentEntry.query.js";

const studentLogRouter = express.Router();

studentLogRouter.post('/', createStudentLog)
studentLogRouter.get('/', getStudentLogs)

studentLogRouter.get('/student/:id', getStudentLogsById)
studentLogRouter.get('/number/:id', getNumberOfTotalLogs)

studentLogRouter.get('/numbers', getNumbers)
studentLogRouter.get('/last-15-days', getLast15DaysNumbers)



export default studentLogRouter;