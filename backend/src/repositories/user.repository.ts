import { all, get, run } from "../db/dbClient.js";
import type { CreateUserDto, UserResponseDto } from "../dtos/user.dto.js";

export class UserRepository {
    
    // Отримати всіх користувачів
    async getAll(): Promise<UserResponseDto[]> {
        return await all<UserResponseDto>(`SELECT id, name as fullName, email FROM Users`);
    }

    // Пошук за числовим ID
    async getById(id: number): Promise<UserResponseDto | undefined> {
        return await get<UserResponseDto>(`SELECT id, name as fullName, email FROM Users WHERE id = ${id}`);
    }

    // Створення користувача
    async create(dto: CreateUserDto): Promise<UserResponseDto> {
        const createdAt = new Date().toISOString();
        
        const query = `INSERT INTO Users (name, email, createdAt) 
                       VALUES ('${dto.fullName}', '${dto.email}', '${createdAt}')`;
        
        const result = await run(query);
        
        return {
            id: result.lastID.toString(),
            fullName: dto.fullName,
            email: dto.email,
            role: dto.role
        };
    }

    // Оновлення користувача
    async update(id: number, dto: CreateUserDto): Promise<UserResponseDto | undefined> {
        const query = `UPDATE Users 
                       SET name = '${dto.fullName}', email = '${dto.email}' 
                       WHERE id = ${id}`;
        await run(query);
        return this.getById(id);
    }

    // Видалення користувача
    async delete(id: number): Promise<boolean> {
        const result = await run(`DELETE FROM Users WHERE id = ${id}`);
        return (result.changes ?? 0) > 0;
    }
}