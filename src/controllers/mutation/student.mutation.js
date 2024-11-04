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



//register
export const createStudent = async (req, res) => {
    try {
        const student = req.body;
        const schedule = JSON.parse(student.schedule);
        const { faceData } = req.body;
        const parsedFaceData = JSON.parse(faceData);
        const pfpPath = `${req.filename}`;

        console.log(schedule)

        console.log("Student Data:", student);
        console.log("Schedule Data:", schedule);

        // Prepare face descriptor array
        const faceDescriptorArray = Object.keys(parsedFaceData).map(key => parseFloat(parsedFaceData[key]));
        const inputFaceDescriptor = new Float32Array(faceDescriptorArray);
        
        const encryptedPassword = await bcrypt.hash(student.password, 10);

        const existingStudent = await Student.findOne({ studentNumber: student.studentNumber });
        if (existingStudent) return res.status(400).json({ message: 'COR already used' });

        // Check if faceMatcher is initialized
        if (global.faceMatcher === null) {
            console.log("Creating new student...");

            // Create new student in the database
            console.log(student)
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
            });

            console.log("New Student Created:", newStudent);

            if (!newStudent) {
                return res.status(400).json({ message: 'Failed to create student' });
            }

            // Create face entry for the student
            console.log("Creating face for the student...");
            const newFace = await Face.create({
                studentID: newStudent._id,
                descriptor: faceDescriptorArray,
            });

            console.log("Face Created:", newFace);

            // Log system activity
            await createSystemLog('CREATE', 'Student', newStudent._id, 'Student', 'Student created', null);

            loadEmbeddingsIntoMemory().then(matcher => {
                global.faceMatcher = matcher;
                console.log('FaceMatcher loaded into memory');
            });
    

            return res.status(200).json({ message: 'Student created successfully', studentID: newStudent._id });
        }

        // Face matcher is initialized, check for duplicates
        console.log("Checking for existing faces...");
        const bestMatch = global.faceMatcher.findBestMatch(inputFaceDescriptor);
        console.log("Best Match Found:", bestMatch);

        if (bestMatch._label !== 'unknown') {
            return res.status(400).json({ message: 'Face already exists' });
        }

        const result = await liveness(pfpPath);
        console.log("CHECKING");
        console.log(result);
    
        if (result?.result === 'fake') {
            return res.status(400).json({ message: 'Fake face detected' });
        }

        // Proceed to create the student
        console.log("Creating new student due to no face match...");
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
        });

        if (!newStudent) {
            return res.status(400).json({ message: 'Failed to create student' });
        }

        // Create face entry for the new student
        const newFace = await Face.create({
            studentID: newStudent._id,
            descriptor: faceDescriptorArray,
        });

        // Log system activity
        await createSystemLog('CREATE', 'Student', newStudent._id, 'Student', 'Student created', null);

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

        await checkCompleteRegistration(id);

        return res.status(200).json({ message: 'Student updated successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Failed to update student' });
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

    try {
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

    try {
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
    const { faceData, updatePfp } = req.body;
    const pfpPath = `${req.filename}`;
    const parsedFaceData = JSON.parse(faceData);
    try {
        const student = await Student.findById(id);
        if(!student) return res.status(404).json({ message: "Student not found" });

        const existing = await Face.findOne({ studentID: id });
        if(!existing) return res.status(404).json({ message: "Face not found" });

        if(updatePfp == 'true'){
            student.pfp = pfpPath;
            await student.save();
        }

        existing.descriptor = Object.keys(parsedFaceData).map(key => parseFloat(parsedFaceData[key]));
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

        const outdateds = await Student.find({ updated: false });

        await Student.deleteMany({ updated: false });
        await SystemLog.deleteMany({ entityID: { $in: outdateds.map(student => student._id) } });
        await Face.deleteMany({ studentID: { $in: outdateds.map(student => student._id) } });
        await StudentLog.deleteMany({ studentID: { $in: outdateds.map(student => student._id) } });

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