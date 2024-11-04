import { createSystemLog } from "../../middleware/createSystemLog.js";
import Admin from "../../models/Admin.js";
import bcrypt from 'bcryptjs';

export const changeAdminEmail = async (req, res) => {
    const { email, password } = req.body;
    const { _id } = req.user;

    try {
        const admin = await Admin.findById(_id);
        if (admin.email === email) return res.status(400).json({ message: 'Email is the same' });

        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid password' });

        admin.email = email;
        await admin.save();

        await createSystemLog('UPDATE', 'Admin', admin._id, 'Admin', 'Email updated by admin', null);

        res.status(200).json({ message: 'Email updated successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}


export const changeAdminPassword = async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    const { _id } = req.user;

    try {
        const admin = await Admin.findById(_id);
        const isMatch = await bcrypt.compare(oldPassword, admin.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid password' });

        admin.password = await bcrypt.hash(newPassword, 12);
        await admin.save();

        await createSystemLog('UPDATE', 'Admin', admin._id, 'Admin', 'Password updated by admin', null);

        res.status(200).json({ message: 'Password updated successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

export const getAdmin = async (req, res) => {
    const { _id } = req.user;

    try {
        const admin = await Admin.findById(_id).select('-password');
        res.status(200).json(admin);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}