import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js'
const SECRET_KEY = process.env.SECRET_KEY;


export const adminAuth = async (req, res, next) => {
    const token = req.header('Authorization');

    if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        const admin = await Admin.findById(decoded._id);
        if(!admin) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        req.user = decoded;
        
        next();
    } catch (error) {
        console.log(error)
        res.status(401).json({ message: "Unauthorized" });
    }
}