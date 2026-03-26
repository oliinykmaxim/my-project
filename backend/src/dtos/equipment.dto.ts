export interface CreateEquipmentDto {
    itemCode: string;
    userName: string;
    dateFrom: string;
    dateTo: string;
    status: "New" | "Approved" | "Rejected" | "Closed";
    comment?: string;
}

export interface EquipmentResponseDto extends CreateEquipmentDto {
    id: string; // ID генерується на бекенді
}