import StudentLog from "../../models/studentLog.js";
import Student from "../../models/Student.js";
import paginate from "../../helper/paginate.js";

export const getStudentLogs = async (req, res) => {
    const { page = 1, limit = 100, name = '', startDate, endDate } = req.query;

    try {
        // Initialize an empty query object
        let query = {};

        // If name is provided, search for matching student IDs from the Student collection
        if (name) {
            const students = await Student.find({
                name: { $regex: new RegExp(name, 'i') } // Case-insensitive search on the 'name' field
            }).select('_id'); // Only retrieve the student IDs

            const studentIds = students.map(student => student._id);
            query.studentID = { $in: studentIds }; // Filter logs by student IDs
        }

        // Add date range filter if provided
        if (startDate && endDate) {
            query.timeIn = { $gte: new Date(startDate), $lte: new Date(endDate) };
        } else if (startDate) {
            query.timeIn = { $gte: new Date(startDate) };
        } else if (endDate) {
            query.timeIn = { $lte: new Date(endDate) };
        }

        // Pass the populate option when calling paginate
        const logs = await paginate(StudentLog, query, {
            page, 
            limit, 
            sort: { timeIn: -1 },
            populate: { 
                path: 'studentID', // Field to populate
                select: 'name studentNumber department section' // Fields to return from the Student document
            }
        });

        // Send the result as a JSON response
        return res.status(200).json(logs);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error, message: 'Failed to fetch student logs' });
    }
};