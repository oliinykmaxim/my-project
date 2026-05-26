import express from "express";
import { migrate } from "./db/migrate.js"; 
import { EquipmentRepository } from "./repositories/equipment.repository.js";

const app = express();
app.use(express.json()); 

const repo = new EquipmentRepository();

// ==========================================
// 1. CRUD МАРШРУТИ З ЛР№2 (Переведені на SQL)
// ==========================================

// GET ALL (Отримання списку обладнання з фільтрацією та сортуванням)
app.get("/api/equipment", async (req, res) => {
    try {
        const status = req.query.status as string;
        const userId = req.query.userId as string;
        const sort = req.query.sort as string;
        const order = req.query.order as string;

        // Викликаємо оновлений метод репозиторію з параметрами фільтрації
        const result = await repo.getAll({ status, userId }, { column: sort, order });
        res.status(200).json({ data: result }); 
    } catch (error) {
        console.error("Помилка при отриманні списку:", error);
        res.status(500).json({ error: "Внутрішня помилка сервера" }); 
    }
});

// POST CREATE (Створення нового обладнання)
app.post("/api/equipment", async (req, res) => {
    try {
        if (!req.body || Object.keys(req.body).length === 0) {
            return res.status(400).json({ error: "Тіло запиту порожнє" }); 
        }

        const { code, name, status, userId } = req.body;
        if (!code || !name || !status || !userId) {
            return res.status(400).json({ error: "Поля code, name, status та userId є обов'язковими" }); 
        }

        // Передаємо правильний об'єкт, який очікує наш репозиторій
        const item = await repo.create({ code, name, status, userId: Number(userId) });
        res.status(201).json({ data: item }); 
    } catch (error: any) {
        console.error("Помилка при створенні:", error);
        
        if (error.message && error.message.includes("UNIQUE constraint failed")) {
            return res.status(409).json({ error: "Обладнання з таким кодом (code) вже існує" });
        }
        res.status(500).json({ error: "Не вдалося створити запис" }); 
    }
});

// ==========================================
// 2. НОВІ ЕНДПОІНТИ (Вимога на "Відмінно")
// ==========================================

// GET BY ID + JOIN (Отримання техніки разом із даними користувача)
app.get("/api/equipment/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (isNaN(id)) return res.status(400).json({ error: "ID має бути числом" });

        // Метод тепер викликається успішно, бо типи збігаються
        const item = await repo.getWithUser(id);
        if (!item) return res.status(404).json({ error: "Обладнання не знайдено" });

        res.status(200).json({ data: item });
    } catch (error) {
        console.error("Помилка при отриманні за ID:", error);
        res.status(500).json({ error: "Внутрішня помилка сервера" });
    }
});

// GET AGGREGATION STATS (Статистика вартості ремонтів з третьої таблиці)
app.get("/api/equipment-stats/maintenance", async (req, res) => {
    try {
        const stats = await repo.getMaintenanceStats();
        res.status(200).json({ data: stats });
    } catch (error) {
        console.error("Помилка при отриманні статистики:", error);
        res.status(500).json({ error: "Внутрішня помилка сервера" });
    }
    });
    // GET VULNERABLE SEARCH (Демонстраційний ендпоінт для тестування SQL-ін'єкцій)
app.get("/api/equipment-security/search", async (req, res) => {
    try {
        const query = (req.query.q as string) || "";
        const result = await repo.searchVulnerable(query);
        res.status(200).json({ data: result });
    } catch (error) {
        console.error("Помилка пошуку:", error);
        res.status(500).json({ error: "Помилка виконання SQL-запиту" });
    }
});

// PUT UPDATE (Оновлення інформації)
app.put("/api/equipment/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (isNaN(id)) return res.status(400).json({ error: "ID має бути числом" });

        const { name, status } = req.body;
        if (!name || !status) return res.status(400).json({ error: "Поля name та status обов'язкові" });

        const updated = await repo.update(id, { name, status });
        if (!updated) return res.status(404).json({ error: "Обладнання не знайдено" });

        res.status(200).json({ data: updated });
    } catch (error) {
        res.status(500).json({ error: "Внутрішня помилка сервера" });
    }
});

// DELETE (Видалення запису)
app.delete("/api/equipment/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (isNaN(id)) return res.status(400).json({ error: "ID має бути числом" });

        const deleted = await repo.delete(id);
        if (!deleted) return res.status(404).json({ error: "Обладнання не знайдено" });

        res.status(204).send(); 
    } catch (error) {
        res.status(500).json({ error: "Внутрішня помилка сервера" });
    }
});

// ==========================================
// 3. АСИНХРОННИЙ БУТСТРАП СИСТЕМИ ТА МІГРАЦІЙ
// ==========================================
async function startServer() {
    try {
        console.log("Запуск перевірки схеми та міграцій БД...");
        await migrate();

        app.listen(3000, () => {
            console.log("🚀🚀🚀 API started on http://localhost:3000");
        });
    } catch (error) {
        console.error("🔴 Критична помилка при запуску сервера:", error);
        process.exit(1);
    }
}

startServer();