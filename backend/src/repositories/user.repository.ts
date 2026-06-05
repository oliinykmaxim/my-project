import type { UserResponseDto } from "../dtos/user.dto.js";

export class UserRepository {
    private items: Map<string, UserResponseDto> = new Map();

    async getAll(): Promise<UserResponseDto[]> {
        return Array.from(this.items.values());
    }

    async getById(id: string): Promise<UserResponseDto | undefined> {
        return this.items.get(id);
    }

    async create(item: UserResponseDto): Promise<UserResponseDto> {
        this.items.set(item.id, item);
        return item;
    }

    async update(id: string, item: UserResponseDto): Promise<UserResponseDto | undefined> {
        if (!this.items.has(id)) return undefined;
        this.items.set(id, item);
        return item;
    }

    async delete(id: string): Promise<boolean> {
        return this.items.delete(id);
    }
}