import {
    AUTH_EXPIRES_AT_KEY,
    AUTH_TOKEN_KEY,
    SESSION_PAGE_SIZE,
    SUPABASE_URL,
} from "./constants";
import { supabase } from "./supabaseClient";

export function getAuthToken() {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);

    if (!token) {
        return "";
    }

    return token;
}

export async function setStoredAuthToken({
    accessToken,
    refreshToken,
    expiresAt,
}) {
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
    // Auth recovery can overlap with a new sign-in, so do not asynchronously sign out here.
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_EXPIRES_AT_KEY);
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
        gameCount: Number(row.game_count) || 0,
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

function fromStatsRow(row) {
    const wins = Number(row.wins) || 0;
    const losses = Number(row.losses) || 0;

    return {
        id: row.id,
        name: row.name,
        wins,
        losses,
        totalGames: wins + losses,
        paid: Number(row.paid) || 0,
        received: Number(row.received) || 0,
        net: Number(row.net) || 0,
        winRate: Number(row.win_rate) || 0,
    };
}

async function addGameCounts(client, sessionRows) {
    const sessionIds = sessionRows.map((row) => row.id);

    if (!sessionIds.length) {
        return [];
    }

    const { data, error } = await client
        .from("session_game_counts")
        .select("*")
        .in("session_id", sessionIds);

    throwIfError("세션 게임 수 불러오기", error);

    const gameCountMap = new Map(
        (data ?? []).map((row) => [
            row.session_id,
            Number(row.game_count) || 0,
        ]),
    );

    return sessionRows.map((row) =>
        fromSessionRow({
            ...row,
            game_count: gameCountMap.get(row.id) ?? 0,
        }),
    );
}

async function loadSessionPage(
    client,
    { offset = 0, limit = SESSION_PAGE_SIZE } = {},
) {
    const sessionsResult = await client
        .from("sessions")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

    throwIfError("세션 목록 불러오기", sessionsResult.error);

    const rows = sessionsResult.data ?? [];
    const totalCount = sessionsResult.count ?? rows.length;

    return {
        sessions: await addGameCounts(client, rows),
        hasMore: offset + rows.length < totalCount,
        totalCount,
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

export async function loadRemoteData(options) {
    const client = await requireSession();
    const [friendsResult, sessionsPage, statsResult] = await Promise.all([
        client
            .from("friends")
            .select("*")
            .order("created_at", { ascending: false }),
        loadSessionPage(client, options),
        client.from("friend_stats").select("*"),
    ]);

    throwIfError("프로게이머 목록 불러오기", friendsResult.error);
    throwIfError("통계 불러오기", statsResult.error);

    return {
        friends: (friendsResult.data ?? []).map(fromFriendRow),
        sessions: sessionsPage.sessions,
        games: [],
        stats: (statsResult.data ?? []).map(fromStatsRow),
        hasMoreSessions: sessionsPage.hasMore,
        totalSessions: sessionsPage.totalCount,
    };
}

export async function loadFriends() {
    const { data, error } = await (await requireSession())
        .from("friends")
        .select("*")
        .order("created_at", { ascending: false });

    throwIfError("프로게이머 목록 불러오기", error);

    return (data ?? []).map(fromFriendRow);
}

export async function loadSessions(options) {
    const client = await requireSession();
    return loadSessionPage(client, options);
}

export async function loadStats() {
    const { data, error } = await (await requireSession())
        .from("friend_stats")
        .select("*");

    throwIfError("통계 불러오기", error);

    return (data ?? []).map(fromStatsRow);
}

export async function loadSessionGames(sessionId) {
    const { data, error } = await (await requireSession())
        .from("games")
        .select("*")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true });

    throwIfError("세션 게임 목록 불러오기", error);

    return (data ?? []).map(fromGameRow);
}

export async function hasFriendRecords(friendId) {
    const client = await requireSession();
    const [sessionsResult, winsResult, lossesResult] = await Promise.all([
        client
            .from("sessions")
            .select("id")
            .contains("friend_ids", [friendId])
            .limit(1),
        client
            .from("games")
            .select("id")
            .contains("winner_ids", [friendId])
            .limit(1),
        client
            .from("games")
            .select("id")
            .contains("loser_ids", [friendId])
            .limit(1),
    ]);

    throwIfError("프로게이머 사용 여부 확인", sessionsResult.error);
    throwIfError("프로게이머 승리 기록 확인", winsResult.error);
    throwIfError("프로게이머 패배 기록 확인", lossesResult.error);

    return Boolean(
        sessionsResult.data?.length ||
        winsResult.data?.length ||
        lossesResult.data?.length,
    );
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
    const { data, error } = await (await requireSession())
        .from("sessions")
        .insert(toSessionRow(session))
        .select("*")
        .single();

    throwIfError("세션 저장", error);

    return fromSessionRow(data);
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

export async function subscribeToRemoteChanges(onChange) {
    const client = await requireSession();
    const { data } = await client.auth.getSession();

    if (data.session?.access_token) {
        client.realtime.setAuth(data.session.access_token);
    }

    const topic =
        typeof crypto !== "undefined" && crypto.randomUUID
            ? `lol-dashboard-changes-${crypto.randomUUID()}`
            : `lol-dashboard-changes-${Date.now()}-${Math.random()}`;

    const channel = client
        .channel(topic)
        .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "friends" },
            (payload) => onChange({ table: "friends", payload }),
        )
        .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "sessions" },
            (payload) => onChange({ table: "sessions", payload }),
        )
        .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "games" },
            (payload) => onChange({ table: "games", payload }),
        )
        .subscribe();

    return () => {
        client.removeChannel(channel);
    };
}
