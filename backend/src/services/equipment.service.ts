import { v4 as uuidv4 } from "uuid";
import { EquipmentRepository } from "../repositories/equipment.repository.js";
import type { CreateEquipmentDto, EquipmentResponseDto } from "../dtos/equipment.dto.js";

export class EquipmentService {
    constructor(private repository: EquipmentRepository) { }

    async list(status?: string) {
        let items = await this.repository.getAll();
        //  Фільтрація 
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
}