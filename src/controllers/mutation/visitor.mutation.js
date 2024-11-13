import Visitor from '../../models/Visitor.js'
import Face from '../../models/Face.js'
import loadEmbeddingsIntoMemory from '../../config/loadfaces.js';
import { createSystemLog } from '../../middleware/createSystemLog.js';
import VisitorLog from '../../models/VisitorLog.js';
import Admin from '../../models/Admin.js';
import bcrypt from 'bcryptjs';
import SystemLog from '../../models/SystemLog.js';
import paginate from "../../helper/paginate.js";

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

export const deleteVisitor = async (req, res) => {
    const {id} = req.params
    const {password} = req.query
    const {_id} = req.user

    const admin = await Admin.findById(_id)
    if(!admin) return res.status(404).json({ message: "Admin not found" });

    console.log(password)

    const isMatch = await bcrypt.compare(password, admin.password);
    if(!isMatch) return res.status(400).json({ message: "Invalid password" });

    try {
        const visitor = await Visitor.findById(id);
        if(!visitor) return res.status(404).json({ message: "Visitor not found" });

        await VisitorLog.deleteMany({visitorID: id})
        await SystemLog.deleteMany({entityID: id})
        await Face.deleteOne({studentID: id})
        await Visitor.deleteOne({_id: id})

        await createSystemLog('DELETE', 'Visitor', id, 'Visitor', 'Visitor deleted', null);

        loadEmbeddingsIntoMemory().then(matcher => {
            global.faceMatcher = matcher;
            console.log('FaceMatcher loaded into memory');
        })

        return res.status(200).json({ message: 'Visitor deleted successfully' });

    } catch (error) {

    }

}


export const getVisitors = async (req, res) => {
    try {
        const { page, limit, name } = req.query;
        const options = {
            page: parseInt(page, 10) || 1,
            limit: parseInt(limit, 10) || 10,
            sort: { createdAt: -1 },
        };

        // Build query with name filter if provided
        let query = {};
        if (name) {
            query['name'] = { $regex: name, $options: 'i' }; // Case-insensitive search
        }

        const visitors = await Visitor.paginate(query, options);

        return res.status(200).json(visitors);
    } catch (err) {
        console.error("Error getting visitors:", err);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const getVisitorLogs = async (req, res) => {
    try {
        const {page, limit, name, startDate, endDate} = req.query;

        let query = {};

        if (name) {
            const visitors = await Visitor.find({
                name: { $regex: new RegExp(name, 'i') } 
            }).select('_id'); 

            const visitorIds = visitors.map(visitor => visitor._id);
            query.visitorID = { $in: visitorIds }; 
        }

        if (startDate && endDate) {
            query.timeIn = { $gte: new Date(startDate), $lte: new Date(endDate) };
        } else if (startDate) {
            query.timeIn = { $gte: new Date(startDate) };
        } else if (endDate) {
            query.timeIn = { $lte: new Date(endDate) };
        }

        const logs = await paginate(
            VisitorLog, 
            query, 
            {
                page, 
                limit, 
                sort: { timeIn: -1 },
                populate: {
                    path: 'visitorID',
                    select: 'name address contactNumber email'
                }
            }
        )

        return res.status(200).json(logs);
    } catch (err) {
        console.error("Error getting visitor logs:", err);
        return res.status(500).json({ message: "Internal server error" });

    }
}
