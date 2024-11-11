import StudentLog from "../../models/StudentLog.js";
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


export const getStudentLogsById = async (req, res) => {
    const { id } = req.params;
    const { page = 1, limit = 100, startDate, endDate } = req.query;

    try {
        // Construct the date range filter if startDate or endDate are provided
        const dateFilter = {};
        if (startDate) dateFilter.$gte = new Date(startDate);
        if (endDate) dateFilter.$lte = new Date(endDate);

        // Combine filters: studentID and optional timeIn date range
        const query = { studentID: id };
        if (startDate || endDate) query.timeIn = dateFilter;

        const logs = await paginate(StudentLog, query, {
            page,
            limit,
            sort: { timeIn: -1 },
            populate: {
                path: 'studentID',
                select: 'name studentNumber department section',
            },
        });

        return res.status(200).json(logs);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error, message: 'Failed to fetch student logs' });
    }
};


export const getNumberOfTotalLogs = async (req, res) => {
    try {
        const {id} = req.params;
        const logs = await StudentLog.find({studentID: id}).countDocuments();
        return res.status(200).json({logs});
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error, message: 'Failed to fetch student logs' });
    }
}


export const getNumbers = async (req, res) => {
    //logs today
    //unique logs today (per studentID, per day)

    try {
        const today = new Date();
        // const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        // const end = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

        const start = new Date(today);
        start.setDate(today.getDate() - 1); // 13 days before today to get a range of 14 full days + today

        // Set endDate to the end of today by adding one day
        const end = new Date(today);
        end.setDate(today.getDate() + 1);

        // Count all logs for today
        const logsToday = await StudentLog.find({
            timeIn: { $gte: start, $lt: end }
        }).countDocuments();

        // Count unique logs for today (grouped by studentID and date)
        const uniqueLogsToday = await StudentLog.aggregate([
            {
                $match: {
                    timeIn: { $gte: start, $lt: end }
                }
            },
            {
                $group: {
                    _id: {
                        studentID: "$studentID", // Group by studentID
                        date: { $dateToString: { format: "%Y-%m-%d", date: "$timeIn" } } // Group by date part only
                    }
                }
            },
            {
                $count: "uniqueLogs" // Count the number of unique studentID-date pairs
            }
        ]);

        // Return the counts
        return res.status(200).json({
            logsToday,
            uniqueLogsToday: uniqueLogsToday.length > 0 ? uniqueLogsToday[0].uniqueLogs : 0
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error, message: 'Failed to fetch student logs' });
    }
};


export const getLast15DaysNumbers = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Set to midnight in local time

        const startDate = new Date(today);
        startDate.setDate(today.getDate() - 13); // 13 days before today to get a range of 14 full days + today

        // Set endDate to the end of today by adding one day
        const endDate = new Date(today);
        endDate.setDate(today.getDate() + 1); // Midnight at the beginning of the next day

        // Fetch logs grouped by date for the last 15 days with timezone adjustment
        const logs = await StudentLog.aggregate([
            {
                $match: {
                    timeIn: { $gte: startDate, $lt: endDate } // Fetch logs up to the end of today
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: "%Y-%m-%d",
                            date: "$timeIn",
                            timezone: "Asia/Manila" // Ensure dates are grouped by your timezone
                        }
                    },
                    count: { $sum: 1 } // Count logs per day
                }
            },
            {
                $sort: { "_id": 1 } // Sort by date in ascending order
            }
        ]);

        // Create a map of the actual log data for quick lookup
        const logDataMap = new Map(logs.map(log => [log._id, log.count]));

        // Generate the last 15 days with counts initialized to 0
        const data = [];
        for (let i = 13; i >= -1; i--) { // -1 to include today
            const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
            const dateString = date.toISOString().split('T')[0]; // Format as YYYY-MM-DD

            // If the date exists in logDataMap, use its count; otherwise, use 0
            data.push({ date: dateString, count: logDataMap.get(dateString) || 0 });
        }

        return res.status(200).json(data);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error, message: 'Failed to fetch student logs' });
    }
};
