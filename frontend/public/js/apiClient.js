const API_BASE_URL = "http://localhost:3000/api"; // Зверни увагу: у тебе роути /api/equipment, а не /api/v1
async function request(path, options = {}, timeoutMs = 10000) {
    const url = `${API_BASE_URL}${path}`;
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs); // Авто-таймаут 10 секунд
    try {
        const response = await fetch(url, { ...options, signal: controller.signal }); //
        clearTimeout(id);
        if (response.status === 204)
            return null; // Обробка 204 No Content
        const rawText = await response.text(); //
        if (!response.ok) { // Обробка HTTP-помилок сервера
            let payload = null;
            try {
                payload = JSON.parse(rawText);
            }
            catch { }
            throw {
                status: response.status,
                message: payload?.error || "Помилка сервера",
                details: rawText
            };
        }
        if (!rawText)
            return null;
        return JSON.parse(rawText); //
    }
    catch (e) {
        clearTimeout(id);
        if (e.status)
            throw e; // Якщо це вже сформована помилка сервера
        throw {
            status: 0,
            message: e.name === "AbortError" ? "Запит перевищив таймаут" : "Помилка мережі або CORS", //
            details: e?.message || String(e)
        };
    }
}
// Запити до твого бекенду обладнання
export async function getRequests() {
    return await request("/equipment", { method: "GET" });
}
export async function createRequest(dto) {
    return await request("/equipment", {
        method: "POST",
        headers: { "Content-Type": "application/json" }, //
        body: JSON.stringify(dto) //
    });
}
export async function deleteRequest(id) {
    return await request(`/equipment/${encodeURIComponent(id)}`, { method: "DELETE" }); //
}
