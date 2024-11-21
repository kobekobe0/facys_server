import SystemLog from "../../models/SystemLog.js";
import Student from "../../models/Student.js";
import Admin from "../../models/Admin.js";
import StudentLog from "../../models/StudentLog.js";
import Vehicle from "../../models/Vehicle.js";
import { createSystemLog } from "../../middleware/createSystemLog.js";
import bcrypt from 'bcryptjs';
import * as faceapi from 'face-api.js';
import Face from "../../models/Face.js";
import loadEmbeddingsIntoMemory from "../../config/loadfaces.js";

function liveness(image) {
    return new Promise((resolve, reject) => {
        const myHeaders = new Headers();
        myHeaders.append("token", process.env.API_TOKEN);

        const formdata = new FormData();

        if (typeof image === "string" && image.startsWith("https://")) {
            formdata.append("photo", image);
        } else if (typeof image === "string" && image.startsWith("data:image/")) {
            const blob = base64ToBlob(image);
            formdata.append("photo", blob, "file");
        } else {
            return reject("Unsupported image format.");
        }

        const requestOptions = {
            method: 'POST',
            headers: myHeaders,
            body: formdata,
            redirect: 'follow'
        };

        fetch("https://api.luxand.cloud/photo/liveness", requestOptions)
            .then(response => response.json())
            .then(result => resolve(result))
            .catch(error => reject(error));
    });
}

function base64ToBlob(base64) {
    const byteString = atob(base64.split(",")[1]);
    const mimeString = base64.split(",")[0].split(":")[1].split(";")[0];
    
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    
    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    
    return new Blob([ab], { type: mimeString });
}

export const createStudent = async (req, res) => {
    try {
        const student = req.body;
        const schedule = JSON.parse(student.schedule);
        const { faceData } = req.body;
        const parsedFaceData = JSON.parse(faceData);
        const pfpPath = `${req.filename}`;

        console.log("Student Data:", student);
        console.log("Schedule Data:", schedule);

        // Directly retrieve the main and support descriptors
        const mainDescriptor = new Float32Array(parsedFaceData.mainDescriptor);
        const supportDescriptor1 = new Float32Array(parsedFaceData.supportDescriptor1);
        const supportDescriptor2 = new Float32Array(parsedFaceData.supportDescriptor2);

        // Log the descriptors to confirm correct parsing
        console.log("Main Descriptor:", mainDescriptor);
        console.log("Support Descriptor 1:", supportDescriptor1);
        console.log("Support Descriptor 2:", supportDescriptor2);

        // Hash the student's password
        const encryptedPassword = await bcrypt.hash(student.password, 10);

        // Check if a student with the same student number already exists
        const existingStudent = await Student.findOne({ studentNumber: student.studentNumber });
        if (existingStudent) return res.status(400).json({ message: 'COR already used' });

        // Check if the global face matcher is initialized
        if (global.faceMatcher === null) {
            console.log("Creating new student as face matcher is not initialized...");

            // Create the student record
            const newStudent = await Student.create({
                name: student.name,
                cellphone: student.cellphone,
                schedule,
                studentNumber: student.studentNumber,
                department: student.department,
                section: student.section,
                degree: student.degree,
                yearLevel: student.yearLevel,
                SY: student.SY,
                dateOfBirth: student.dateOfBirth,
                password: encryptedPassword,
                email: student.email,
                pfp: pfpPath,
                guardianEmail: student.guardianEmail,
            });

            if (!newStudent) {
                return res.status(400).json({ message: 'Failed to create student' });
            }

            // Create the face data entry with main and supporting descriptors
            const newFace = await Face.create({
                studentID: newStudent._id,
                mainDescriptor: Array.from(mainDescriptor),
                supportDescriptors: [Array.from(supportDescriptor1), Array.from(supportDescriptor2)],
            });

            console.log("Face Created:", newFace);

            // Log the creation in system logs
            await createSystemLog('CREATE', 'Student', newStudent._id, 'Student', 'Student created', null);

            // Reload the face matcher with the new embeddings
            loadEmbeddingsIntoMemory().then(matcher => {
                global.faceMatcher = matcher;
                console.log('FaceMatcher loaded into memory');
            });

            return res.status(200).json({ message: 'Student created successfully', studentID: newStudent._id });
        }

        // Face matcher is initialized, check for duplicate faces
        console.log("Checking for existing faces...");
        const bestMatch = global.faceMatcher.findBestMatch(mainDescriptor);
        console.log("Best Match Found:", bestMatch);

        if (bestMatch._label !== 'unknown') {
            return res.status(400).json({ message: 'Face already exists' });
        }

        // Perform liveness detection
        // const result = await liveness(pfpPath);
        // if (result?.score < 0.8) {
        //     return res.status(400).json({ message: 'Fake face detected' });
        // }

        // Proceed to create the student if all checks pass
        const newStudent = await Student.create({
            name: student.name,
            cellphone: student.cellphone,
            schedule,
            studentNumber: student.studentNumber,
            department: student.department,
            section: student.section,
            degree: student.degree,
            yearLevel: student.yearLevel,
            SY: student.SY,
            dateOfBirth: student.dateOfBirth,
            password: encryptedPassword,
            email: student.email,
            pfp: pfpPath,
            guardianEmail: student.guardianEmail,
        });

        if (!newStudent) {
            return res.status(400).json({ message: 'Failed to create student' });
        }

        // Create face entry for the new student
        const newFace = await Face.create({
            studentID: newStudent._id,
            mainDescriptor: Array.from(mainDescriptor),
            supportDescriptors: [Array.from(supportDescriptor1), Array.from(supportDescriptor2)],
        });

        console.log("Face Created:", newFace);

        // Log system activity
        await createSystemLog('CREATE', 'Student', newStudent._id, 'Student', 'Student created', null);

        // Reload embeddings into memory for face matching
        loadEmbeddingsIntoMemory().then(matcher => {
            global.faceMatcher = matcher;
            console.log('FaceMatcher loaded into memory');
        });

        return res.status(200).json({ message: 'Student created successfully', studentID: newStudent._id });

    } catch (error) {
        console.error("Error in createStudent:", error);
        return res.status(500).json({ message: 'Failed to create student', error: error.message });
    }
};

export const updateStudent = async (req, res) => {
    const { id } = req.params;
    const student = req.body;

    const formattedBody = {
        ...student,
        schedule: JSON.parse(student.schedule),
        SY: `AY ${student.SY.start} - ${student.SY.end} ${student.SY.semester} Semester`,
        updated: true
    };


    console.log(formattedBody)
    console.log(student.schedule)

    try {
        const updatedStudent = await Student.findByIdAndUpdate(id, formattedBody, { new: true });
        if(updatedStudent){
            await createSystemLog('UPDATE', 'Student', updatedStudent._id, 'Student', 'Student updated', null);
        } else {
            return res.status(400).json({ message: 'Failed to update student' });
        }

        return res.status(200).json({ message: 'Student updated successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Failed to update student' });
    }
}


export const updateEmail = async (req, res) => {
    const { _id } = req.user;
    const { email, password } = req.body;

    console.log(req.body)


    try {
        const student = await Student.findOne({_id: _id, deleted: false});
        if(!student) return res.status(404).json({ message: "Student not found" });

        const isMatch = await bcrypt.compare(password, student.password);
        if(!isMatch) return res.status(400).json({ message: "Invalid password" });

        student.email = email;
        await student.save();

        await createSystemLog('UPDATE', 'Student', student._id, 'Student', 'Email updated', null);

        return res.status(200).json({ message: 'Email updated successfully' });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Failed to update email' });
    }
}
export const updateGuardianEmail = async (req, res) => {
    const { _id } = req.user;
    const { guardianEmail, password } = req.body;

    console.log(req.body)


    try {
        const student = await Student.findOne({_id: _id, deleted: false});
        if(!student) return res.status(404).json({ message: "Student not found" });

        const isMatch = await bcrypt.compare(password, student.password);
        if(!isMatch) return res.status(400).json({ message: "Invalid password" });

        student.guardianEmail = guardianEmail;
        await student.save();

        await createSystemLog('UPDATE', 'Student', student._id, 'Student', 'Guardian Email updated', null);

        return res.status(200).json({ message: 'Guardian Email updated successfully' });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Failed to update email' });
    }
}

export const updatePassword = async (req, res) => {
    const { _id } = req.user;
    const { oldPassword, newPassword } = req.body;

    try {
        const student = await Student.findOne({_id: _id, deleted: false});
        if(!student) return res.status(404).json({ message: "Student not found" });

        const isMatch = await bcrypt.compare(oldPassword, student.password);

        if(!isMatch) return res.status(400).json({ message: "Invalid password" });

        const encryptedPassword = await bcrypt.hash(newPassword, 10);

        student.password = encryptedPassword;
        await student.save();

        await createSystemLog('UPDATE', 'Student', student._id, 'Student', 'Password updated', null);

        return res.status(200).json({ message: 'Password updated successfully' });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Failed to update password' });
    }
}

export const deleteStudent = async (req,res) => {
    //delete everything related to the student
    const { id } = req.params;
    const {password} = req.query
    const {_id} = req.user;

    const admin = await Admin.findById(_id);
    if(!admin) return res.status(404).json({ message: "Admin not found" });

    const isMatch = await bcrypt.compare(password, admin.password);
    if(!isMatch) return res.status(400).json({ message: "Invalid password" });

    try {
        const student = await Student.findById(id);
        if(!student) return res.status(404).json({ message: "Student not found" });

        await StudentLog.deleteMany({studentID: id})
        await SystemLog.deleteMany({entityID: id})
        await Face.deleteOne({studentID: id})
        await Student.deleteOne({_id: id})

        await createSystemLog('DELETE', 'Student', id, 'Student', 'Student deleted', null);

        loadEmbeddingsIntoMemory().then(matcher => {
            global.faceMatcher = matcher;
            console.log('FaceMatcher loaded into memory');
        })

        return res.status(200).json({ message: 'Student deleted successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Failed to delete student' });
    }
}


export const detectFace = async (req, res) => {
    //will accept float32array
    const { faceData } = req.body;
    console.log('Incoming face data:', faceData);

    // Validate and parse face data
    const faceDescriptorArray = Object.keys(faceData).map(key => {
        const value = parseFloat(faceData[key]);
        if (isNaN(value)) {
            console.error(`Invalid number found for key ${key}: ${faceData[key]}`);
            return null; // or handle this case as needed
        }
        return value;
    }).filter(value => value !== null); // Remove any null entries

    console.log('Parsed face descriptor array:', faceDescriptorArray);
    
    // Ensure the array is the expected length
    if (faceDescriptorArray.length === 0 || faceDescriptorArray.length !== expectedLength) {
        return res.status(400).json({ message: 'Invalid face descriptor length' });
    }

    const inputFaceDescriptor = new Float32Array(faceDescriptorArray);
    console.log('Input face descriptor:', inputFaceDescriptor);

    if (global.faceMatcher === null) {
        return res.status(400).json({ message: 'Face matcher not initialized' });
    }

    try {
        const bestMatch = global.faceMatcher.findBestMatch(inputFaceDescriptor);

        if (bestMatch._label === 'unknown') {
            return res.status(400).json({ message: 'Face not recognized' });
        }

        console.log('Best match found:', bestMatch._label);

        return res.status(200).json({ message: 'Face recognized', studentID: bestMatch._label });
    } catch (error) {
        console.error('Error during face detection:', error);
        return res.status(500).json({ message: 'Failed to detect face' });
    }
}


export const blockStudent = async (req, res) => {
    const { id } = req.params;
    const {password} = req.body;
    const {_id} = req.user;

    try {
        const admin = await Admin.findById(_id);
        if(!admin) return res.status(404).json({ message: "Admin not found" });

        const isMatch = await bcrypt.compare(password, admin.password);
        if(!isMatch) return res.status(400).json({ message: "Invalid password" });

        const student = await Student.findById(id);
        student.isBlocked = true;
        await student.save();

        await createSystemLog('BLOCK', 'Student', student._id, 'Student', 'Student blocked', null);

        return res.status(200).json({ message: 'Student blocked successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Failed to block student' });
    }
}

export const unblockStudent = async (req, res) => {
    const { id } = req.params;
    const {password} = req.body;
    const {_id} = req.user;
    try {
        const admin = await Admin.findById(_id);
        if(!admin) return res.status(404).json({ message: "Admin not found" });

        const isMatch = await bcrypt.compare(password, admin.password);
        if(!isMatch) return res.status(400).json({ message: "Invalid password" });
        
        const student = await Student.findById(id);
        student.isBlocked = false;
        await student.save();

        await createSystemLog('UNBLOCK', 'Student', student._id, 'Student', 'Student unblocked', null);

        return res.status(200).json({ message: 'Student unblocked successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Failed to block student' });
    }
}


export const updatePasswordByAdmin = async (req, res) => {
    const { id } = req.params;
    const { password } = req.body;
    const { _id } = req.user;
    try {
        const student = await Student.findById(id);
        if(!student) return res.status(404).json({ message: "Student not found" });

        const admin = await Admin.findById(_id);
        if(!admin) return res.status(404).json({ message: "Admin not found" });

        const encryptedPassword = await bcrypt.hash(password, 10);
        student.password = encryptedPassword;
        await student.save();

        await createSystemLog('UPDATE', 'Student', student._id, 'Student', 'Password updated by admin', null);

        return res.status(200).json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Failed to update password' });
    }
}


export const changePassword = async (req, res) => {
    const { id } = req.params;
    const { oldPassword, newPassword } = req.body;
    try {
        const student = await Student.findById(id);
        if(!student) return res.status(404).json({ message: "Student not found" });

        const isMatch = await bcrypt.compare(oldPassword, student.password);

        if(!isMatch) return res.status(400).json({ message: "Invalid password" });

        const encryptedPassword = await bcrypt.hash(newPassword, 10);

        student.password = encryptedPassword;
        await student.save();

        await createSystemLog('UPDATE', 'Student', student._id, 'Student', 'Password updated', null);

        return res.status(200).json({ message: 'Password updated successfully' });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Failed to update password' });
    }
}

export const updateFaceData = async (req, res) => {
    const { id } = req.params;
    const { faceData, updatePfp, password } = req.body;
    const parsedFaceData = JSON.parse(faceData);
    const pfpPath = `${req.filename}`;

    const mainDescriptor = new Float32Array(parsedFaceData.mainDescriptor);
    const supportDescriptor1 = new Float32Array(parsedFaceData.supportDescriptor1);
    const supportDescriptor2 = new Float32Array(parsedFaceData.supportDescriptor2);

    const { _id } = req.user;
    const admin = await Admin.findById(_id);
    if(!admin) return res.status(404).json({ message: "Admin not found" });

    const isMatch = await bcrypt.compare(password, admin.password);
    if(!isMatch) return res.status(400).json({ message: "Invalid password" });

    try {

        const bestMatch = global.faceMatcher.findBestMatch(mainDescriptor);

        if (bestMatch._label !== 'unknown') {
            return res.status(400).json({ message: 'Face already exists in the system' });
        }

        const student = await Student.findById(id);
        if(!student) return res.status(404).json({ message: "Student not found" });

        const existing = await Face.findOne({ studentID: id });
        if(!existing) return res.status(404).json({ message: "Face not found" });

        if(updatePfp){
            student.pfp = pfpPath;
            await student.save();
        }

        existing.mainDescriptor = Array.from(mainDescriptor);
        existing.supportDescriptors = [Array.from(supportDescriptor1), Array.from(supportDescriptor2)];
        await existing.save();

        await createSystemLog('UPDATE', 'Student', student._id, 'Student', 'Face data updated', null);

        
        loadEmbeddingsIntoMemory().then(matcher => {
            global.faceMatcher = matcher;
            console.log('FaceMatcher loaded into memory');
        })

        return res.status(200).json({ message: 'Face data updated successfully' });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Failed to update face data' });
    }
}


export const updateFaceDataByStudent = async (req, res) => {
    const { id } = req.params;
    const { faceData, updatePfp, password } = req.body;
    const parsedFaceData = JSON.parse(faceData);
    const pfpPath = `${req.filename}`;

    const mainDescriptor = new Float32Array(parsedFaceData.mainDescriptor);
    const supportDescriptor1 = new Float32Array(parsedFaceData.supportDescriptor1);
    const supportDescriptor2 = new Float32Array(parsedFaceData.supportDescriptor2);

    try {
        const student = await Student.findById(id);
        if(!student) return res.status(404).json({ message: "Student not found" });
        const bestMatch = global.faceMatcher.findBestMatch(mainDescriptor);
        console.log(id)
        console.log(bestMatch._label)

        //find stundent face on global face matcher
        if (bestMatch._label !== id) {
            return res.status(400).json({ message: 'Face did not match existing face' });
        }

        // Perform liveness detection
        // const result = await liveness(pfpPath);
        // if (result?.score < 0.8) {
        //     return res.status(400).json({ message: 'Fake face detected' });
        // }

        if(updatePfp){
            student.pfp = pfpPath;
            await student.save();
        }

        const existing = await Face.findOne({ studentID: id });
        if(!existing) return res.status(404).json({ message: "Face not found" });


        existing.mainDescriptor = Array.from(mainDescriptor);
        existing.supportDescriptors = [Array.from(supportDescriptor1), Array.from(supportDescriptor2)];
        await existing.save();

        await createSystemLog('UPDATE', 'Student', student._id, 'Student', 'Face data updated', null);

        
        loadEmbeddingsIntoMemory().then(matcher => {
            global.faceMatcher = matcher;
            console.log('FaceMatcher loaded into memory');
        })

        return res.status(200).json({ message: 'Face data updated successfully' });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Failed to update face data' });
    }
}


export const deleteOutdatedAccounts = async (req, res) => {
    const { password } = req.body;
    const { _id } = req.user;
    try {
        const admin = await Admin.findById(_id);
        const isMatch = await bcrypt.compare(password, admin.password);

        if (!isMatch) return res.status(400).json({ message: 'Invalid password' });

        //const outdateds = await Student.find({ updated: false });

        const archiveStudents = await Student.updateMany({ updated: false }, { $set: { deleted: true } });
        // await Student.deleteMany({ updated: false });
        // await SystemLog.deleteMany({ entityID: { $in: outdateds.map(student => student._id) } });
        // await Face.deleteMany({ studentID: { $in: outdateds.map(student => student._id) } });
        // await StudentLog.deleteMany({ studentID: { $in: outdateds.map(student => student._id) } });

        await createSystemLog('DELETE', 'Student', null, 'Admin', 'Outdated accounts deleted', null);

        loadEmbeddingsIntoMemory().then(matcher => {
            global.faceMatcher = matcher;
            console.log('FaceMatcher loaded into memory');
        })

        return res.status(200).json({ message: 'Outdated accounts deleted successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Failed to delete outdated accounts' });
    }
}

export const deleteAccountPermanently = async (req, res) => {
    const { idss, password } = req.body;
    const { _id } = req.user;
    
    const ids = JSON.parse(idss);
    try {
        console.log(ids)
        console.log(req.body)
        const admin = await Admin.findById(_id);
        const isMatch = await bcrypt.compare(password, admin.password);

        if (!isMatch) return res.status(400).json({ message: 'Invalid password' });

        for (let id of ids) {
            const student = await Student.findById(id);
            if (!student) return res.status(404).json({ message: 'Student not found' });

            await StudentLog.deleteMany({ studentID: id });
            await SystemLog.deleteMany({ entityID: id });
            await Face.deleteOne({ studentID: id });
            await Student.deleteOne({ _id: id });

            await createSystemLog('DELETE', 'Student', student._id, 'Admin', 'Student deleted permanently', null);
        }

        

        loadEmbeddingsIntoMemory().then(matcher => {
            global.faceMatcher = matcher;
            console.log('FaceMatcher loaded into memory');
        })

        return res.status(200).json({ message: 'Student deleted permanently' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Failed to delete student' });
    }
}

export const restoreAccount = async (req, res) => {
    const {idss, password} = req.body;
    const {_id} = req.user;
    const ids = JSON.parse(idss)
    try {
        const admin = await Admin.findById(_id);
        const isMatch = await bcrypt.compare(password, admin.password);

        if (!isMatch) return res.status(400).json({ message: 'Invalid password' });

        for (let id of ids) {
            const student = await Student.findById(id);
            if (!student) return res.status(404).json({ message: 'Student not found' });

            student.deleted = false;
            if(!student.guardianEmail){
                student.guardianEmail = "test@email.com"
            }
            await student.save();

            await createSystemLog('RESTORE', 'Student', student._id, 'Admin', 'Student restored', null);
        }

        

        return res.status(200).json({ message: 'Student restored' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Failed to restore student' });
    }
}