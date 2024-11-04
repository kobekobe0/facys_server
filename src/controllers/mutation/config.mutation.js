import { createSystemLog } from '../../middleware/createSystemLog.js';
import Admin from '../../models/Admin.js';
import Config from '../../models/Config.js';
import Student from '../../models/Student.js';
import bcrypt from 'bcryptjs';

export const addDepartment = async (req, res) => {
    const { department } = req.body;

    try {
        const config = await Config.findOne();
        config.departments.push(department);
        await config.save();

        res.status(200).json({ message: 'Department added successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

export const removeDepartment = async (req, res) => {
    const { department } = req.body;

    try {
        const config = await Config.findOne();
        config.departments = config.departments.filter(dep => dep !== department);
        await config.save();

        res.status(200).json({ message: 'Department removed successfully' });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

export const updateSY = async (req, res) => {
    const { SY, password } = req.body;
    const {_id} = req.user;
    try {
        const admin = await Admin.findById(_id);
        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid password' });

        const config = await Config.findOne();

        if(config.SY === SY) return res.status(400).json({ message: 'School year is the same' });
        
        config.SY = SY;
        await config.save();

        //await createSystemLog('UPDATE', 'Student', student._id, 'Student', 'Password updated by admin', null);
        await createSystemLog('UPDATE', 'Config', config._id, 'Config', 'School year updated by admin', null);

        await Student.updateMany({}, { updated: false });

        res.status(200).json({ message: 'School year updated successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

export const getConfig = async (req, res) => {
    try {
        const config = await Config.findOne();
        res.status(200).json({ config });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

export const getUniqueDepartments = async (req, res) => {
    try {
        const UniqueDepartmentsFromStudents = await Student.find().distinct('department');
        console.log(UniqueDepartmentsFromStudents);
        return res.status(200).json({ UniqueDepartmentsFromStudents });

    } catch (error) {
        return  res.status(500).json({ message: error.message });
    }
}