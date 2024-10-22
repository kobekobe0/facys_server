import StudentLog from '../../models/studentLog.js';
import paginate from '../../helper/paginate.js';
import Student from '../../models/Student.js';
import { io } from '../../index.js';

export const createStudentLog = async (req, res) => {
    const { studentID } = req.body;

    try {
        const student = await Student.findById(studentID);
        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }
        
        const lastLog = await StudentLog.findOne().sort({ timeIn: -1 });
        if (lastLog && lastLog.studentID === studentID && !lastLog.timeOut) {
            return res.status(400).json({ message: "Student is already logged in a while ago" });
        }

        const studentLog = await StudentLog.create({
            studentID,
            timeOut: null,
        });

        if (!studentLog) {
            console.error("Error creating student log");
            return res.status(500).json({ message: "Internal server error" });
        }

        io.emit('studentLog', studentLog);

        return res.status(201).json({ message: "Student log created" });

    }
    catch (error) {
        console.error("Error creating student log:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}