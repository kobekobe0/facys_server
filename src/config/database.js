import * as dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";

const connectToMongoDB = () => {
    mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });

    mongoose.connection.once("open", () => {
        console.log("Connected to MongoDB");
    });
};

const db = mongoose.connection;

db.on("error", console.error.bind(console, "MongoDB connection error"));

export default connectToMongoDB;
