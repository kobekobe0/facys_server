import mongoosePaginate from "mongoose-paginate-v2";

/**
 * Helper function to paginate Mongoose models with search functionality.
 *
 * @param {Model} model - The Mongoose model to paginate.
 * @param {Object} query - The query object to filter the documents.
 * @param {Object} options - Pagination options including page, limit, sort, and select.
 * @param {string} search - Search term for relevant fields.
 * @returns {Object} - The paginated result including docs, totalDocs, totalPages, etc.
 */
const paginate = async (model, query = {}, options = {}, search = '') => {
    const defaultOptions = {
        page: 1,
        limit: 100,
        sort: { _id: -1 },
        select: '',       // Fields to include or exclude (e.g., '-deleted')
        lean: true,       // Return plain JavaScript objects instead of Mongoose documents
        leanWithId: false // Include the id field in lean queries
    };

    // Dynamically adjust the query based on the model
    if (search) {
        const modelName = model.modelName;
        console.log(modelName)

        switch (modelName) {
            case 'Student':
            case 'StudentLog':
            case 'Violation':
                query.studentNumber = { $regex: new RegExp(search, 'i') }; // Case-insensitive search
                break;

            case 'Visitor':
                query.$or = [
                    { 'name.first': { $regex: new RegExp(search, 'i') } },
                    { 'name.middle': { $regex: new RegExp(search, 'i') } },
                    { 'name.last': { $regex: new RegExp(search, 'i') } }
                ];
                break;

            case 'Vehicle':
                query.plateNumber = { $regex: new RegExp(search, 'i') }; // Case-insensitive search
                break;

            default:
                // Handle other models or ignore search
                break;
        }
    }

    const paginationOptions = { ...defaultOptions, ...options };

    try {
        const result = await model.paginate(query, paginationOptions);
        return result;
    } catch (error) {
        throw new Error(`Error in pagination: ${error.message}`);
    }
};

export default paginate;
