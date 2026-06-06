import { all, get, run } from "../db/dbClient.js";
import type { CreateEquipmentDto, EquipmentResponseDto } from "../dtos/equipment.dto.js";

export class EquipmentRepository {
    
    // 1. Отримати всі
  // 1. Отримати всі з фільтрацією, сортуванням та лімітом на рівні бази 
    async getAll(status?: string, sortField: string = 'id', order: 'asc' | 'desc' = 'desc', limit: number = 100): Promise<EquipmentResponseDto[]> {
        let query = `SELECT id, code as itemCode, name as userName, status, createdAt as dateFrom FROM Equipment`;
        
        if (status) {
            query += ` WHERE status = '${status}'`;
        }

        // Білий список полів для безпечного сортування (захист від SQLi)
        const allowedFields = ['id', 'code', 'name', 'status', 'createdAt'];
        const finalSort = allowedFields.includes(sortField) ? sortField : 'id';
        const finalOrder = order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

        // Додаємо сортування та ліміт прямо в SQL рядок 
        query += ` ORDER BY ${finalSort} ${finalOrder} LIMIT ${limit}`;
        
        return await all<EquipmentResponseDto>(query);
    }
    // 2. Отримати одну за ID
    async getById(id: number): Promise<EquipmentResponseDto | undefined> {
        const row = await get<any>(
            `SELECT id, code as itemCode, name as userName, status, createdAt as dateFrom FROM Equipment WHERE id = ${id}`
        );
        
        if (!row) return undefined;
        return {
            ...row,
            id: row.id.toString()
        };
    }

    // 3. Створення запису
    async create(dto: CreateEquipmentDto): Promise<EquipmentResponseDto> {
        const dateFrom = dto.dateFrom || new Date().toISOString();
        
        const query = `INSERT INTO Equipment (code, name, status, userId, createdAt) 
                       VALUES ('${dto.itemCode}', '${dto.userName}', '${dto.status}', 1, '${dateFrom}')`;
        
        const result = await run(query);

        return {
            id: result.lastID.toString(),
            itemCode: dto.itemCode,
            userName: dto.userName,
            dateFrom: dateFrom,
            dateTo: dto.dateTo,
            status: dto.status,
            comment: dto.comment || ""
        } as EquipmentResponseDto;
    }

    // 4. Оновлення
    async update(id: number, dto: CreateEquipmentDto): Promise<EquipmentResponseDto | undefined> {
        const query = `UPDATE Equipment 
                       SET code = '${dto.itemCode}', name = '${dto.userName}', status = '${dto.status}' 
                       WHERE id = ${id}`;
        await run(query);
        return this.getById(id);
    }

    // 5. Видалення
    async delete(id: number): Promise<boolean> {
        const result = await run(`DELETE FROM Equipment WHERE id = ${id}`);
        return (result.changes ?? 0) > 0;
    }
}