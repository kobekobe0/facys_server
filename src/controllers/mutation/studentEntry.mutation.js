import StudentLog from '../../models/studentLog.js';
import paginate from '../../helper/paginate.js';
import Student from '../../models/Student.js';
import { io } from '../../index.js';


export const logStudent = async (req, res) => {
    const student = req.body;

    let studentLog

    //check last student log of student
    const lastLog = await StudentLog.findOne({studentNumber: student.studentNumber}).sort({timeIn: -1});
    //check if student log is not 10 minutes ago
    if(lastLog && (new Date() - new Date(lastLog.timeIn)) < 600000){
        return res.status(400).json({message: "Student already logged in"});
    }

    try{
        if(!student.vehicle){
            studentLog.studentNumber = student.studentNumber;
            studentLog.fullName = student.fullName;
            studentLog.department = student.department;
        } else {
            studentLog.studentNumber = student.studentNumber;
            studentLog.fullName = student.name;
            studentLog.department = student.department;
            studentLog.vehicle = student.vehicle;
            studentLog.studentID = student._id;
        }

        const newLog = await StudentLog.create(studentLog);

        if(newLog){
            //send socket io message
            io.emit('studentLog', newLog);
            return res.status(201).json(newLog);
        }
    } catch (error) {
        return res.status(500).json({ message: "Failed to log student", error: error.message });
    }
}