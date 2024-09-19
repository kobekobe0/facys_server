import { Schema, model } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const nameSchema = new Schema({
    first: {
        type: String,
        required: true,
    },
    last: {
        type: String,
        required: true,
    },
    middle: {
        type: String,
    },
    suffix: {
        type: String,
    },
});

const violationLogSchema = new Schema({
    name: {
        type: nameSchema,
        required: true,
    },
    timeIn : {
        type: Date,
        required: true,
        default: Date.now
    },
    timeOut : {
        type: Date,
    },
    violation: {
        type: String,
        required: true,
    },
    vehicle: {
        type: String,
    },
    studentNumber: {
        type: String,
    },
}); 

violationLogSchema.plugin(mongoosePaginate);

const ViolationLog = model("ViolationLog", violationLogSchema);

export default ViolationLog;