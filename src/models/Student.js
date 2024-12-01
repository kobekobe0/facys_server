import { Schema, model } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const studentSchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    schedule: {
        type:[[String]],
        required: true,
    },
    studentNumber: {
        type: String,
        required: true,
        unique: true,
    },
    department: {
        type: String,
        required: true,
    },
    completeRegistration: {
        type: Boolean,
        required: true,
        default: false,
    },
    deleted: {
        type: Boolean,
        required: true,
        default: false,
    },
    degree: {
        type: String,
    },
    section: {
        type: String,
    },
    yearLevel: {
        type: String,
    },
    SY: {
        type: String,
    },
    dateOfBirth: {
        type: String,
        required: true,
    },
    registrationPicture: {
        type: String,
    },
    isBlocked: {
        type: Boolean,
        required: true,
        default: false,
    },
    password: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    guardianEmail: {
        type: String,
        required: true,
    },
    updated: {
        type: Boolean,
        required: true,
        default: true,
    }, //for cor
    pfp: {
        type: String,
        default: null
    },
    sex: {
        type: String,
        required: true,
        default: 'M'
    }
});

// Add the pagination plugin to the schema
studentSchema.plugin(mongoosePaginate);

const Student = model("Student", studentSchema);

export default Student;
