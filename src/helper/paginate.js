import mongoosePaginate from 'mongoose-paginate-v2';

/**
 * Helper function to paginate Mongoose models with dynamic search functionality.
 *
 * @param {Model} model - The Mongoose model to paginate.
 * @param {Object} query - The query object to filter the documents.
 * @param {Object} options - Pagination options including page, limit, sort, select, and populate.
 * @param {string} search - Search term for relevant fields.
 * @returns {Object} - The paginated result including docs, totalDocs, totalPages, etc.
 */
const paginate = async (model, query = {}, options = {}, search = '') => {
    // Default pagination options
    const defaultOptions = {
        page: 1,
        limit: 100,
        sort: { _id: -1 },  // Default sort order by ID (descending)
        select: '',         // Fields to include or exclude (e.g., '-deleted')
        lean: true,         // Return plain JavaScript objects
        leanWithId: false,  // Include the id field in lean queries
        populate: ''        // Option to populate referenced fields
    };

    // Modify the query based on the search term and model type
    if (search) {
        const modelName = model.modelName;

        // Adjust the query based on the model's name and relevant fields
        switch (modelName) {
            case 'Student':
                query.$or = [
                    { 'name': { $regex: new RegExp(search, 'i') } },
                ];
                break;

            case 'StudentLog':
                query.$or = [
                    { studentNumber: { $regex: new RegExp(search, 'i') } },
                    { logType: { $regex: new RegExp(search, 'i') } }
                ];
                break;

            default:
                // Default search behavior for other models
                query.$text = { $search: search };
                break;
        }
    }

    // Merge the provided options with the default options, allowing for populate
    const paginationOptions = { ...defaultOptions, ...options };

    try {
        // Call mongoose-paginate-v2's paginate function with the query and options
        const result = await model.paginate(query, paginationOptions);
        return result;
    } catch (error) {
        throw new Error(`Error in pagination: ${error.message}`);
    }
};

export default paginate;
