import { Schema, model } from "mongoose";

const adminSchema = new Schema({
    password: {
        type: String,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    }
}); 

const Admin = model("Admin", adminSchema);

export default Admin;