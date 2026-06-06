import { EquipmentRepository } from "../repositories/equipment.repository.js";
import type { CreateEquipmentDto, EquipmentResponseDto } from "../dtos/equipment.dto.js";

export class EquipmentService {
    constructor(private repository: EquipmentRepository) { }

    // Метод list приймає статус і передає його в репозиторій для SQL-фільтрації
    // Метод list приймає статус, сортування та ліміт для SQL (Пункт 19)
    async list(status?: string, sort?: string, order?: 'asc' | 'desc', limit?: string) {
        const finalLimit = limit ? parseInt(limit, 10) : 100;
        
        // Передаємо параметри в репозиторій
        const items = await this.repository.getAll(status, sort, order, isNaN(finalLimit) ? 100 : finalLimit);
        
        // Зберігаємо уніфікований формат відповіді з даними
        return { items }; 
    }

    async create(dto: CreateEquipmentDto): Promise<EquipmentResponseDto> {
        // Передаємо чистий dto, база сама згенерує ID (завдяки твоїм міграціям INTEGER PRIMARY KEY)
        return this.repository.create(dto);
    }

    async getById(id: string): Promise<EquipmentResponseDto | null> {
        const numericId = parseInt(id, 10);
        if (isNaN(numericId)) return null;

        const item = await this.repository.getById(numericId);
        return item || null;
    }

    async update(id: string, dto: CreateEquipmentDto): Promise<EquipmentResponseDto | null> {
        const numericId = parseInt(id, 10);
        if (isNaN(numericId)) return null;

        const existing = await this.repository.getById(numericId);
        if (!existing) return null;

        const updated = await this.repository.update(numericId, dto);
        return updated || null;
    }

    async delete(id: string): Promise<boolean> {
        const numericId = parseInt(id, 10);
        if (isNaN(numericId)) return false;

        return await this.repository.delete(numericId);
    }
}