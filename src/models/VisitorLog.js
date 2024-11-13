import { Schema, model } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const visitorLogSchema = new Schema({
    visitorID: {
        type: String,
        required: true,
        ref: "Visitor",
    },
    timeIn : {
        type: Date,
        required: true,
        default: Date.now
    },
    purpose: {
        type: String,
        required: true,
    },
}); 

visitorLogSchema.plugin(mongoosePaginate);

const VisitorLog = model("VisitorLog", visitorLogSchema);

export default VisitorLog;