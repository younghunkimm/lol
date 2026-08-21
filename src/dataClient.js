import { emptyData, STORAGE_KEY, SUPABASE_ANON_KEY, SUPABASE_URL } from "./constants";

export function getLocalData() {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) {
        return emptyData;
    }

    try {
        return { ...emptyData, ...JSON.parse(raw) };
    } catch {
        return emptyData;
    }
}

export function setLocalData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export async function supabaseRequest(table, { method = "GET", body, query = "" } = {}) {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}${query}`, {
        method,
        headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            "Content-Type": "application/json",
            Prefer: "return=representation",
        },
        body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
        throw new Error(`${table} 요청 실패: ${response.status}`);
    }

    if (response.status === 204) {
        return [];
    }

    return response.json();
}

