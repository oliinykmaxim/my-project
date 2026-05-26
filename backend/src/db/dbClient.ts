import { db } from "./db.js";

function logSql(sql: string): void {
    if (process.env.NODE_ENV !== "production") {
        console.log("[SQL]", sql.trim());
    }
}

export function all<T>(sql: string): Promise<T[]> {
    logSql(sql);
    return new Promise((resolve, reject) => {
        db.all(sql, (err: Error | null, rows: any[]) => {
            if (err) reject(err);
            else resolve(rows as T[]);
        });
    });
}

export function get<T>(sql: string): Promise<T | undefined> {
    logSql(sql);
    return new Promise((resolve, reject) => {
        db.get(sql, (err: Error | null, row: any) => {
            if (err) reject(err);
            else resolve(row as T | undefined);
        });
    });
}

export function run(sql: string): Promise<{ lastID: number; changes: number }> {
    logSql(sql);
    return new Promise((resolve, reject) => {
        db.run(sql, function (this: any, err: Error | null) {
            if (err) reject(err);
            else resolve({ lastID: this.lastID, changes: this.changes });
        });
    });
}