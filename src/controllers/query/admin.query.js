import generateAuthToken from '../../helper/generateAuthToken.js';
import Admin from '../../models/Admin.js'
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

export const loginAdmin = async (req, res) => {
    const { email, password } = req.body;

    try {
        const admin = await Admin.findOne({ email });
        if(!admin) return res.status(404).json({ message: 'Admin not found' });

        const isMatch = await bcrypt.compare(password, admin.password);
        if(!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        const token = generateAuthToken(admin, 'Admin');
        return res.status(200).json({ token });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Failed to login admin' });
    }
}

export const verifyJWT = async (req, res) => {
    const {token} = req.body;
    try {
        console.log(token, process.env.SECRET_KEY)
        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        console.log(decoded)
        req.user = decoded;
        const user = await Admin.findById(decoded._id)
        res.status(200).json({ message: "Token is valid", success: true, user });
    } catch (error) {
        console.log(error)
        res.status(401).json({ message: "Unauthorized", success: false });
    }
}