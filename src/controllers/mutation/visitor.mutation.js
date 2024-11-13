import Visitor from '../../models/Visitor.js'
import Face from '../../models/Face.js'
import loadEmbeddingsIntoMemory from '../../config/loadfaces.js';
import { createSystemLog } from '../../middleware/createSystemLog.js';
import VisitorLog from '../../models/VisitorLog.js';

export const addVisitor = async (req, res) => {
    try{
        const visitor = req.body;
        const { faceData } = req.body;
        const parsedFaceData = JSON.parse(faceData);
        const pfpPath = `${req.filename}`;

        const mainDescriptor = new Float32Array(parsedFaceData.mainDescriptor);
        const supportDescriptor1 = new Float32Array(parsedFaceData.supportDescriptor1);
        const supportDescriptor2 = new Float32Array(parsedFaceData.supportDescriptor2);

        if (global.faceMatcher === null) {
            console.log("Creating new visitor as face matcher is not initialized...");

            // Create the student record
            const newVisitor = await Visitor.create({
                name: visitor.name,
                address: visitor.address,
                contactNumber: visitor.contactNumber,
                email: visitor.email,
                dateOfBirth: visitor.dateOfBirth,
                organization: visitor.organization,
                pfp: pfpPath
            });

            if (!newVisitor) return res.status(400).json({ message: 'Failed to create visitor' });

            // Create the face data entry with main and supporting descriptors
            const newFace = await Face.create({
                studentID: newVisitor._id,
                isVisitor: true,
                mainDescriptor: Array.from(mainDescriptor),
                supportDescriptors: [Array.from(supportDescriptor1), Array.from(supportDescriptor2)],
            });

            console.log("Face Created:", newFace);

            // Log the creation in system logs
            await createSystemLog('CREATE', 'Visitor', newVisitor._id, 'Visitor', 'Visitor created', null);

            // Reload the face matcher with the new embeddings
            loadEmbeddingsIntoMemory().then(matcher => {
                global.faceMatcher = matcher;
                console.log('FaceMatcher loaded into memory');
            });

            return res.status(200).json({ message: 'Visitor created successfully', studentID: newVisitor._id });
        }

        const bestMatch = global.faceMatcher.findBestMatch(mainDescriptor);

        if (bestMatch._label !== 'unknown') {
            return res.status(400).json({ message: 'Face already exists in the system' });
        }

        // Create the student record
        const newVisitor = await Visitor.create({
            name: visitor.name,
            address: visitor.address,
            contactNumber: visitor.contactNumber,
            email: visitor.email,
            dateOfBirth: visitor.dateOfBirth,
            organization: visitor.organization,
            pfp: pfpPath
        });

        if (!newVisitor) return res.status(400).json({ message: 'Failed to create visitor' });

        // Create the face data entry with main and supporting descriptors
        const newFace = await Face.create({
            studentID: newVisitor._id,
            isVisitor: true,
            mainDescriptor: Array.from(mainDescriptor),
            supportDescriptors: [Array.from(supportDescriptor1), Array.from(supportDescriptor2)],
        });


        // Log the creation in system logs
        await createSystemLog('CREATE', 'Visitor', newVisitor._id, 'Visitor', 'Visitor created', null);

        // Reload the face matcher with the new embeddings
        loadEmbeddingsIntoMemory().then(matcher => {
            global.faceMatcher = matcher;
            console.log('FaceMatcher loaded into memory');
        });

        return res.status(200).json({ message: 'Visitor created successfully', studentID: newVisitor._id });
    } catch (err) {
        console.log(err)
        return res.status(500).json({ message: "Internal server error" });
    } 
}


export const createVisitorLog = async (req, res) => {

    const { visitorID, purpose } = req.body;

    try {
        console.log('visitorID', visitorID)
        const visitor = await Visitor.findById(visitorID);
        if (!visitor) {
            console.log('error here')
            return res.status(404).json({ message: "Visitor not found" });
        }

        const lastLog = await VisitorLog.findOne({ visitorID: visitorID }).sort({ timeIn: -1 });
        //check if the log timeIn is 10mins ago
        if (lastLog && lastLog.timeIn) {
            const timeIn = new Date(lastLog.timeIn);
            const currentTime = new Date();
            const timeDiff = Math.abs(currentTime - timeIn);
            const minutes = Math.floor((timeDiff / 1000) / 60);
            if (minutes < 10) {
                return res.status(400).json({ message: "Visitor is already logged in a while ago" });
            }
        }


        const visitorLog = await VisitorLog.create({
            visitorID,
            timeOut: null,
            purpose
        });

        if (!visitorLog) {
            console.error("Error creating visitor log");
            return res.status(500).json({ message: "Internal server error" });
        }
    
        return res.status(201).json({ message: "Visitor log created" });

    }
    catch (error) {
        console.error("Error creating visitor log:", error);
        return res.status(500).json({ message: "Internal server error" });
    }

}