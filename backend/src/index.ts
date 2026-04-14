import express from "express";
import { EquipmentRepository } from "./repositories/equipment.repository.js";
import { EquipmentService } from "./services/equipment.service.js";

const app = express();
app.use(express.json()); 

const repo = new EquipmentRepository();
const service = new EquipmentService(repo);

// Маршрути 
app.get("/api/equipment", async (req, res) => {
    try {
        const status = req.query.status as string;
        const result = await service.list(status);
        res.status(200).json(result); // 200 OK
    } catch (error) {
        console.error("Помилка при отриманні списку:", error);
        res.status(500).json({ error: "Внутрішня помилка сервера" }); // 500 Internal Server Error
    }
});

app.post("/api/equipment", async (req, res) => {
    try {
        // Перевірка наявності даних у тілі запиту (Валідація)
        if (!req.body || Object.keys(req.body).length === 0) {
            return res.status(400).json({ error: "Тіло запиту порожнє" }); // 400 Bad Request
        }

        // Приклад перевірки обов'язкового поля 
        if (!req.body.name) {
            return res.status(400).json({ error: "Поле 'name' є обов'язковим" }); // 400 Bad Request
        }

        const item = await service.create(req.body);
        res.status(201).json(item); // 201 Created
    } catch (error) {
        console.error("Помилка при створенні:", error);
        res.status(500).json({ error: "Не вдалося створити запис" }); // 500 Internal Server Error
    }
});

app.listen(3000, () => console.log("API started on http://localhost:3000")); //