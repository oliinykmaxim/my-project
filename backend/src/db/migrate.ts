import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { run, all } from "./dbClient.js";

type MigrationRow = { filename: string };

// Створюємо заміну __dirname для ES-модулів
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function migrate(): Promise<void> {
    await run("PRAGMA foreign_keys = ON;");

    await run(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
            id INTEGER PRIMARY KEY,
            filename TEXT NOT NULL UNIQUE,
            appliedAt TEXT NOT NULL
        );
    `);

    // Піднімаємось на один рівень вгору з src/db/ до src/, а потім ще на один до кореня /backend
    const migrationsDir = path.join(process.cwd(), "migrations");
    if (!fs.existsSync(migrationsDir)) {
        console.log("Migrations directory not found.");
        return;
    }

    const files = fs.readdirSync(migrationsDir)
        .filter((f) => /^\d+_.+\.sql$/.test(f))
        .sort();

    const applied = await all<MigrationRow>("SELECT filename FROM schema_migrations;");
    const appliedSet = new Set(applied.map((x: MigrationRow) => x.filename));

    for (const file of files) {
        if (appliedSet.has(file)) continue;

        const fullPath = path.join(migrationsDir, file);
        const sql = fs.readFileSync(fullPath, "utf8").trim();
        if (!sql) continue;

        await run(sql);
        
        const now = new Date().toISOString();
        const escapedFile = file.replace(/'/g, "''");
        await run(`INSERT INTO schema_migrations (filename, appliedAt) VALUES ('${escapedFile}', '${now}');`);
        
        console.log(`Migration applied successfully: ${file}`);
    }
    console.log("All migrations checked and applied.");
}