import * as dotenv from "dotenv";
import express from "express";
import connectToMongoDB from "./config/database.js";
import cors from "cors";
import createSocketServer from "./config/socket.js";

import path,  { dirname } from 'path';
import { fileURLToPath } from 'url';
import { sanitizeObjectWithTrimMiddleware } from "./helper/sanitizeData.js";
import { exec } from "child_process";

import mongoose from "mongoose";
import studentRouter from "./routes/Student.js";
import vehicleRouter from "./routes/Vehicle.js";
import resetPasswordRouter from "./routes/ResetPassword.js";
import loadEmbeddingsIntoMemory from "./config/loadfaces.js";
import createDefaultAdmin from "./helper/createDefaultAdmin.js";
import adminRouter from "./routes/Admin.js";
import faceRouter from "./routes/Face.js";
import studentLogRouter from "./routes/StudentLog.js";
import configRouter from "./routes/Config.js";
import createDefaultConfig from "./helper/createDefaultAdmin copy.js";
import visitorRouter from "./routes/Visitor.js";

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // Optional: You can exit the process here if you want Railway to restart it
    // process.exit(1);
});
  
// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception thrown:', error);
    // Optional: You can exit the process here as well
    // process.exit(1);
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

global.faceMatcher = null;

dotenv.config();

connectToMongoDB();

const app = express();


const port = process.env.PORT || 4000;
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const corsOptions = {
    origin: [
        "https://localhost:3000",
        "https://localhost:3000/",
        "http://localhost:5173",
	    "http://192.168.100.104",
        "http://localhost:5173/",
        "http://192.168.1.242",
        "https://192.168.100.17:3000",
        "https://192.168.100.17:3000/",
	    "https://facys.vercel.app/",
        "https://facys.vercel.app",
        "*"
    ],
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
    optionsSuccessStatus: 204
};

createDefaultAdmin();
createDefaultConfig();

app.use(cors(corsOptions));

app.use('/images', express.static(path.join(__dirname)));

const io = createSocketServer(app, port);

// Start the server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});

app.get("/", (req, res) => {
    res.send("Hello World!");
});

app.use(sanitizeObjectWithTrimMiddleware)

app.use("/api/student", studentRouter)
app.use("/api/vehicle", vehicleRouter)
app.use("/api/reset-password", resetPasswordRouter)
app.use("/api/admin", adminRouter)
app.use("/api/face", faceRouter)
app.use("/api/log", studentLogRouter)
app.use("/api/config", configRouter)
app.use("/api/visitor", visitorRouter)


loadEmbeddingsIntoMemory().then(matcher => {
    global.faceMatcher = matcher;
    console.log('FaceMatcher loaded into memory');
});


app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send("Something went wrong!");
});

export { io };

