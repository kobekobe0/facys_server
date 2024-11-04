import { Schema, model } from "mongoose";

const configSchema = new Schema({
    departments: {
        type: [String],
        required: true,
    },
    SY: {
        type: String,
        required: true,
        default: 'AY 2024 - 2025 1st Semester'
    },
}); 

const Config = model("Config", configSchema);

export default Config;