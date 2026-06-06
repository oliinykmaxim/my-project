import { all, get, run } from "../db/dbClient.js";

export class MaintenanceRepository {
    async getAll(): Promise<any[]> {
        return await all(`SELECT id, equipmentId, description, cost, createdAt FROM MaintenanceLogs`);
    }

    async getById(id: number): Promise<any> {
        return await get(`SELECT id, equipmentId, description, cost, createdAt FROM MaintenanceLogs WHERE id = ${id}`);
    }

    async create(dto: any): Promise<any> {
        const createdAt = new Date().toISOString();
        const result = await run(
            `INSERT INTO MaintenanceLogs (equipmentId, description, cost, createdAt) 
             VALUES (${dto.equipmentId}, '${dto.description || ""}', ${dto.cost}, '${createdAt}')`
        );
        return { id: result.lastID, ...dto, createdAt };
    }

    async update(id: number, dto: any): Promise<any> {
        await run(
            `UPDATE MaintenanceLogs 
             SET equipmentId = ${dto.equipmentId}, description = '${dto.description || ""}', cost = ${dto.cost} 
             WHERE id = ${id}`
        );
        return this.getById(id);
    }

    async delete(id: number): Promise<boolean> {
        const result = await run(`DELETE FROM MaintenanceLogs WHERE id = ${id}`);
        return (result.changes ?? 0) > 0;
    }
}