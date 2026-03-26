import express from "express";
import { EquipmentRepository } from "./repositories/equipment.repository.js";
import { EquipmentService } from "./services/equipment.service.js";

const app = express();
app.use(express.json()); // Обов'язково для роботи з JSON 

const repo = new EquipmentRepository();
const service = new EquipmentService(repo);

// Маршрути (Routes + Controllers) 
app.get("/api/equipment", async (req, res) => {
    const status = req.query.status as string;
    const result = await service.list(status);
    res.status(200).json(result); // 200 OK 
});

app.post("/api/equipment", async (req, res) => {
    const item = await service.create(req.body);
    res.status(201).json(item); // 201 Created 
});

app.listen(3000, () => console.log("API started on http://localhost:3000")); // 