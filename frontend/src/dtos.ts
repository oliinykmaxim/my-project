export type Id = number | string;

export interface CheckoutRequestDto {
    id: Id;
    itemCode: string;
    userName: string;
    dateFrom: string;
    dateTo: string;
    comment?: string;
    status: string;
}

export interface CreateCheckoutRequestDto {
    itemCode: string;
    userName: string;
    dateFrom: string;
    dateTo: string;
    comment?: string;
    status: string;
}

export interface ApiError {
    status: number;
    message: string;
    details?: string;
}