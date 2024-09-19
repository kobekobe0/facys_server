import jwt from 'jsonwebtoken';

// Replace this with your actual secret key
const SECRET_KEY = process.env.SECRET_KEY;

/**
 * Generates an authentication token for a given user.
 *
 * @param {Object} user - The user object containing information for the token.
 * @param {string} role - The role of the user ('Student', 'Admin', 'SecurityGuard').
 * @returns {string} - The generated JWT.
 */
const generateAuthToken = (user, role) => {
    let payload;

    switch (role) {
        case 'Student':
            payload = {
                role: 'Student',
                name: user.name,
                studentNumber: user.studentNumber,
                _id: user._id,
            };
            break;

        case 'Admin':
            payload = {
                role: 'Admin',
                _id: user._id,
            };
            break;

        case 'SecurityGuard':
            payload = {
                role: 'SecurityGuard',
                name: {
                    first: user.name.first,
                    middle: user.name.middle,
                    last: user.name.last,
                    suffix: user.name.suffix,
                },
                _id: user._id,
            };
            break;

        default:
            throw new Error('Invalid role');
    }

    return jwt.sign(payload, SECRET_KEY, { expiresIn: '1y' }); // Token expires in 1 hour
};

export default generateAuthToken;
