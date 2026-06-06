import type { UserRepository } from "../repositories/user.repository.js";
import type { CreateUserDto, UserResponseDto } from "../dtos/user.dto.js";

export class UserService {
    constructor(private repository: UserRepository) {}

    async list() {
        const items = await this.repository.getAll();
        return { items };
    }

    async create(dto: CreateUserDto): Promise<UserResponseDto> {
        return this.repository.create(dto);
    }

    async getById(id: string): Promise<UserResponseDto | null> {
        const numericId = parseInt(id, 10);
        if (isNaN(numericId)) return null;
        return await this.repository.getById(numericId) || null;
    }

    async update(id: string, dto: CreateUserDto): Promise<UserResponseDto | null> {
        const numericId = parseInt(id, 10);
        if (isNaN(numericId)) return null;
        return await this.repository.update(numericId, dto) || null;
    }

    async delete(id: string): Promise<boolean> {
        const numericId = parseInt(id, 10);
        if (isNaN(numericId)) return false;
        return await this.repository.delete(numericId);
    }
}