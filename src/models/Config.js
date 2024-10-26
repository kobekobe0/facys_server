import { Schema, model } from "mongoose";

const configSchema = new Schema({
    departments: {
        type: [String],
        required: true,
    },
}); 

const Config = model("Config", configSchema);

export default Config;