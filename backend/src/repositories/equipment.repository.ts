import type { EquipmentResponseDto } from "../dtos/equipment.dto.js";

export class EquipmentRepository {
    // Використовуємо Map для швидкого пошуку за ID 
    private items: Map<string, EquipmentResponseDto> = new Map();

    // Отримати всі заявки 
    async getAll(): Promise<EquipmentResponseDto[]> {
        return Array.from(this.items.values());
    }

    // Отримати одну за ID 
    async getById(id: string): Promise<EquipmentResponseDto | undefined> {
        return this.items.get(id);
    }

    // Додати нову заявку 
    async create(item: EquipmentResponseDto): Promise<EquipmentResponseDto> {
        this.items.set(item.id, item);
        return item;
    }

    // Видалити заявку 
    async delete(id: string): Promise<boolean> {
        return this.items.delete(id);
    }
}