import { Schema, model } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const studentLogSchema = new Schema({
    studentID : {
        type: String,
        ref: 'Student'
    },
    studentNumber: {
        type: String,
    },
    fullName: {
        type: String,
        required: true,
    },
    department: {
        type: String,
        required: true,
    },
    timeIn : {
        type: Date,
        required: true,
    },
    timeOut : {
        type: Date,
    },
    vehicle: {
        type: String,
        ref: 'Vehicle'
    }
}); 

studentLogSchema.plugin(mongoosePaginate);

const StudentLog = model("StudentLog", studentLogSchema);

export default StudentLog;