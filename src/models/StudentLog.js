import { Schema, model } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const studentLogSchema = new Schema({
    studentID : {
        type: String,
        ref: 'Student'
    },
    timeIn : {
        type: Date,
        required: true,
        default: Date.now
    },
    timeOut : {
        type: Date,
    }
}); 

studentLogSchema.plugin(mongoosePaginate);

const StudentLog = model("StudentLog", studentLogSchema);

export default StudentLog;