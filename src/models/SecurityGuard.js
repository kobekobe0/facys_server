import { Schema, model } from "mongoose";
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
})

const SecurityGuardSchema = new Schema({
    name : {
        type: nameSchema,
        required: true,
    },
    username: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
}); 

const SecurityGuard = model("SecurityGuard", SecurityGuardSchema);

export default SecurityGuard;