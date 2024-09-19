import express from "express";
import { createVehicle, deleteVehicle, updateVehicle } from "../controllers/mutation/vehicle.mutation.js";
import { studentAuth } from "../middleware/studentAuth.js";
import { getStudentVehicles, getVehicle, getVehicles } from "../controllers/query/vehicle.query.js";

const vehicleRouter = express.Router();

vehicleRouter.post('/create', studentAuth, createVehicle);
vehicleRouter.put('/update/:id', studentAuth, updateVehicle);
vehicleRouter.delete('/delete/:id', studentAuth, deleteVehicle);

vehicleRouter.get("/all", getVehicles);
vehicleRouter.get("/vehicle/:id", getVehicle);
vehicleRouter.get("/student/:id", getStudentVehicles);


export default vehicleRouter;