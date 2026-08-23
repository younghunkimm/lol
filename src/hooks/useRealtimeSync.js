import { useEffect, useRef } from "react";
import { subscribeToRemoteChanges } from "../dataClient";

function shouldRefreshOpenSession(payload, activeSessionId) {
    return Boolean(
        activeSessionId &&
            (payload.new?.session_id === activeSessionId ||
                payload.old?.session_id === activeSessionId),
    );
}

export function useRealtimeSync({
    activeSessionId,
    authToken,
    handleRemoteError,
    refreshAllData,
    refreshFriends,
    refreshSessionGames,
    refreshSessions,
    refreshStats,
    setError,
}) {
    const activeSessionIdRef = useRef("");

    useEffect(() => {
        activeSessionIdRef.current = activeSessionId;
    }, [activeSessionId]);

    useEffect(() => {
        if (!authToken) {
            return undefined;
        }

        let unsubscribe = () => {};
        let closed = false;
        let channelGeneration = 0;

        async function refreshAfterResume() {
            const openSessionId = activeSessionIdRef.current;
            await refreshAllData();
            if (openSessionId) {
                await refreshSessionGames(openSessionId);
            }
        }

        async function bindRealtime() {
            const generation = ++channelGeneration;

            try {
                const nextUnsubscribe = await subscribeToRemoteChanges(
                    ({ table, payload }) => {
                        if (closed || generation !== channelGeneration) {
                            return;
                        }

                        if (table === "friends") {
                            Promise.all([refreshFriends(), refreshStats()]).catch(
                                (remoteError) =>
                                    handleRemoteError(
                                        remoteError,
                                        setError,
                                        authToken,
                                    ),
                            );
                        }

                        if (table === "sessions") {
                            refreshSessions().catch((remoteError) =>
                                handleRemoteError(
                                    remoteError,
                                    setError,
                                    authToken,
                                ),
                            );
                        }

                        if (table === "games") {
                            const openSessionId = activeSessionIdRef.current;
                            Promise.all([
                                refreshSessions(),
                                refreshStats(),
                                shouldRefreshOpenSession(payload, openSessionId)
                                    ? refreshSessionGames(openSessionId)
                                    : Promise.resolve(),
                            ]).catch((remoteError) =>
                                handleRemoteError(
                                    remoteError,
                                    setError,
                                    authToken,
                                ),
                            );
                        }
                    },
                );

                if (closed || generation !== channelGeneration) {
                    nextUnsubscribe();
                    return;
                }
                unsubscribe = nextUnsubscribe;
            } catch (remoteError) {
                handleRemoteError(remoteError, setError, authToken);
            }
        }

        let reconnecting = Promise.resolve();
        let reconnectQueued = false;

        function reconnectRealtime() {
            if (closed || reconnectQueued) {
                return;
            }

            reconnectQueued = true;
            reconnecting = reconnecting
                .catch(() => {})
                .then(async () => {
                    if (closed) return;

                    channelGeneration += 1;
                    const previousUnsubscribe = unsubscribe;
                    unsubscribe = () => {};
                    previousUnsubscribe();

                    try {
                        await refreshAfterResume();
                    } catch (remoteError) {
                        handleRemoteError(remoteError, setError, authToken);
                    }

                    if (!closed) {
                        await bindRealtime();
                    }
                })
                .finally(() => {
                    reconnectQueued = false;
                });
        }

        function handleAppResume() {
            if (document.visibilityState === "visible") {
                reconnectRealtime();
            }
        }

        bindRealtime();
        document.addEventListener("visibilitychange", handleAppResume);
        window.addEventListener("focus", handleAppResume);
        window.addEventListener("online", handleAppResume);

        return () => {
            closed = true;
            channelGeneration += 1;
            document.removeEventListener("visibilitychange", handleAppResume);
            window.removeEventListener("focus", handleAppResume);
            window.removeEventListener("online", handleAppResume);
            unsubscribe();
        };
    }, [
        authToken,
        handleRemoteError,
        refreshAllData,
        refreshFriends,
        refreshSessionGames,
        refreshSessions,
        refreshStats,
        setError,
    ]);
}
