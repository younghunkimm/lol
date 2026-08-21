import { AUTH_EXPIRES_AT_KEY, AUTH_TOKEN_KEY, SUPABASE_URL } from "./constants";

export function getAuthToken() {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    const expiresAt = Number(localStorage.getItem(AUTH_EXPIRES_AT_KEY));

    if (!token) {
        return "";
    }

    if (expiresAt && expiresAt * 1000 <= Date.now()) {
        clearAuthToken();
        return "";
    }

    return token;
}

export function setStoredAuthToken({ token, expiresAt }) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);

    if (expiresAt) {
        localStorage.setItem(AUTH_EXPIRES_AT_KEY, String(expiresAt));
    } else {
        localStorage.removeItem(AUTH_EXPIRES_AT_KEY);
    }
}

export function clearAuthToken() {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_EXPIRES_AT_KEY);
}

function createAuthError(message = "로그인이 필요합니다") {
    const error = new Error(message);
    error.status = 401;
    return error;
}

function isJwtLikeToken(token) {
    return /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token);
}

async function parseJsonResponse(response) {
    const body = await response.json().catch(() => ({}));

    if (!response.ok) {
        const error = new Error(body.error ?? "요청에 실패했습니다");
        error.status = response.status;
        throw error;
    }

    return body;
}

async function apiRequest(token, path = "", options = {}) {
    if (!SUPABASE_URL) {
        throw new Error("Supabase URL이 설정되지 않았습니다");
    }

    if (!token) {
        throw createAuthError();
    }

    if (!isJwtLikeToken(token)) {
        clearAuthToken();
        throw createAuthError("저장된 로그인 정보가 올바르지 않습니다");
    }

    const response = await fetch(
        `${SUPABASE_URL}/functions/v1/friends${path}`,
        {
            ...options,
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
                ...options.headers,
            },
        },
    );

    if (response.status === 401) {
        clearAuthToken();
    }

    const body = await parseJsonResponse(response);
    return { ...body, status: response.status };
}

export async function loginWithPassword(password) {
    if (!SUPABASE_URL) {
        throw new Error("Supabase URL이 설정되지 않았습니다");
    }

    const response = await fetch(`${SUPABASE_URL}/functions/v1/auth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
    });

    const body = await parseJsonResponse(response);

    if (!body.token) {
        throw new Error("인증 토큰을 받지 못했습니다");
    }

    return {
        token: body.token,
        expiresAt: body.expiresAt,
    };
}

export async function loadRemoteData(token) {
    const data = await apiRequest(token);

    return {
        friends: data.friends ?? [],
        sessions: data.sessions ?? [],
        games: data.games ?? [],
    };
}

export async function insertFriend(token, friend) {
    await apiRequest(token, "?resource=friends", {
        method: "POST",
        body: JSON.stringify(friend),
    });
}

export async function deleteFriend(token, friendId) {
    await apiRequest(
        token,
        `?resource=friends&id=${encodeURIComponent(friendId)}`,
        { method: "DELETE" },
    );
}

export async function insertSession(token, session) {
    await apiRequest(token, "?resource=sessions", {
        method: "POST",
        body: JSON.stringify(session),
    });
}

export async function deleteSession(token, sessionId) {
    await apiRequest(
        token,
        `?resource=sessions&id=${encodeURIComponent(sessionId)}`,
        { method: "DELETE" },
    );
}

export async function insertGame(token, game) {
    await apiRequest(token, "?resource=games", {
        method: "POST",
        body: JSON.stringify(game),
    });
}

export async function deleteGame(token, gameId) {
    await apiRequest(
        token,
        `?resource=games&id=${encodeURIComponent(gameId)}`,
        { method: "DELETE" },
    );
}
