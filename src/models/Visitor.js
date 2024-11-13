import { Schema, model } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";

const visitorSchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    address: {
        type: String,
        required: true,
    },
    contactNumber: {
        type: String,
        required: true,
    },
    email: {
        type: String,
    },
    dateOfBirth: {
        type: Date,
        required: true,
    },
    organization: {
        type: String,
    },
    deleted: {
        type: Boolean,
        required: true,
        default: false,
    },
    pfp: {
        type: String,
        default: null
    }
});

// Add the pagination plugin to the schema
visitorSchema.plugin(mongoosePaginate);

const Visitor = model("Visitor", visitorSchema);

export default Visitor;
