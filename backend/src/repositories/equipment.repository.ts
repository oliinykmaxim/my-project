import { all, get, run } from "../db/dbClient.js";

export interface EquipmentRow {
    id: number;
    code: string;
    name: string;
    status: string;
    userId: number;
    createdAt: string;
}

export interface EquipmentWithUserRow extends EquipmentRow {
    userName: string;
    userEmail: string;
}

export class EquipmentRepository {
    
    private escape(s: string): string {
        return String(s).replace(/'/g, "''");
    }

    async getAll(filter?: { status?: string; userId?: string }, sort?: { column?: string; order?: string }): Promise<EquipmentRow[]> {
        let sql = "SELECT id, code, name, status, userId, createdAt FROM Equipment WHERE 1=1";
        
        if (filter?.status) {
            sql += ` AND status = '${this.escape(filter.status)}'`;
        }
        if (filter?.userId) {
            sql += ` AND userId = ${Number(filter.userId)}`;
        }

        const col = sort?.column === "createdAt" ? "createdAt" : "id";
        const ord = sort?.order?.toUpperCase() === "DESC" ? "DESC" : "ASC";
        sql += ` ORDER BY ${col} ${ord};`;

        return await all<EquipmentRow>(sql);
    }

    async getById(id: number): Promise<EquipmentRow | undefined> {
        return await get<EquipmentRow>(`SELECT * FROM Equipment WHERE id = ${id};`);
    }

    async getWithUser(id: number): Promise<EquipmentWithUserRow | undefined> {
        const sql = `
            SELECT e.*, u.name AS userName, u.email AS userEmail 
            FROM Equipment e
            JOIN Users u ON e.userId = u.id
            WHERE e.id = ${id};
        `;
        return await get<EquipmentWithUserRow>(sql);
    }

    async getMaintenanceStats(): Promise<{ totalCost: number; logsCount: number } | undefined> {
        const sql = "SELECT COUNT(id) AS logsCount, SUM(cost) AS totalCost FROM MaintenanceLogs;";
        return await get<{ totalCost: number; logsCount: number }>(sql);
    }

    async searchVulnerable(searchTerm: string): Promise<EquipmentRow[]> {
        const sql = `SELECT * FROM Equipment WHERE name LIKE '%${searchTerm}%' ORDER BY id DESC;`;
        return await all<EquipmentRow>(sql);
    }

    async create(data: { code: string; name: string; status: string; userId: number }): Promise<EquipmentRow | undefined> {
        const now = new Date().toISOString();
        const sql = `
            INSERT INTO Equipment (code, name, status, userId, createdAt)
            VALUES (
                '${this.escape(data.code)}', 
                '${this.escape(data.name)}', 
                '${this.escape(data.status)}', 
                ${Number(data.userId)}, 
                '${now}'
            );
        `;
        const result = await run(sql);
        return await this.getById(result.lastID);
    }

    async update(id: number, data: { name: string; status: string }): Promise<EquipmentRow | null> {
        const sql = `
            UPDATE Equipment 
            SET name = '${this.escape(data.name)}', status = '${this.escape(data.status)}'
            WHERE id = ${id};
        `;
        const result = await run(sql);
        if (result.changes === 0) return null;
      const updatedItem = await this.getById(id);
return updatedItem || null;
    }

    async delete(id: number): Promise<boolean> {
        const result = await run(`DELETE FROM Equipment WHERE id = ${id};`);
        return result.changes > 0;
    }
}