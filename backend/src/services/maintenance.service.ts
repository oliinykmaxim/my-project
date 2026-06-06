import { MaintenanceRepository } from "../repositories/maintenance.repository.js";

export class MaintenanceService {
    constructor(private repository: MaintenanceRepository) {}

    async list() {
        const items = await this.repository.getAll();
        return { items };
    }

    async getById(id: string) {
        const numericId = parseInt(id, 10);
        if (isNaN(numericId)) return null;
        return await this.repository.getById(numericId);
    }

    async create(dto: any) {
        return await this.repository.create(dto);
    }

    async update(id: string, dto: any) {
        const numericId = parseInt(id, 10);
        if (isNaN(numericId)) return null;
        return await this.repository.update(numericId, dto);
    }

    async delete(id: string) {
        const numericId = parseInt(id, 10);
        if (isNaN(numericId)) return false;
        return await this.repository.delete(numericId);
    }
}