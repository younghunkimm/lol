import { useCallback, useEffect, useRef, useState } from "react";
import { SESSION_PAGE_SIZE, emptyData } from "../constants";
import {
    loadFriends,
    loadRemoteData,
    loadSessionGames,
    loadSessions,
    loadStats,
} from "../dataClient";

function uniqueById(items) {
    return Array.from(new Map(items.map((item) => [item.id, item])).values());
}

export function useDashboardData({ authToken, handleRemoteError }) {
    const [data, setData] = useState(emptyData);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const sessionLimitRef = useRef(SESSION_PAGE_SIZE);

    const refreshFriends = useCallback(async () => {
        const friends = await loadFriends();
        setData((current) => ({ ...current, friends }));
    }, []);

    const refreshSessions = useCallback(async () => {
        const limit = Math.max(sessionLimitRef.current, SESSION_PAGE_SIZE);
        const { sessions, hasMore, totalCount } = await loadSessions({ limit });
        const nextSessions = uniqueById(sessions);
        sessionLimitRef.current = nextSessions.length;
        setData((current) => ({
            ...current,
            sessions: nextSessions,
            hasMoreSessions: hasMore,
            totalSessions: totalCount,
        }));
    }, []);

    const refreshStats = useCallback(async () => {
        const stats = await loadStats();
        setData((current) => ({ ...current, stats }));
    }, []);

    const refreshSessionGames = useCallback(async (sessionId) => {
        const games = await loadSessionGames(sessionId);
        setData((current) => ({ ...current, games }));
    }, []);

    const refreshAllData = useCallback(async (shouldApply = () => true) => {
        const limit = Math.max(sessionLimitRef.current, SESSION_PAGE_SIZE);
        const nextData = await loadRemoteData({ limit });
        const sessions = uniqueById(nextData.sessions);

        if (!shouldApply()) {
            return false;
        }

        sessionLimitRef.current = sessions.length;
        setData((current) => ({
            ...nextData,
            sessions,
            games: current.games,
        }));
        return true;
    }, []);

    const loadMoreSessions = useCallback(async () => {
        const { sessions, hasMore, totalCount } = await loadSessions({
            offset: data.sessions.length,
        });

        setData((current) => {
            const sessionMap = new Map(
                current.sessions.map((session) => [session.id, session]),
            );
            sessions.forEach((session) => sessionMap.set(session.id, session));
            const nextSessions = uniqueById(Array.from(sessionMap.values()));
            sessionLimitRef.current = nextSessions.length;

            return {
                ...current,
                sessions: nextSessions,
                hasMoreSessions: hasMore,
                totalSessions: totalCount,
            };
        });
    }, [data.sessions.length]);

    const commit = useCallback(
        async (action, updateData, errorHandler = setError) => {
            errorHandler(null);

            try {
                await action();
                setData(updateData);
                return true;
            } catch (actionError) {
                handleRemoteError(actionError, errorHandler, authToken);
                return false;
            }
        },
        [authToken, handleRemoteError],
    );

    useEffect(() => {
        let ignore = false;

        async function loadData() {
            if (!authToken) {
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            try {
                await refreshAllData(() => !ignore);
            } catch (loadError) {
                if (!ignore) {
                    handleRemoteError(loadError, setError, authToken);
                }
            } finally {
                if (!ignore) {
                    setIsLoading(false);
                }
            }
        }

        loadData();
        return () => {
            ignore = true;
        };
    }, [authToken, handleRemoteError, refreshAllData]);

    return {
        commit,
        data,
        error,
        isLoading,
        loadMoreSessions,
        refreshAllData,
        refreshFriends,
        refreshSessionGames,
        refreshSessions,
        refreshStats,
        setData,
        setError,
    };
}
