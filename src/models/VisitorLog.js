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

const visitorLogSchema = new Schema({
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
    purpose: {
        type: String,
        required: true,
    },
    vehicle: {
        type: String,
    },
    plateNumber: {
        type: String,
    },
}); 

visitorLogSchema.plugin(mongoosePaginate);

const VisitorLog = model("VisitorLog", visitorLogSchema);

export default VisitorLog;