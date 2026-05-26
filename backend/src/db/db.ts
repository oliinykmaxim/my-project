import path from "path";
import fs from "fs";
import sqlite3 from "sqlite3";

const sqlite = sqlite3.verbose();

// База даних буде створюватися в корені папки backend/data/
const dataDir = path.join(process.cwd(), "data");
const dbPath = path.join(dataDir, "app.db");

if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

console.log("Ініціалізація підключення до SQLite...");

export const db = new sqlite.Database(dbPath, (err) => {
    if (err) {
        console.error("🔴 Помилка відкриття файлу бази даних:", err.message);
        process.exit(1);
    }
    console.log("🟢 Файл бази даних успішно відкрито/знайдено за шляхом:", dbPath);
});