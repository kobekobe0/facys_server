import { sendEmail } from "../../helper/emailer.js";
import Admin from "../../models/Admin.js";
import ResetPassword from "../../models/ResetPassword.js";
import Student from "../../models/Student.js";
import bcrypt from 'bcryptjs';

export const createResetPassword = async (req, res) => {
    const {studentNumber} = req.body;

    try{
        const student = await Student.findOne({studentNumber, deleted: false});
        if(!student){
            return res.status(400).json({message: "Student not found"});
        }
        const resetPassword = await ResetPassword.create({
            studentNumber,
            expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
            used: false,
        })

        if(!resetPassword){
            console.error("Error creating reset password");
            return res.status(500).json({message: "Internal server error"});
        }

        const emailOptions = {
            to: student.email,
            subject: "Reset your password",
            text: `Click here to reset your password: ${process.env.FRONTEND_URL}/forgot-password/${resetPassword._id} - This will expire after 24 hours`,
            html: `<a href="${process.env.FRONTEND_URL}/forgot-password/${resetPassword._id}">Click here to reset your password</a>`,
        }

        sendEmail(emailOptions);

        res.status(201).json({message: "Reset password created"});
    } catch(error){
        console.error("Error creating reset password:", error);
        res.status(500).json({message: "Internal server error"});
    }
}


export const resetPassword = async (req, res) => {
    const {resetPasswordId} = req.params;
    const {password} = req.body;

    try{
        const resetPassword = await ResetPassword.findById(resetPasswordId);
        if(!resetPassword){
            return res.status(404).json({message: "Reset password not found"});
        }

        if(resetPassword.used){
            return res.status(400).json({message: "Reset password already used"});
        }

        if(resetPassword.expires < new Date()){
            return res.status(400).json({message: "Reset password expired"});
        }

        const student = await Student.findOne({studentNumber: resetPassword.studentNumber, deleted: false});
        if(!student){
            return res.status(404).json({message: "Student not found"});
        }

        const encryptedPassword = await bcrypt.hash(password, 12);

        student.password = encryptedPassword;
        await student.save();

        resetPassword.used = true;
        await resetPassword.save();

        res.status(200).json({message: "Password reset successful"});
    } catch(error){
        console.error("Error resetting password:", error);
        res.status(500).json({message: "Internal server error"});
    }
}


export const adminCreateResetPassword = async (req, res) => {
    const {email} = req.body;

    try{
        const admin = await Admin.findOne({email});

        if(!admin) return res.status(404).json({message: "Admin not found"});

        const resetPassword = await ResetPassword.create({
            studentNumber: admin._id,
            expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
            used: false,
        })

        if(!resetPassword){
            console.error("Error creating reset password");
            return res.status(500).json({message: "Internal server error"});
        }

        const emailOptions = {
            to: admin.email,
            subject: "Reset your password",
            text: `Click here to reset your password: ${process.env.FRONTEND_URL}/admin-forgot-password/${resetPassword._id} - This will expire after 24 hours`,
            html: `<a href="${process.env.FRONTEND_URL}/admin-forgot-password/${resetPassword._id}">Click here to reset your password</a>`,
        }

        sendEmail(emailOptions);

        return res.status(201).json({message: "Reset password created"});

    } catch(error){
        console.error("Error creating reset password:", error);
        return res.status(500).json({message: "Internal server error"});
    }
}

export const adminResetPassword = async (req, res) => {
    const {resetPasswordId} = req.params;
    const {password} = req.body;
    console.log("HIT", password)
    try{
        const resetPassword = await ResetPassword.findById(resetPasswordId);
        if(!resetPassword){
            return res.status(404).json({message: "Reset password not found"});
        }

        if(resetPassword.used){
            return res.status(400).json({message: "Reset password already used"});
        }

        if(resetPassword.expires < new Date()){
            return res.status(400).json({message: "Reset password expired"});
        }

        const admin = await Admin.findById(resetPassword.studentNumber);
        if(!admin){
            return res.status(404).json({message: "Admin not found"});
        }

        const encryptedPassword = await bcrypt.hash(password, 12);

        admin.password = encryptedPassword;
        await admin.save();

        resetPassword.used = true;
        await resetPassword.save();

        res.status(200).json({message: "Password reset successful"});
    } catch(error){
        console.error("Error resetting password:", error);
        res.status(500).json({message: "Internal server error"});
    }
}