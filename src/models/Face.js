import { Schema, model } from "mongoose";

//just store here all student details
const faceSchema = new Schema({
    studentID : {
        type: String,
        required: true,
    },
    descriptor: {
        type: [Number],
        required: true,
    }
}); 

const Face = model("Face", faceSchema);

export default Face;