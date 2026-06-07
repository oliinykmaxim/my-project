import express from "express";
import cors from "cors";
import { migrate } from "./db/migrate.js"; 
import { all } from "./db/dbClient.js"; 
import { EquipmentRepository } from "./repositories/equipment.repository.js";
import { EquipmentService } from "./services/equipment.service.js";
import { UserRepository } from "./repositories/user.repository.js";
import { UserService } from "./services/user.service.js";
import { MaintenanceRepository } from "./repositories/maintenance.repository.js";
import { MaintenanceService } from "./services/maintenance.service.js";

const app = express();
// ==============================================================================
// УЛЬТИМАТИВНИЙ CORS-ФІКС (МАЄ СТОЯТИ НА САМОМУ ВЕРХУ ФАЙЛУ!)
// ==============================================================================
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*"); // Для тестів відкриваємо абсолютно для всіх
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Demo-UserId");
    
    if (req.method === "OPTIONS") {
        return res.sendStatus(200); 
    }
    next();
});

// Тільки після CORS йдуть інші налаштування Express:
app.use(express.json());
app.use(express.json());

// ==============================================================================
// СЦЕНАРІЙ Г — SECURITY MISCONFIGURATION (Заголовки безпеки)
// ==============================================================================
app.use((req, res, next) => {
    res.setHeader("X-Frame-Options", "DENY"); 
    res.setHeader("X-Content-Type-Options", "nosniff"); 
    res.setHeader("Referrer-Policy", "no-referrer"); 
    next();
});

const allowedOrigins = [
    "http://localhost:5500",
    "http://127.0.0.1:5500",
    "http://localhost:5173",
    "http://127.0.0.1:5173"
];



// Миттєва ручна відповідь на перевірочні запити OPTIONS від браузера (Preflight)
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "http://localhost:5500");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Demo-UserId");

    if (req.method === "OPTIONS") {
        return res.sendStatus(200);
    }
    next();
});

// ВБУДОВАНЕ ЛОГУВАННЯ
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`[LOG] ${req.method} ${req.originalUrl} | Status: ${res.statusCode} | ${duration}ms`);
    });
    next();
});

// Створюємо інтерфейс, щоб уникнути помилок типізації req.user
interface AuthenticatedRequest extends express.Request {
    user?: { id: string };
}

// ==============================================================================
// МІДЛВАР ДЕМО-АВТЕНТИФІКАЦІЇ (База для Сценарію В - IDOR)
// ==============================================================================
function demoAuth(req: AuthenticatedRequest, res: express.Response, next: express.NextFunction) {
    const userId = req.header("X-Demo-UserId");
    
    if (!userId) {
        return res.status(401).json({ error: "Unauthorized: Відсутній заголовок X-Demo-UserId" });
    }
    
    if (isNaN(Number(userId))) {
        return res.status(400).json({ error: "Bad Request: Невалідний формат UserId" });
    }

    req.user = { id: userId };
    next();
}

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

app.get("/api/equipment", async (req, res) => {
    try {
        const status = req.query.status as string;
        const sort = req.query.sort as string;
        const order = req.query.order as 'asc' | 'desc';
        const limit = req.query.limit as string;

        const result = await service.list(status, sort, order, limit);
        res.status(200).json(result); 
    } catch (error) {
        res.status(500).json({ error: "Внутрішня помилка сервера" });
    }
});

app.get("/api/equipment/:id", async (req, res) => {
    try {
        const item = await service.getById(req.params.id);
        if (!item) {
            return res.status(404).json({ error: "Обладнання з таким ID не знайдено" }); 
        }
        res.status(200).json(item);
    } catch (error) {
        res.status(500).json({ error: "Внутрішня помилка сервера" });
    }
});

app.post("/api/equipment", async (req, res) => {
    try {
        if (!req.body || Object.keys(req.body).length === 0) {
            return res.status(400).json({ error: "Тіло запиту порожнє" }); 
        }
        if (!req.body.itemCode) {
            return res.status(400).json({ error: "Поле 'itemCode' є обов'язковим" });
        }

        const item = await service.create(req.body);
        res.status(201).json(item); 
    } catch (error) {
        res.status(500).json({ error: "Не вдалося створити запис" });
    }
});

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
        res.status(200).json(updated); 
    } catch (error) {
        res.status(500).json({ error: "Внутрішня помилка сервера" });
    }
});

// 5. DELETE — ВИДАЛЕННЯ ОБ'ЄКТА (ЗАХИЩЕНЕ ВІД IDOR)
// 5. DELETE — ВИДАЛЕННЯ ОБ'ЄКТА (ЗАХИЩЕНЕ ВІД IDOR)
app.delete("/api/equipment/:id", demoAuth as any, async (req: AuthenticatedRequest, res, next) => {
    try {
        const equipmentId = req.params.id!; // Додали знак '!', щоб зняти помилку string | undefined
        const currentUserId = req.user!.id; 
        
        const item = await service.getById(equipmentId); // Тут помилка зникне
        if (!item) {
            return res.status(404).json({ error: "Обладнання з таким ID не знайдено" });
        }
        
        // Перевіряємо власника
        const recordOwner = (item as any).userId || (item as any).ownerUserId || 1;
        
        if (Number(recordOwner) !== Number(currentUserId)) {
            return res.status(403).json({ error: "Forbidden: Ви не маєте прав на видалення чужої заявки!" });
        }
        
        await service.delete(equipmentId); // І тут помилка зникне
        res.status(204).send(); 
    } catch (error) {
        next(error);
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
// МАРШРУТИ ДЛЯ ЛОГІВ РЕМОНТУ (MAINTENANCE LOGS)
// ==========================================

app.get("/api/maintenance", async (req, res) => {
    try {
        const result = await maintenanceService.list();
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: "Внутрішня помилка сервера" });
    }
});

app.get("/api/maintenance/:id", async (req, res) => {
    try {
        const item = await maintenanceService.getById(req.params.id);
        if (!item) return res.status(404).json({ error: "Запис ремонту не знайдено" });
        res.status(200).json(item);
    } catch (error) {
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
        res.status(500).json({ error: "Внутрішня помилка сервера" });
    }
});

app.delete("/api/maintenance/:id", async (req, res) => {
    try {
        const deleted = await maintenanceService.delete(req.params.id);
        if (!deleted) return res.status(404).json({ error: "Запис ремонту не знайдено" });
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: "Внутрішня помилка сервера" });
    }
});

// ==========================================
// ДОДАТКОВІ ЕНДПОІНТИ (АНАЛІТИКА ТА ЗАХИСТ)
// ==========================================

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

app.get("/api/analytics/status-count", async (req, res) => {
    try {
        const sql = `SELECT status, COUNT(*) as count FROM Equipment GROUP BY status`;
        const result = await all(sql);
        res.status(200).json({ data: result });
    } catch (error) {
        res.status(500).json({ error: "Не вдалося порахувати агреговані дані" });
    }
});

// НАВМИСНО ВРАЗЛИВИЙ ЕНДПОІНТ ДЛЯ ДЕМОНСТРАЦІЇ SQL-ін'єкції
app.get("/api/vulnerable/search", async (req, res) => {
    try {
        const codeParam = req.query.code as string;
        const sql = "SELECT * FROM Equipment WHERE code = '" + codeParam + "'";
        console.log(`[SQLi DEMO] Виконується вразливий запит: ${sql}`);
        
        const result = await all(sql);
        res.status(200).json({ data: result });
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// ==============================================================================
// СЦЕНАРІЙ Г — ГЛОБАЛЬНА ОБРОБКА ПОМИЛОК (Приховування дебаг-деталей)
// ==============================================================================
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("🚨 Внутрішній лог сервера:", err); 
    res.status(500).json({ error: "Internal Server Error" }); 
});

// ==========================================
// АСИНХРОННИЙ СТАРТ МІГРАЦІЙ ТА СЕРВЕРА
// ==========================================
// ==========================================
// АСИНХРОННИЙ СТАРТ СЕРВЕРА
// ==========================================
async function startServer() {
    try {
        // Тимчасово прибираємо migrate(), щоб зняти блокування файлу бази даних SQLite
        // await migrate();

        const PORT = 3000;
        app.listen(PORT, () => {
            console.log(`[SERVER] API started on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("🚨 Помилка запуску сервера:", error);
        process.exit(1);
    }
}

startServer();