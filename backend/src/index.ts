import express from "express";
import cors from "cors";
import { migrate } from "./db/migrate.js"; 
import { all } from "./db/dbClient.js"; // Оцієї стрічки якраз не вистачало на самому верху!
import { EquipmentRepository } from "./repositories/equipment.repository.js";
import { EquipmentService } from "./services/equipment.service.js";
import { UserRepository } from "./repositories/user.repository.js";
import { UserService } from "./services/user.service.js";

// Імпортуємо MAINTENANCE 
import { MaintenanceRepository } from "./repositories/maintenance.repository.js";
import { MaintenanceService } from "./services/maintenance.service.js";

const app = express();
app.use(express.json());

const allowedOrigins = [
    "http://localhost:5500",
    "http://127.0.0.1:5500",
    "http://localhost:5173",
    "http://127.0.0.1:5173"
];

app.use(cors({
    origin: (origin: any, callback: any) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("CORS-блокування: Цей Origin не дозволений конфігурацією вайтліста."));
        }
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

app.options("*", cors());

// ВБУДОВАНЕ ЛОГУВАННЯ  (метод, шлях, status, час виконання у мс)
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

const maintenanceRepo = new MaintenanceRepository();
const maintenanceService = new MaintenanceService(maintenanceRepo);

// ==========================================
// МАРШРУТИ ДЛЯ ОБЛАДНАННЯ (EQUIPMENT)
// ==========================================

// 1. GET /api/equipment — отримання списку (з фільтрацією за статусом)
// 1. GET /api/equipment — отримання списку (з фільтрацією, сортуванням та лімітами за ТЗ)
app.get("/api/equipment", async (req, res) => {
    try {
        const status = req.query.status as string;
        const sort = req.query.sort as string;
        const order = req.query.order as 'asc' | 'desc';
        const limit = req.query.limit as string;

        // Передаємо всі параметри в сервіс, закриваючи пункти 13 та 19
        const result = await service.list(status, sort, order, limit);
        res.status(200).json(result); 
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

// ==========================================
// МАРШРУТИ ДЛЯ ЛОГІВ РЕМОНТУ (MAINTENANCE LOGS) -> Сутність №3
// ==========================================

app.get("/api/maintenance", async (req, res) => {
    try {
        const result = await maintenanceService.list();
        res.status(200).json(result);
    } catch (error) {
        console.error("Помилка при отриманні логів ремонту:", error);
        res.status(500).json({ error: "Внутрішня помилка сервера" });
    }
});

app.get("/api/maintenance/:id", async (req, res) => {
    try {
        const item = await maintenanceService.getById(req.params.id);
        if (!item) return res.status(404).json({ error: "Запис ремонту не знайдено" });
        res.status(200).json(item);
    } catch (error) {
        console.error("Помилка при отриманні логу за ID:", error);
        res.status(500).json({ error: "Внутрішня помилка сервера" });
    }
});

app.post("/api/maintenance", async (req, res) => {
    try {
        if (!req.body || Object.keys(req.body).length === 0) {
            return res.status(400).json({ error: "Тіло запиту порожнє" });
        }
        if (!req.body.equipmentId) {
            return res.status(400).json({ error: "Поле 'equipmentId' є обов'язковим" });
        }
        if (req.body.cost === undefined || req.body.cost < 0) {
            return res.status(400).json({ error: "Поле 'cost' обов'язкове і має бути >= 0" });
        }
        
        const item = await maintenanceService.create(req.body);
        res.status(201).json(item);
    } catch (error) {
        console.error("Помилка при створенні логу ремонту:", error);
        res.status(500).json({ error: "Внутрішня помилка сервера" });
    }
});

app.put("/api/maintenance/:id", async (req, res) => {
    try {
        if (!req.body || Object.keys(req.body).length === 0) {
            return res.status(400).json({ error: "Тіло запиту порожнє" });
        }
        if (!req.body.equipmentId) {
            return res.status(400).json({ error: "Поле 'equipmentId' є обов'язковим для оновлення" });
        }

        const updated = await maintenanceService.update(req.params.id, req.body);
        if (!updated) return res.status(404).json({ error: "Запис ремонту не знайдено" });
        res.status(200).json(updated);
    } catch (error) {
        console.error("Помилка при оновленні логу ремонту:", error);
        res.status(500).json({ error: "Внутрішня помилка сервера" });
    }
});

app.delete("/api/maintenance/:id", async (req, res) => {
    try {
        const deleted = await maintenanceService.delete(req.params.id);
        if (!deleted) return res.status(404).json({ error: "Запис ремонту не знайдено" });
        res.status(204).send();
    } catch (error) {
        console.error("Помилка при видаленні логу ремонту:", error);
        res.status(500).json({ error: "Внутрішня помилка сервера" });
    }
});

// ==========================================
// ДОДАТКОВІ ЕНДПОІНТИ ЗА ЧЕК-ЛИСТОМ (АНАЛІТИКА ТА ЗАХИСТ)
// ==========================================

// 1. Ендпоінт із JOIN (Пункт 25, 34) — Отримати заявки разом із даними користувача з таблиці Users
app.get("/api/analytics/requests-with-users", async (req, res) => {
    try {
        
        const sql = `
            SELECT e.id as requestId, e.code as itemCode, e.name as applicationUserName, 
                   e.status, u.name as dbUserName, u.email as dbUserEmail
            FROM Equipment e
            LEFT JOIN Users u ON e.userId = u.id
        `;
        const result = await all(sql);
        res.status(200).json({ data: result });
    } catch (error) {
        res.status(500).json({ error: "Не вдалося виконати JOIN запит" });
    }
});

// 2. Ендпоінт із Агрегацією (Пункт 34, 37) — Рахуємо кількість заявок за кожним статусом за допомогою COUNT
app.get("/api/analytics/status-count", async (req, res) => {
    try {
       
        const sql = `SELECT status, COUNT(*) as count FROM Equipment GROUP BY status`;
        const result = await all(sql);
        res.status(200).json({ data: result });
    } catch (error) {
        res.status(500).json({ error: "Не вдалося порахувати агреговані дані" });
    }
});

// 3. НАВМИСНО ВРАЗЛИВИЙ ЕНДПОІНТ ДЛЯ ДЕМОНСТРАЦІЇ SQL-ін'єкції (Пункт 35)
// Увага: тут параметри склеюються через звичайний плюсик! Поки що НЕ виправляти (вимога ТЗ).
app.get("/api/vulnerable/search", async (req, res) => {
    try {
      
        const codeParam = req.query.code;
        
        // Пряма конкатенація рядків — показуємо викладачу вразливість при введенні: ' OR '1'='1
        const sql = "SELECT * FROM Equipment WHERE code = '" + codeParam + "'";
        console.log(`[SQLi DEMO] Виконується вразливий запит: ${sql}`);
        
        const result = await all(sql);
        res.status(200).json({ data: result });
    } catch (error) {
        res.status(500).json({ error: "Помилка SQL синтаксису (Ін'єкція спрацювала!)", details: error });
    }
});

// ==========================================
// АСИНХРОННИЙ СТАРТ МІГРАЦІЙ ТА СЕРВЕРА
// ==========================================
async function startServer() {
    try {
        // Запускаємо твій механізм автоматичних міграцій з файлу migrate.ts перед підняттям портів
        await migrate();

        const PORT = 3000;
        app.listen(PORT, () => {
            console.log(`[SERVER] API started on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("🚨 Помилка запуску сервера (Міграції не пройшли):", error);
        process.exit(1);
    }
}

startServer();