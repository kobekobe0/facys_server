import Student from "../../models/Student.js";
import Visitor from "../../models/Visitor.js";

export const queryFace = async (req, res) => {
    const { faceData } = req.body;

    const faceDescriptorArray = Object.keys(faceData).map(key => parseFloat(faceData[key]));
    const inputFaceDescriptor = new Float32Array(faceDescriptorArray);

    if (global.faceMatcher === null) {
        return res.status(400).json({ message: 'Face matcher not initialized' });
    }

    const bestMatch = global.faceMatcher.findBestMatch(inputFaceDescriptor);

    console.log(bestMatch);

    if (bestMatch._label === 'unknown') {   
        return res.status(404).json({ message: 'No match found' });
    }

    let result;
    let isVisitor = false;

    // Check if the label has the VISITOR_ prefix
    if (bestMatch._label.startsWith("VISITOR_")) {
        const visitorId = bestMatch._label.replace("VISITOR_", "");
        result = await Visitor.findById(visitorId).select('name address contactNumber pfp email dateOfBirth organization'); // Include relevant Visitor fields
        isVisitor = true;
    } else {
        result = await Student.findById(bestMatch._label).select('name studentNumber isBlocked department degree section yearLevel updated SY dateOfBirth pfp');
    }

    if (!result) {
        return res.status(404).json({ message: "No matching descriptors match" });
    }

    if (!isVisitor) {
        if (!result.updated) return res.status(404).json({ message: "Student account not updated" });
        if (result.isBlocked) return res.status(404).json({ message: "Student is blocked" });
    }

    return res.status(200).json({ message: 'Match found', student: result.toObject(), isVisitor });
};
