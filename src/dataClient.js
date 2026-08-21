import { createClient } from "@supabase/supabase-js";
import {
    emptyData,
    hasSupabase,
    STORAGE_KEY,
    SUPABASE_ANON_KEY,
    SUPABASE_URL,
} from "./constants";

const supabase = hasSupabase
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

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

function requireSupabase() {
    if (!supabase) {
        throw new Error("Supabase 환경변수가 설정되지 않았습니다");
    }

    return supabase;
}

function throwIfError(operation, error) {
    if (error) {
        throw new Error(`${operation} 실패: ${error.message}`);
    }
}

export async function loadRemoteData() {
    const client = requireSupabase();
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

export async function insertFriend(friend) {
    const { error } = await requireSupabase()
        .from("friends")
        .insert(toFriendRow(friend));
    throwIfError("프로게이머 저장", error);
}

export async function deleteFriend(friendId) {
    const { error } = await requireSupabase()
        .from("friends")
        .delete()
        .eq("id", friendId);
    throwIfError("프로게이머 삭제", error);
}

export async function insertSession(session) {
    const { error } = await requireSupabase()
        .from("sessions")
        .insert(toSessionRow(session));
    throwIfError("세션 저장", error);
}

export async function deleteSession(sessionId) {
    const { error } = await requireSupabase()
        .from("sessions")
        .delete()
        .eq("id", sessionId);
    throwIfError("세션 삭제", error);
}

export async function insertGame(game) {
    const { error } = await requireSupabase()
        .from("games")
        .insert(toGameRow(game));
    throwIfError("승패 기록 저장", error);
}

export async function deleteGame(gameId) {
    const { error } = await requireSupabase()
        .from("games")
        .delete()
        .eq("id", gameId);
    throwIfError("승패 기록 삭제", error);
}
