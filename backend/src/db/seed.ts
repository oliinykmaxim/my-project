import { run } from "./dbClient.js";
import { migrate } from "./migrate.js";

async function seed() {
    // Про всяк випадок перевіряємо міграції
    await migrate();
    const now = new Date().toISOString();
    console.log("🟢 Початок наповнення бази даних тестовими даними (Seeding)...");

    try {
        // 1. Наповнюємо таблицю Users
        await run(`INSERT OR IGNORE INTO Users (id, name, email, createdAt) VALUES (1, 'Yuri Mikhailovich', 'yuri@university.edu.ua', '${now}');`);
        await run(`INSERT OR IGNORE INTO Users (id, name, email, createdAt) VALUES (2, 'Anatoliy', 'anatoliy@tech.ua', '${now}');`);

        // 2. Наповнюємо таблицю Equipment
        await run(`INSERT OR IGNORE INTO Equipment (id, code, name, status, userId, createdAt) VALUES (1, 'PC-001', 'Workstation Pro i5', 'active', 1, '${now}');`);
        await run(`INSERT OR IGNORE INTO Equipment (id, code, name, status, userId, createdAt) VALUES (2, 'PRN-02', 'LaserJet Printer', 'maintenance', 1, '${now}');`);
        await run(`INSERT OR IGNORE INTO Equipment (id, code, name, status, userId, createdAt) VALUES (3, 'SRV-10', 'Main Laboratory Server', 'active', 2, '${now}');`);

        // 3. Наповнюємо таблицю MaintenanceLogs (Логи ремонтів для статистики)
        await run(`INSERT OR IGNORE INTO MaintenanceLogs (id, equipmentId, description, cost, createdAt) VALUES (1, 2, 'Thermal paste replacement & fan cleaning', 450.0, '${now}');`);
        await run(`INSERT OR IGNORE INTO MaintenanceLogs (id, equipmentId, description, cost, createdAt) VALUES (2, 2, 'Cartridge toner refill', 300.0, '${now}');`);

        console.log("✅ База даних успішно наповнена тестовими записами!");
    } catch (err) {
        console.error("🔴 Помилка під час виконання сид-скрипта:", err);
    }
    
    process.exit(0);
}

seed().catch((err) => {
    console.error("🔴 Крах сид-процесу:", err);
    process.exit(1);
});
