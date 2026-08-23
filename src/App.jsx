import { useEffect, useMemo, useRef, useState } from "react";
import { DEFAULT_PRICE, INHOUSE_TEAM } from "./constants";
import { FriendManager } from "./components/friends/FriendManager";
import { LeaderSummary } from "./components/dashboard/LeaderSummary";
import { SessionComposer } from "./components/sessions/SessionComposer";
import { SessionList } from "./components/sessions/SessionList";
import { SessionModal } from "./components/sessions/SessionModal";
import { StatsTable } from "./components/dashboard/StatsTable";
import { Button, Panel, TextInput } from "./components/shared/ui";
import { LoadingIcon } from "./components/shared/ActionIcons";
import { confirmAction, showToast } from "./lib/alerts";
import {
    deleteFriend as deleteRemoteFriend,
    deleteGame as deleteRemoteGame,
    deleteSession as deleteRemoteSession,
    hasFriendRecords,
    insertFriend,
    insertGame,
    insertSession,
    loadSessionGames,
    updateSessionLock as updateRemoteSessionLock,
    updateSessionTitle as updateRemoteSessionTitle,
} from "./services/dataClient";
import { useAuth } from "./hooks/useAuth";
import { useDashboardData } from "./hooks/useDashboardData";
import { useRealtimeSync } from "./hooks/useRealtimeSync";
import { createLeaders, createSessionSettlements } from "./lib/stats";
import {
    createId,
    formatSessionTitle,
    getName,
    nowIso,
    sortByCreatedAt,
} from "./lib/utils";

function prependSessionOnce(sessions, session) {
    if (sessions.some((item) => item.id === session.id)) {
        return sessions;
    }

    return [session, ...sessions];
}

function sortStats(stats) {
    return [...stats].sort((a, b) => {
        const aTotalGames = a.totalGames ?? a.wins + a.losses;
        const bTotalGames = b.totalGames ?? b.wins + b.losses;
        const aHasPlayed = aTotalGames > 0;
        const bHasPlayed = bTotalGames > 0;

        if (aHasPlayed !== bHasPlayed) {
            return aHasPlayed ? -1 : 1;
        }

        if (b.net !== a.net) {
            return b.net - a.net;
        }

        if (b.winRate !== a.winRate) {
            return b.winRate - a.winRate;
        }

        if (bTotalGames !== aTotalGames) {
            return bTotalGames - aTotalGames;
        }

        return a.name.localeCompare(b.name, "ko");
    });
}

function App() {
    const {
        authError,
        authToken,
        handleRemoteError,
        isAuthenticating,
        login,
        password,
        setPassword,
    } = useAuth();
    const {
        commit,
        data,
        error,
        isLoading,
        loadMoreSessions: loadMoreSessionsData,
        refreshAllData,
        refreshFriends,
        refreshSessionGames,
        refreshSessions,
        refreshStats,
        setData,
        setError,
    } = useDashboardData({ authToken, handleRemoteError });
    const [modalError, setModalError] = useState(null);
    const [activeSessionId, setActiveSessionId] = useState("");
    const [isSessionGamesLoading, setIsSessionGamesLoading] = useState(false);
    const isCreatingSessionRef = useRef(false);
    const [isCreatingSession, setIsCreatingSession] = useState(false);
    const [isLoadingMoreSessions, setIsLoadingMoreSessions] = useState(false);
    const [isSessionLockUpdating, setIsSessionLockUpdating] = useState(false);
    const [isSessionTitleUpdating, setIsSessionTitleUpdating] = useState(false);
    const [friendName, setFriendName] = useState("");
    const [sessionDraft, setSessionDraft] = useState({
        title: formatSessionTitle(),
        price: DEFAULT_PRICE,
        friendIds: [],
        isInhouse: false,
        teamAIds: [],
        teamBIds: [],
    });
    const [gameDraft, setGameDraft] = useState({
        winnerIds: [],
        loserIds: [],
        winnerTeam: null,
        note: "",
    });

    useEffect(() => {
        let ignore = false;

        async function loadActiveSessionGames() {
            if (!authToken || !activeSessionId) {
                setData((current) => ({ ...current, games: [] }));
                setIsSessionGamesLoading(false);
                return;
            }

            try {
                const games = await loadSessionGames(activeSessionId);
                if (!ignore) {
                    setData((current) => ({ ...current, games }));
                }
            } catch (loadError) {
                if (!ignore) {
                    handleRemoteError(loadError, setModalError, authToken);
                }
            } finally {
                if (!ignore) {
                    setIsSessionGamesLoading(false);
                }
            }
        }

        loadActiveSessionGames();

        return () => {
            ignore = true;
        };
    }, [activeSessionId, authToken, handleRemoteError, setData]);

    useRealtimeSync({
        activeSessionId,
        authToken,
        handleRemoteError,
        refreshAllData,
        refreshFriends,
        refreshSessionGames,
        refreshSessions,
        refreshStats,
        setError,
    });

    useEffect(() => {
        if (error?.message) {
            showToast(error.message, "error");
        }
    }, [error]);

    useEffect(() => {
        if (modalError?.message) {
            showToast(modalError.message, "error");
        }
    }, [modalError]);

    const activeSession = data.sessions.find(
        (session) => session.id === activeSessionId,
    );
    const activeParticipants = activeSession
        ? activeSession.friendIds.map((friendId) => ({
              id: friendId,
              name: getName(data.friends, friendId),
          }))
        : [];

    const sessionGames = activeSession
        ? sortByCreatedAt(
              data.games.filter((game) => game.sessionId === activeSession.id),
          )
        : [];

    const activeSessionSettlements = createSessionSettlements({
        participants: activeParticipants,
        games: sessionGames,
        session: activeSession,
    });

    const stats = useMemo(() => sortStats(data.stats), [data.stats]);
    const leaders = useMemo(() => createLeaders(stats), [stats]);

    async function addFriend(event) {
        event.preventDefault();
        const name = friendName.trim();

        if (!name) {
            return;
        }

        if (data.friends.some((friend) => friend.name === name)) {
            showToast("이미 등록된 프로게이머입니다.", "error");
            return;
        }

        const friend = { id: createId(), name, createdAt: nowIso() };
        const saved = await commit(
            () => insertFriend(authToken, friend),
            (current) => ({
                ...current,
                friends: current.friends.some((item) => item.id === friend.id)
                    ? current.friends
                    : [friend, ...current.friends],
            }),
        );
        if (saved) {
            setFriendName("");
            Promise.all([refreshStats(), refreshFriends()]).catch((loadError) =>
                handleRemoteError(loadError, setError, authToken),
            );
        }
    }

    async function removeFriend(friendId) {
        let isUsed;

        try {
            isUsed = await hasFriendRecords(friendId);
        } catch (loadError) {
            handleRemoteError(loadError, setError, authToken);
            return;
        }

        if (isUsed) {
            setError({
                message:
                    "이미 세션에 포함된 프로게이머는 기록 보존을 위해 삭제할 수 없습니다.",
                id: Date.now(),
            });
            return;
        }

        const saved = await commit(
            () => deleteRemoteFriend(authToken, friendId),
            (current) => ({
                ...current,
                friends: current.friends.filter(
                    (friend) => friend.id !== friendId,
                ),
            }),
        );
        if (saved) {
            Promise.all([refreshStats(), refreshFriends()]).catch((loadError) =>
                handleRemoteError(loadError, setError, authToken),
            );
        }
    }

    async function createSession(event) {
        event.preventDefault();

        if (isCreatingSessionRef.current) {
            return;
        }

        const title = sessionDraft.title.trim() || formatSessionTitle();
        const price = Math.max(Number(sessionDraft.price) || DEFAULT_PRICE, 0);

        const isValidInhouse =
            sessionDraft.teamAIds.length >= 2 &&
            sessionDraft.teamAIds.length <= 5 &&
            sessionDraft.teamAIds.length === sessionDraft.teamBIds.length;
        const isValidStandard =
            sessionDraft.friendIds.length >= 2 &&
            sessionDraft.friendIds.length <= 5;

        if (sessionDraft.isInhouse ? !isValidInhouse : !isValidStandard) {
            setError({
                message: sessionDraft.isInhouse
                    ? "내전은 양 팀을 같은 인원으로 2명부터 5명까지 배치해 주세요."
                    : "세션에는 2명부터 5명까지 선택할 수 있습니다.",
                id: Date.now(),
            });
            return;
        }

        isCreatingSessionRef.current = true;
        setIsCreatingSession(true);

        const session = {
            id: createId(),
            title,
            price,
            friendIds: sessionDraft.friendIds,
            isInhouse: sessionDraft.isInhouse,
            teamAIds: sessionDraft.teamAIds,
            teamBIds: sessionDraft.teamBIds,
            createdAt: nowIso(),
        };

        setError(null);

        try {
            const savedSession = await insertSession(authToken, session);
            setData((current) => {
                const alreadyExists = current.sessions.some(
                    (item) => item.id === savedSession.id,
                );

                return {
                    ...current,
                    sessions: prependSessionOnce(
                        current.sessions,
                        savedSession,
                    ),
                    totalSessions: alreadyExists
                        ? current.totalSessions
                        : current.totalSessions + 1,
                };
            });
            setSessionDraft({
                title: formatSessionTitle(),
                price: DEFAULT_PRICE,
                friendIds: [],
                isInhouse: sessionDraft.isInhouse,
                teamAIds: [],
                teamBIds: [],
            });
            setActiveSessionId(savedSession.id);
            Promise.all([refreshSessions(), refreshStats()]).catch(
                (loadError) =>
                    handleRemoteError(loadError, setError, authToken),
            );
        } catch (actionError) {
            handleRemoteError(actionError, setError, authToken);
        } finally {
            isCreatingSessionRef.current = false;
            setIsCreatingSession(false);
        }
    }

    async function deleteSession(sessionId) {
        const confirmed = await confirmAction({
            title: "세션을 삭제할까요?",
            text: "세션의 승패 기록도 함께 삭제됩니다.",
            confirmButtonText: "삭제",
        });

        if (!confirmed) {
            return;
        }

        const saved = await commit(
            () => deleteRemoteSession(authToken, sessionId),
            (current) => {
                const sessionExists = current.sessions.some(
                    (session) => session.id === sessionId,
                );

                return {
                    ...current,
                    sessions: current.sessions.filter(
                        (session) => session.id !== sessionId,
                    ),
                    games: current.games.filter(
                        (game) => game.sessionId !== sessionId,
                    ),
                    totalSessions: sessionExists
                        ? Math.max(current.totalSessions - 1, 0)
                        : current.totalSessions,
                };
            },
        );

        if (saved && activeSessionId === sessionId) {
            closeModal();
        }
        if (saved) {
            Promise.all([refreshSessions(), refreshStats()]).catch(
                (loadError) =>
                    handleRemoteError(loadError, setError, authToken),
            );
        }
    }

    async function updateSessionLock(sessionId) {
        if (isSessionLockUpdating) {
            return;
        }

        const session = data.sessions.find((item) => item.id === sessionId);

        if (!session) {
            return;
        }

        const isLocked = !session.isLocked;
        setIsSessionLockUpdating(true);

        try {
            const saved = await commit(
                () => updateRemoteSessionLock(authToken, sessionId, isLocked),
                (current) => ({
                    ...current,
                    sessions: current.sessions.map((item) =>
                        item.id === sessionId ? { ...item, isLocked } : item,
                    ),
                }),
                setModalError,
            );

            if (saved) {
                refreshSessions().catch((loadError) =>
                    handleRemoteError(loadError, setModalError, authToken),
                );
            }
        } finally {
            setIsSessionLockUpdating(false);
        }
    }

    async function updateSessionTitle(sessionId, nextTitle) {
        if (isSessionTitleUpdating) {
            return false;
        }

        const title = nextTitle.trim();
        const session = data.sessions.find((item) => item.id === sessionId);

        if (!session || !title || title === session.title) {
            return Boolean(session && title);
        }

        setIsSessionTitleUpdating(true);

        try {
            const saved = await commit(
                () => updateRemoteSessionTitle(authToken, sessionId, title),
                (current) => ({
                    ...current,
                    sessions: current.sessions.map((item) =>
                        item.id === sessionId ? { ...item, title } : item,
                    ),
                }),
                setModalError,
            );

            if (saved) {
                refreshSessions().catch((loadError) =>
                    handleRemoteError(loadError, setModalError, authToken),
                );
            }

            return saved;
        } finally {
            setIsSessionTitleUpdating(false);
        }
    }

    async function loadMoreSessions() {
        if (isLoadingMoreSessions || !data.hasMoreSessions) {
            return;
        }

        setIsLoadingMoreSessions(true);
        try {
            await loadMoreSessionsData();
        } catch (loadError) {
            handleRemoteError(loadError, setError, authToken);
        } finally {
            setIsLoadingMoreSessions(false);
        }
    }

    async function addGame(event) {
        event.preventDefault();

        if (!activeSession) {
            return;
        }

        if (activeSession.isInhouse && !gameDraft.winnerTeam) {
            setModalError({
                message: "승리한 팀을 선택해 주세요.",
                id: Date.now(),
            });
            return;
        }

        if (
            !activeSession.isInhouse &&
            (!gameDraft.winnerIds.length || !gameDraft.loserIds.length)
        ) {
            setModalError({
                message: "승자와 패자를 각각 1명 이상 선택해 주세요.",
                id: Date.now(),
            });
            return;
        }

        if (
            !activeSession.isInhouse &&
            gameDraft.winnerIds.length !== gameDraft.loserIds.length
        ) {
            setModalError({
                message: "승자와 패자 수가 일치해야 합니다.",
                id: Date.now(),
            });
            return;
        }

        const overlap = gameDraft.winnerIds.some((friendId) =>
            gameDraft.loserIds.includes(friendId),
        );
        if (!activeSession.isInhouse && overlap) {
            setModalError({
                message: "같은 사람을 승자와 패자로 동시에 기록할 수 없습니다.",
                id: Date.now(),
            });
            return;
        }

        const winnerIds = activeSession.isInhouse
            ? gameDraft.winnerTeam === INHOUSE_TEAM.A
                ? activeSession.teamAIds
                : activeSession.teamBIds
            : gameDraft.winnerIds;
        const loserIds = activeSession.isInhouse
            ? gameDraft.winnerTeam === INHOUSE_TEAM.A
                ? activeSession.teamBIds
                : activeSession.teamAIds
            : gameDraft.loserIds;
        const game = {
            id: createId(),
            sessionId: activeSession.id,
            winnerIds,
            loserIds,
            winnerTeam: activeSession.isInhouse ? gameDraft.winnerTeam : null,
            note: gameDraft.note.trim(),
            createdAt: nowIso(),
        };

        const saved = await commit(
            () => insertGame(authToken, game),
            (current) => ({
                ...current,
                games: current.games.some((item) => item.id === game.id)
                    ? current.games
                    : [...current.games, game],
            }),
            setModalError,
        );
        if (saved) {
            setGameDraft({
                winnerIds: [],
                loserIds: [],
                winnerTeam: null,
                note: "",
            });
            Promise.all([
                refreshSessionGames(activeSession.id),
                refreshSessions(),
                refreshStats(),
            ]).catch((loadError) =>
                handleRemoteError(loadError, setModalError, authToken),
            );
        }
    }

    async function deleteGame(gameId) {
        const confirmed = await confirmAction({
            title: "승패 기록을 삭제할까요?",
            confirmButtonText: "삭제",
        });

        if (!confirmed) {
            return;
        }

        const saved = await commit(
            () => deleteRemoteGame(authToken, gameId),
            (current) => ({
                ...current,
                games: current.games.filter((game) => game.id !== gameId),
            }),
            setModalError,
        );
        if (saved) {
            Promise.all([
                activeSessionId
                    ? refreshSessionGames(activeSessionId)
                    : Promise.resolve(),
                refreshSessions(),
                refreshStats(),
            ]).catch((loadError) =>
                handleRemoteError(loadError, setModalError, authToken),
            );
        }
    }

    function closeModal() {
        setActiveSessionId("");
        setIsSessionGamesLoading(false);
        setIsSessionLockUpdating(false);
        setModalError(null);
        setGameDraft({
            winnerIds: [],
            loserIds: [],
            winnerTeam: null,
            note: "",
        });
    }

    function openSession(sessionId) {
        setIsSessionGamesLoading(true);
        setActiveSessionId(sessionId);
    }

    function toggleSessionFriend(friendId) {
        setSessionDraft((current) => {
            const exists = current.friendIds.includes(friendId);
            const friendIds = exists
                ? current.friendIds.filter((id) => id !== friendId)
                : [...current.friendIds, friendId].slice(0, 5);

            return { ...current, friendIds };
        });
    }

    function moveInhouseFriend(friendId, team) {
        setSessionDraft((current) => {
            const teamAIds = current.teamAIds.filter((id) => id !== friendId);
            const teamBIds = current.teamBIds.filter((id) => id !== friendId);

            if (team === INHOUSE_TEAM.A) teamAIds.push(friendId);
            if (team === INHOUSE_TEAM.B) teamBIds.push(friendId);

            return {
                ...current,
                teamAIds,
                teamBIds,
                friendIds: [...teamAIds, ...teamBIds],
            };
        });
    }

    function toggleGameFriend(type, friendId) {
        setGameDraft((current) => {
            const values = current[type];
            const nextValues = values.includes(friendId)
                ? values.filter((id) => id !== friendId)
                : [...values, friendId];

            if (type === "winnerIds") {
                return {
                    ...current,
                    winnerIds: nextValues,
                    loserIds: current.loserIds.filter((id) => id !== friendId),
                };
            }

            return {
                ...current,
                winnerIds: current.winnerIds.filter((id) => id !== friendId),
                loserIds: nextValues,
            };
        });
    }

    return (
        <main className="mx-auto min-h-svh w-full max-w-7xl px-4 py-5 text-slate-100 sm:px-6 lg:px-8 lg:py-8">
            {!authToken ? (
                <div className="grid min-h-[calc(100svh-8rem)] place-items-center">
                    <Panel className="w-full max-w-sm">
                        <form className="grid gap-4" onSubmit={login}>
                            <div>
                                <h1 className="text-xl font-black text-slate-50">
                                    비밀번호 확인
                                </h1>
                            </div>
                            <TextInput
                                autoFocus
                                type="password"
                                value={password}
                                onChange={(event) =>
                                    setPassword(event.target.value)
                                }
                                placeholder="비밀번호 입력"
                                aria-label="비밀번호 입력"
                            />
                            {authError ? (
                                <p className="text-sm font-bold text-rose-300">
                                    {authError}
                                </p>
                            ) : null}
                            <Button type="submit" disabled={isAuthenticating}>
                                {isAuthenticating ? (
                                    <LoadingIcon
                                        className="size-4"
                                        aria-label="비밀번호 확인 중"
                                    />
                                ) : (
                                    "입장"
                                )}
                            </Button>
                        </form>
                    </Panel>
                </div>
            ) : isLoading ? (
                <Panel className="grid min-h-56 place-items-center text-sm font-bold text-slate-400">
                    데이터를 불러오는 중입니다.
                </Panel>
            ) : (
                <>
                    <LeaderSummary leaders={leaders} />

                    <section className="mb-4 grid gap-4 lg:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.75fr)]">
                        <SessionComposer
                            friends={data.friends}
                            sessionDraft={sessionDraft}
                            isSubmitting={isCreatingSession}
                            onDraftChange={setSessionDraft}
                            onSubmit={createSession}
                            onToggleFriend={toggleSessionFriend}
                            onMoveInhouseFriend={moveInhouseFriend}
                        />
                        <FriendManager
                            friends={data.friends}
                            friendName={friendName}
                            onNameChange={setFriendName}
                            onSubmit={addFriend}
                            onRemoveFriend={removeFriend}
                        />
                    </section>

                    <SessionList
                        sessions={data.sessions}
                        friends={data.friends}
                        totalSessions={data.totalSessions}
                        hasMore={data.hasMoreSessions}
                        isLoadingMore={isLoadingMoreSessions}
                        activeSessionId={activeSessionId}
                        onOpenSession={openSession}
                        onLoadMore={loadMoreSessions}
                    />

                    <StatsTable stats={stats} />
                </>
            )}

            <SessionModal
                activeSession={activeSession}
                participants={activeParticipants}
                friends={data.friends}
                games={sessionGames}
                settlements={activeSessionSettlements}
                isGamesReady={!isSessionGamesLoading}
                gameDraft={gameDraft}
                isLockUpdating={isSessionLockUpdating}
                isTitleUpdating={isSessionTitleUpdating}
                onClose={closeModal}
                onAddGame={addGame}
                onDeleteSession={deleteSession}
                onDeleteGame={deleteGame}
                onToggleLock={updateSessionLock}
                onUpdateTitle={updateSessionTitle}
                onToggleWinner={(friendId) =>
                    toggleGameFriend("winnerIds", friendId)
                }
                onToggleLoser={(friendId) =>
                    toggleGameFriend("loserIds", friendId)
                }
                onSelectWinningTeam={(winnerTeam) =>
                    setGameDraft((current) => ({ ...current, winnerTeam }))
                }
                onGameDraftChange={setGameDraft}
            />

            <footer className="mt-8 pb-2 text-center text-xs font-semibold text-slate-500">
                작고 소중한 영훈이에게 커피 한잔<br></br>
                카카오뱅크 3333-12-2105691
            </footer>
        </main>
    );
}

export default App;
