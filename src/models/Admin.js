import { Schema, model } from "mongoose";

const adminSchema = new Schema({
    password: {
        type: String,
        required: true,
    },
    username: {
        type: String,
        required: true,
    },
}); 

const Admin = model("Admin", adminSchema);

export default Admin;