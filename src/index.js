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
	    "*"
    ],
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
    optionsSuccessStatus: 204
};

createDefaultAdmin();

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

//prevent writes during sync
//app.use(preventWritesDuringSync);

app.use(sanitizeObjectWithTrimMiddleware)

app.use("/api/student", studentRouter)
app.use("/api/vehicle", vehicleRouter)
app.use("/api/reset-password", resetPasswordRouter)
app.use("/api/admin", adminRouter)
app.use("/api/face", faceRouter)

loadEmbeddingsIntoMemory().then(matcher => {
    global.faceMatcher = matcher;
    console.log('FaceMatcher loaded into memory');
});

//shutdown
// app.post('/api/shutdown', (req, res) => {
//     console.log('Shutting down server');
//     try{
//         exec('sudo /sbin/shutdown -h now', (error, stdout, stderr) => {
//             if (error) {
//                 console.error(`Error executing shutdown: ${error}`);
//                 return res.status(500).json({ message: 'Failed to shut down server' });
//             }
//             res.status(200).json({ message: 'Server is shutting down' });
//         });
//     } catch (error) {
//         console.error(error);
//         return res.status(500).json({ message: 'Failed to shut down server' });
//     }
// });

app.post('/api/backup', async (req, res) => {
    try {
        // Get all collections
        const collections = await mongoose.connection.db.listCollections().toArray();
    
        // Connect to remote DB
        const remoteDB = await mongoose.createConnection(process.env.BACKUP_PATH, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        }).asPromise();
    
        // Drop all collections in remote DB
        for (let collection of collections) {
            try {
                await remoteDB.db.dropCollection(collection.name);
            } catch (error) {
                // Log error but continue to backup other collections
                console.error(`Failed to drop collection ${collection.name}: ${error}`);
            }
        }
    
        // Copy all collections
        for (let collection of collections) {
            const cursor = mongoose.connection.db.collection(collection.name).find();
            const data = await cursor.toArray();
            
            // Insert data only if it's not empty
            if (data.length > 0) {
                try {
                    await remoteDB.db.collection(collection.name).insertMany(data);
                } catch (error) {
                    console.error(`Failed to insert data into collection ${collection.name}: ${error}`);
                }
            }
        }
    
        // Close remote DB
        await remoteDB.close();
    
        return res.status(200).json({ message: 'Database backup successful' });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Failed to backup database' });
    }
});




app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send("Something went wrong!");
});

export { io };

