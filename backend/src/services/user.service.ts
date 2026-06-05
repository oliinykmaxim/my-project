import { v4 as uuidv4 } from "uuid";
import { UserRepository } from "../repositories/user.repository.js";
import type { CreateUserDto, UserResponseDto } from "../dtos/user.dto.js";

export class UserService {
    constructor(private repository: UserRepository) {}

    async list() {
        const items = await this.repository.getAll();
        return { items };
    }

    async create(dto: CreateUserDto): Promise<UserResponseDto> {
        const newItem: UserResponseDto = {
            ...dto,
            id: uuidv4()
        };
        return this.repository.create(newItem);
    }

    async getById(id: string): Promise<UserResponseDto | null> {
        const item = await this.repository.getById(id);
        return item || null;
    }

    async update(id: string, dto: CreateUserDto): Promise<UserResponseDto | null> {
        const existing = await this.repository.getById(id);
        if (!existing) return null;

        const updatedItem: UserResponseDto = {
            ...dto,
            id: id
        };
        return await this.repository.update(id, updatedItem) || null;
    }

    async delete(id: string): Promise<boolean> {
        return await this.repository.delete(id);
    }
}