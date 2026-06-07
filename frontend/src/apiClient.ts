import type { CheckoutRequestDto, CreateCheckoutRequestDto, ApiError, Id } from "./dtos.js";

const API_BASE_URL = "http://localhost:3000/api"; // Зверни увагу: у тебе роути /api/equipment, а не /api/v1

async function request<T>(path: string, options: RequestInit = {}, timeoutMs = 10000): Promise<T> {
    const url = `${API_BASE_URL}${path}`;
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs); // Авто-таймаут 10 секунд

    try {
        const response = await fetch(url, { ...options, signal: controller.signal }); //
        clearTimeout(id);

        if (response.status === 204) return null as unknown as T; // Обробка 204 No Content

        const rawText = await response.text(); //

        if (!response.ok) { // Обробка HTTP-помилок сервера
            let payload: any = null;
            try { payload = JSON.parse(rawText); } catch {}
            throw {
                status: response.status,
                message: payload?.error || "Помилка сервера",
                details: rawText
            } as ApiError;
        }

        if (!rawText) return null as unknown as T;
        return JSON.parse(rawText) as T; //
    } catch (e: any) {
        clearTimeout(id);
        if (e.status) throw e; // Якщо це вже сформована помилка сервера
        
        throw {
            status: 0,
            message: e.name === "AbortError" ? "Запит перевищив таймаут" : "Помилка мережі або CORS", //
            details: e?.message || String(e)
        } as ApiError;
    }
}

// Запити до твого бекенду обладнання
export async function getRequests(): Promise<CheckoutRequestDto[]> {
    return await request<CheckoutRequestDto[]>("/equipment", { method: "GET" });
}

export async function createRequest(dto: CreateCheckoutRequestDto): Promise<CheckoutRequestDto> {
    return await request<CheckoutRequestDto>("/equipment", {
        method: "POST",
        headers: { "Content-Type": "application/json" }, //
        body: JSON.stringify(dto) //
    });
}

export async function deleteRequest(id: Id): Promise<void> {
    return await request<void>(`/equipment/${encodeURIComponent(id)}`, { method: "DELETE" }); //
}