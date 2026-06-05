import express from "express";
import { EquipmentRepository } from "./repositories/equipment.repository.js";
import { EquipmentService } from "./services/equipment.service.js";
import { UserRepository } from "./repositories/user.repository.js";
import { UserService } from "./services/user.service.js";

const app = express();
app.use(express.json());

// ВБУДОВАНЕ ЛОГУВАННЯ  (метод, шлях, статус, час виконання у мс)
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`[LOG] ${req.method} ${req.originalUrl} | Status: ${res.statusCode} | ${duration}ms`);
    });
    next();
});

// Ініціалізація сервісів та репозиторіїв
const repo = new EquipmentRepository();
const service = new EquipmentService(repo);

const userRepo = new UserRepository();
const userService = new UserService(userRepo);

// ==========================================
// МАРШРУТИ ДЛЯ ОБЛАДНАННЯ (EQUIPMENT)
// ==========================================

// 1. GET /api/equipment — отримання списку (з фільтрацією за статусом)
app.get("/api/equipment", async (req, res) => {
    try {
        const status = req.query.status as string;
        const result = await service.list(status);
        res.status(200).json(result); // 200 OK і коректний JSON
    } catch (error) {
        console.error("Помилка при отриманні списку:", error);
        res.status(500).json({ error: "Внутрішня помилка сервера" });
    }
});

// 2. GET /api/equipment/:id — отримати ОДИН об'єкт за ID
app.get("/api/equipment/:id", async (req, res) => {
    try {
        const item = await service.getById(req.params.id);
        if (!item) {
            return res.status(404).json({ error: "Обладнання з таким ID не знайдено" }); // 404 за ТЗ
        }
        res.status(200).json(item);
    } catch (error) {
        console.error("Помилка при отриманні за ID:", error);
        res.status(500).json({ error: "Внутрішня помилка сервера" });
    }
});

// 3. POST /api/equipment — створити новий об'єкт
app.post("/api/equipment", async (req, res) => {
    try {
        if (!req.body || Object.keys(req.body).length === 0) {
            return res.status(400).json({ error: "Тіло запиту порожнє" }); // 400 Bad Request
        }

        if (!req.body.itemCode) {
            return res.status(400).json({ error: "Поле 'itemCode' є обов'язковим" });
        }

        const item = await service.create(req.body);
        res.status(201).json(item); // 201 Created і створений об'єкт за ТЗ
    } catch (error) {
        console.error("Помилка при створенні:", error);
        res.status(500).json({ error: "Не вдалося створити запис" });
    }
});

// 4. PUT /api/equipment/:id — замінити/оновити повністю об'єкт за ID
app.put("/api/equipment/:id", async (req, res) => {
    try {
        if (!req.body || Object.keys(req.body).length === 0) {
            return res.status(400).json({ error: "Тіло запиту порожнє" });
        }

        if (!req.body.itemCode) {
            return res.status(400).json({ error: "Поле 'itemCode' є обов'язковим для оновлення" });
        }

        const updated = await service.update(req.params.id, req.body);
        if (!updated) {
            return res.status(404).json({ error: "Обладнання з таким ID не знайдено" });
        }
        res.status(200).json(updated); // 200 OK і оновлений об'єкт
    } catch (error) {
        console.error("Помилка при оновленні:", error);
        res.status(500).json({ error: "Внутрішня помилка сервера" });
    }
});

// 5. DELETE /api/equipment/:id — видалити об'єкт за ID
app.delete("/api/equipment/:id", async (req, res) => {
    try {
        const deleted = await service.delete(req.params.id);
        if (!deleted) {
            return res.status(404).json({ error: "Обладнання з таким ID не знайдено" });
        }
        res.status(204).send(); // 204 No Content за ТЗ (без тіла відповіді)
    } catch (error) {
        console.error("Помилка при видаленні:", error);
        res.status(500).json({ error: "Внутрішня помилка сервера" });
    }
});

// ==========================================
// МАРШРУТИ ДЛЯ КОРИСТУВАЧІВ (USERS)
// ==========================================

app.get("/api/users", async (req, res) => {
    try {
        const result = await userService.list();
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: "Внутрішня помилка сервера" });
    }
});

app.get("/api/users/:id", async (req, res) => {
    try {
        const item = await userService.getById(req.params.id);
        if (!item) return res.status(404).json({ error: "Користувача не знайдено" });
        res.status(200).json(item);
    } catch (error) {
        res.status(500).json({ error: "Внутрішня помилка сервера" });
    }
});

app.post("/api/users", async (req, res) => {
    try {
        if (!req.body || Object.keys(req.body).length === 0) {
            return res.status(400).json({ error: "Тіло запиту порожнє" });
        }
        if (!req.body.email) return res.status(400).json({ error: "Поле email обов'язкове" });
        
        const item = await userService.create(req.body);
        res.status(201).json(item);
    } catch (error) {
        res.status(500).json({ error: "Внутрішня помилка сервера" });
    }
});

app.put("/api/users/:id", async (req, res) => {
    try {
        if (!req.body || Object.keys(req.body).length === 0) {
            return res.status(400).json({ error: "Тіло запиту порожнє" });
        }
        if (!req.body.email) return res.status(400).json({ error: "Поле email обов'язкове" });
        
        const updated = await userService.update(req.params.id, req.body);
        if (!updated) return res.status(404).json({ error: "Користувача не знайдено" });
        res.status(200).json(updated);
    } catch (error) {
        res.status(500).json({ error: "Внутрішня помилка сервера" });
    }
});

app.delete("/api/users/:id", async (req, res) => {
    try {
        const deleted = await userService.delete(req.params.id);
        if (!deleted) return res.status(404).json({ error: "Користувача не знайдено" });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: "Внутрішня помилка сервера" });
    }
});

// Запуск сервера
app.listen(3000, () => {
    console.log("API started on http://localhost:3000");
});