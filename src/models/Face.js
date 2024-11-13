import { Schema, model } from "mongoose";

// Schema to store all student details with main and supporting descriptors
const faceSchema = new Schema({
    studentID: {
        type: String,
    },
    isVisitor: {
        type: Boolean,
        required: true,
        default: false,
    },
    mainDescriptor: { // Main face descriptor
        type: [Number],
        required: true,
    },
    supportDescriptors: { // Array to store two supporting descriptors
        type: [[Number]], // Array of arrays
        validate: [arrayLimit, '{PATH} must contain exactly two supporting descriptors'],
        required: true,
    }
});

// Custom validator to ensure exactly two supporting descriptors
function arrayLimit(val) {
    return val.length === 2;
}

const Face = model("Face", faceSchema);

export default Face;
