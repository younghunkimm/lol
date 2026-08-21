import { AUTH_EXPIRES_AT_KEY, AUTH_TOKEN_KEY, SUPABASE_URL } from "./constants";
import { supabase } from "./supabaseClient";

export function getAuthToken() {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);

    if (!token) {
        return "";
    }

    return token;
}

export async function setStoredAuthToken({ accessToken, refreshToken, expiresAt }) {
    requireSupabase();

    const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
    });

    if (error) {
        throw createAuthError(error.message);
    }

    localStorage.setItem(AUTH_TOKEN_KEY, accessToken);

    if (expiresAt) {
        localStorage.setItem(AUTH_EXPIRES_AT_KEY, String(expiresAt));
    } else {
        localStorage.removeItem(AUTH_EXPIRES_AT_KEY);
    }
}

export function clearAuthToken() {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_EXPIRES_AT_KEY);
    supabase?.auth.signOut().catch(() => {});
}

function createAuthError(message = "로그인이 필요합니다") {
    const error = new Error(message);
    error.status = 401;
    return error;
}

function requireSupabase() {
    if (!supabase) {
        throw new Error("Supabase 환경변수가 설정되지 않았습니다");
    }

    return supabase;
}

async function requireSession() {
    const client = requireSupabase();
    const { data, error } = await client.auth.getSession();

    if (error || !data.session) {
        clearAuthToken();
        throw createAuthError(error?.message);
    }

    if (data.session.access_token !== localStorage.getItem(AUTH_TOKEN_KEY)) {
        localStorage.setItem(AUTH_TOKEN_KEY, data.session.access_token);
        if (data.session.expires_at) {
            localStorage.setItem(
                AUTH_EXPIRES_AT_KEY,
                String(data.session.expires_at),
            );
        }
    }

    return client;
}

function throwIfError(operation, error) {
    if (!error) {
        return;
    }

    const nextError = new Error(`${operation} 실패: ${error.message}`);
    nextError.status = error.status;

    if (
        error.status === 401 ||
        /jwt|token|auth/i.test(error.message) ||
        error.code === "PGRST301"
    ) {
        nextError.status = 401;
        clearAuthToken();
    }

    throw nextError;
}

function fromFriendRow(row) {
    return {
        id: row.id,
        name: row.name,
        createdAt: row.created_at,
    };
}

function toFriendRow(friend) {
    return {
        id: friend.id,
        name: friend.name,
        created_at: friend.createdAt,
    };
}

function fromSessionRow(row) {
    return {
        id: row.id,
        title: row.title,
        price: row.price,
        friendIds: row.friend_ids ?? [],
        createdAt: row.created_at,
    };
}

function toSessionRow(session) {
    return {
        id: session.id,
        title: session.title,
        price: session.price,
        friend_ids: session.friendIds,
        created_at: session.createdAt,
    };
}

function fromGameRow(row) {
    return {
        id: row.id,
        sessionId: row.session_id,
        winnerIds: row.winner_ids ?? [],
        loserIds: row.loser_ids ?? [],
        note: row.note ?? "",
        createdAt: row.created_at,
    };
}

function toGameRow(game) {
    return {
        id: game.id,
        session_id: game.sessionId,
        winner_ids: game.winnerIds,
        loser_ids: game.loserIds,
        note: game.note,
        created_at: game.createdAt,
    };
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

export async function loginWithPassword(password) {
    if (!SUPABASE_URL) {
        throw new Error("Supabase URL이 설정되지 않았습니다");
    }

    requireSupabase();

    const response = await fetch(`${SUPABASE_URL}/functions/v1/auth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
    });

    const body = await parseJsonResponse(response);

    if (!body.accessToken || !body.refreshToken) {
        throw new Error("인증 세션을 받지 못했습니다");
    }

    return {
        accessToken: body.accessToken,
        refreshToken: body.refreshToken,
        expiresAt: body.expiresAt,
    };
}

export async function loadRemoteData() {
    const client = await requireSession();
    const [friendsResult, sessionsResult, gamesResult] = await Promise.all([
        client
            .from("friends")
            .select("*")
            .order("created_at", { ascending: true }),
        client
            .from("sessions")
            .select("*")
            .order("created_at", { ascending: false }),
        client
            .from("games")
            .select("*")
            .order("created_at", { ascending: true }),
    ]);

    throwIfError("프로게이머 목록 불러오기", friendsResult.error);
    throwIfError("세션 목록 불러오기", sessionsResult.error);
    throwIfError("게임 목록 불러오기", gamesResult.error);

    return {
        friends: (friendsResult.data ?? []).map(fromFriendRow),
        sessions: (sessionsResult.data ?? []).map(fromSessionRow),
        games: (gamesResult.data ?? []).map(fromGameRow),
    };
}

export async function insertFriend(_token, friend) {
    const { error } = await (await requireSession())
        .from("friends")
        .insert(toFriendRow(friend));

    throwIfError("프로게이머 저장", error);
}

export async function deleteFriend(_token, friendId) {
    const { error } = await (await requireSession())
        .from("friends")
        .delete()
        .eq("id", friendId);

    throwIfError("프로게이머 삭제", error);
}

export async function insertSession(_token, session) {
    const { error } = await (await requireSession())
        .from("sessions")
        .insert(toSessionRow(session));

    throwIfError("세션 저장", error);
}

export async function deleteSession(_token, sessionId) {
    const { error } = await (await requireSession())
        .from("sessions")
        .delete()
        .eq("id", sessionId);

    throwIfError("세션 삭제", error);
}

export async function insertGame(_token, game) {
    const { error } = await (await requireSession())
        .from("games")
        .insert(toGameRow(game));

    throwIfError("승패 기록 저장", error);
}

export async function deleteGame(_token, gameId) {
    const { error } = await (await requireSession())
        .from("games")
        .delete()
        .eq("id", gameId);

    throwIfError("승패 기록 삭제", error);
}
