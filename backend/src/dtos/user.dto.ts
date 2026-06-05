export interface CreateUserDto {
    email: string;
    fullName: string;
    role: "Admin" | "User" | "Manager";
}

export interface UserResponseDto extends CreateUserDto {
    id: string; // ID генерується на бекенді
}