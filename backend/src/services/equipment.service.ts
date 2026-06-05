import { v4 as uuidv4 } from "uuid";
import { EquipmentRepository } from "../repositories/equipment.repository.js";
import type { CreateEquipmentDto, EquipmentResponseDto } from "../dtos/equipment.dto.js";

export class EquipmentService {
    constructor(private repository: EquipmentRepository) { }

    async list(status?: string) {
        let items = await this.repository.getAll();
        // Фільтрація
        if (status) {
            items = items.filter(i => i.status === status);
        }
        return { items }; // Уніфікована відповідь
    }

    async create(dto: CreateEquipmentDto): Promise<EquipmentResponseDto> {
        const newItem: EquipmentResponseDto = {
            ...dto,
            id: uuidv4() // ID генерується на бекенді
        };
        return this.repository.create(newItem);
    }

    // 1. Отримати за ID (Додаємо сюди 👇)
    async getById(id: string): Promise<EquipmentResponseDto | null> {
        const item = await this.repository.getById(id);
        return item || null;
    }

    // 2. Оновити
    async update(id: string, dto: CreateEquipmentDto): Promise<EquipmentResponseDto | null> {
        const existing = await this.repository.getById(id);
        if (!existing) return null;

        const updatedItem: EquipmentResponseDto = {
            ...dto,
            id: id // Зберігаємо той самий ID
        };
        return await this.repository.update(id, updatedItem) || null;
    }

    // 3. Видалити
    async delete(id: string): Promise<boolean> {
        return await this.repository.delete(id);
    }
}