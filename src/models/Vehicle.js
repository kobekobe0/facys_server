import { Schema, model } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const vehicleSchema = new Schema({
    model: {
        type: String,
        required: true,
    },
    plateNumber: {
        type: String,
        required: true,
    },
    color: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        required: true,
    },
    studentID: {
        type: String,
        required: true,
        ref: 'Student'
    },
    deleted: {
        type: Boolean,
        default: false,
    },
}); 

vehicleSchema.plugin(mongoosePaginate);

const Vehicle = model("Vehicle", vehicleSchema);

export default Vehicle;