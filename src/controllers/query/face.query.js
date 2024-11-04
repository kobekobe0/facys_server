import Student from "../../models/Student.js";

export const queryFace = async (req, res) => {
    const { faceData }  = req.body;

    const faceDescriptorArray = Object.keys(faceData).map(key => parseFloat(faceData[key]));
    const inputFaceDescriptor = new Float32Array(faceDescriptorArray);

    if (global.faceMatcher === null) {
        return res.status(400).json({ message: 'Face matcher not initialized' });
    }

    const bestMatch = global.faceMatcher.findBestMatch(inputFaceDescriptor);

    if (bestMatch._label === 'unknown') {
        return res.status(404).json({ message: 'No match found' });
    }

    const student = await Student.findById(bestMatch._label).select('name studentNumber department degree section yearLevel updated SY dateOfBirth');
    if (!student) {
        return res.status(404).json({ message: 'Student not found' });
    }

    console.log(student)

    if(!student.updated) return res.status(404).json({ message: "Student account not updated" });

    return res.status(200).json({ message: 'Match found', student });
}