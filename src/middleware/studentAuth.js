import jwt from 'jsonwebtoken';
const SECRET_KEY = process.env.SECRET_KEY;

export const studentAuth = async (req, res, next) => {
    const token = req.header('Authorization');

    if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        req.user = decoded;
        console.log(decoded);
        next();
    } catch (error) {
        console.log(error)
        res.status(401).json({ message: "Unauthorized" });
    }
}