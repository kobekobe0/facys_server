import SystemLog from "../../models/SystemLog.js";
import Student from "../../models/Student.js";
import Vehicle from "../../models/Vehicle.js";
import { createSystemLog } from "../../middleware/createSystemLog.js";
import bcrypt from 'bcryptjs';

//register
export const createStudent = async (req, res) => {
    const student = req.body;
    const pfpPath = `images/${req.filename}`;
    const schedule = JSON.parse(student.schedule);

    try {
        const studentExists = await Student.findOne({ studentNumber: student.studentNumber });

        if(studentExists){
            return res.status(400).json({ message: `Account with student number ${student.studentNumber} already exists` });
        }

        const hashedPassword = await bcrypt.hash(student.password, 12);

        const newStudent = await Student.create({
            name: student.name,
            cellphone: student.cellphone,
            schedule: schedule,
            email: student.email,
            studentNumber: student.studentNumber,
            department: student.department,
            password: hashedPassword,
            pfp: pfpPath
        });

        if(newStudent){
            await createSystemLog('CREATE', 'Student', newStudent._id, 'Student', 'Student created', null);
        } else {
            return res.status(400).json({ message: 'Failed to create student' });
        }

        return res.status(201).json({ message: 'Account created successfully'});

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Failed to create student' });
    }
}

const checkCompleteRegistration = async (id) => {
    const student = await Student.findById(id);
    //check fields
    if(student.name.first && student.name.last && student.cellphone && student.email && student.studentNumber && student.department && student.pfp){
        const studentVehicle = await Vehicle.findOne({ studentID: id });
        if(studentVehicle){
            student.completeRegistration = true;
            await student.save();
        }
    }
}

export const updateStudent = async (req, res) => {
    const { id } = req.params;
    const student = req.body;

    try {
        const updatedStudent = await Student.findByIdAndUpdate(id, student, { new: true });
        if(updatedStudent){
            await createSystemLog('UPDATE', 'Student', updatedStudent._id, 'Student', 'Student updated', null);
        } else {
            return res.status(400).json({ message: 'Failed to update student' });
        }

        await checkCompleteRegistration(id);

        return res.status(200).json({ message: 'Student updated successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Failed to update student' });
    }
}

export const deleteStudent = async (req, res) => {
    const { id } = req.params;

    try {
        const deletedStudent = await Student.findByIdAndUpdate(id, { deleted: true }, { new: true });
        if(deletedStudent){
            await createSystemLog('DELETE', 'Student', deletedStudent._id, 'Student', 'Student deleted', null);
        } else {
            return res.status(400).json({ message: 'Failed to delete student' });
        }

        return res.status(200).json({ message: 'Student deleted successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Failed to delete student' });
    }
}