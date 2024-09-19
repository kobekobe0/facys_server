import { Schema, model } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const SystemLogSchema = new Schema({
    date: {
        type: Date,
        required: true,
        default: Date.now
    },
    description: {
        type: String,
        required: true,
    },
    action: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        required: true,
    },
    entityID: {
        type: String,
        required: true,
        refPath: 'entityType'
    },
    entityType: {
        type: String,
        required: true,
        enum: ['Student', 'SecurityGuard', 'Admin']
    },
    attachment: {
        type: String,
    }
}); 

SystemLogSchema.plugin(mongoosePaginate);

const SystemLog = model("SystemLog", SystemLogSchema);

export default SystemLog;