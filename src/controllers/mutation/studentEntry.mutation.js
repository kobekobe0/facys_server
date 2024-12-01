import StudentLog from '../../models/StudentLog.js';
import Student from '../../models/Student.js';
import { io } from '../../index.js';
import { sendEmail } from '../../helper/emailer.js';

export const createStudentLog = async (req, res) => {
    const { studentID } = req.body;

    try {
        const student = await Student.findOne({_id: studentID, deleted: false});
        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }
        
        // const lastLog = await StudentLog.findOne().sort({ timeIn: -1 });
        // if (lastLog && lastLog.studentID === studentID && !lastLog.timeOut) {
        //     return res.status(400).json({ message: "Student is already logged in a while ago" });
        // }

        //get the last log of the student
        const lastLog = await StudentLog.findOne({ studentID: studentID }).sort({ timeIn: -1 });
        //check if the log timeIn is 10mins ago
        if (lastLog && lastLog.timeIn) {
            const timeIn = new Date(lastLog.timeIn);
            const currentTime = new Date();
            const timeDiff = Math.abs(currentTime - timeIn);
            const minutes = Math.floor((timeDiff / 1000) / 60);
            if (minutes < 10) {
                return res.status(400).json({ message: "Student is already logged in a while ago" });
            }
        }


        const studentLog = await StudentLog.create({
            studentID,
            timeOut: null,
        });

        const entryDate = new Date();
        const entryDatePlus8Hours = new Date(entryDate.getTime() + 8 * 60 * 60 * 1000);
        
        const emailOptions = {
            to: student.guardianEmail,
            subject: "Campus Entry",
            text: `${student.name} has entered the campus at ${entryDatePlus8Hours.toLocaleString()}`,
            html: `
                <h1>Campus Entry</h1>
                <p>${student.name} has entered the campus at ${entryDatePlus8Hours.toLocaleString()}</p>
            `,
        };
        await sendEmail(emailOptions);

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