import { useEffect, useMemo, useState } from "react";
import { DEFAULT_PRICE, emptyData } from "./constants";
import { FriendManager } from "./components/FriendManager";
import { LeaderSummary } from "./components/LeaderSummary";
import { SessionComposer } from "./components/SessionComposer";
import { SessionList } from "./components/SessionList";
import { SessionModal } from "./components/SessionModal";
import { StatsTable } from "./components/StatsTable";
import { Button, Panel, TextInput } from "./components/ui";
import { confirmAction, showToast } from "./alerts";
import {
    clearAuthToken,
    deleteFriend as deleteRemoteFriend,
    deleteGame as deleteRemoteGame,
    deleteSession as deleteRemoteSession,
    getAuthToken,
    insertFriend,
    insertGame,
    insertSession,
    loginWithPassword,
    loadRemoteData,
    setStoredAuthToken,
} from "./dataClient";
import { createLeaders, createSessionSettlements, createStats } from "./stats";
import {
    createId,
    formatSessionTitle,
    getName,
    nowIso,
    sortByCreatedAt,
} from "./utils";

function App() {
    const [data, setData] = useState(emptyData);
    const [authToken, setAuthToken] = useState(() => getAuthToken());
    const [password, setPassword] = useState("");
    const [authError, setAuthError] = useState("");
    const [isAuthenticating, setIsAuthenticating] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [modalError, setModalError] = useState(null);
    const [activeSessionId, setActiveSessionId] = useState("");
    const [friendName, setFriendName] = useState("");
    const [sessionDraft, setSessionDraft] = useState({
        title: formatSessionTitle(),
        price: DEFAULT_PRICE,
        friendIds: [],
    });
    const [gameDraft, setGameDraft] = useState({
        winnerIds: [],
        loserIds: [],
        note: "",
    });

    useEffect(() => {
        async function loadData() {
            if (!authToken) {
                setIsLoading(false);
                return;
            }

            try {
                setData(await loadRemoteData(authToken));
            } catch (loadError) {
                if (loadError.status === 401) {
                    resetAuth();
                    return;
                }

                setError({
                    message: loadError.message,
                    id: Date.now(),
                });
            } finally {
                setIsLoading(false);
            }
        }

        loadData();
    }, [authToken]);

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

    const stats = useMemo(() => createStats(data), [data]);
    const leaders = useMemo(() => createLeaders(stats), [stats]);

    function resetAuth() {
        clearAuthToken();
        setAuthToken("");
        setIsLoading(false);
    }

    async function commit(nextData, action, errorHandler = setError) {
        errorHandler(null);

        try {
            await action();
            setData(nextData);
            return true;
        } catch (actionError) {
            if (actionError.status === 401) {
                resetAuth();
                return false;
            }

            errorHandler({
                message: actionError.message,
                id: Date.now(),
            });
            return false;
        }
    }

    async function login(event) {
        event.preventDefault();
        const trimmedPassword = password.trim();

        if (!trimmedPassword) {
            setAuthError("비밀번호를 입력해 주세요.");
            return;
        }

        setAuthError("");
        setIsAuthenticating(true);

        try {
            const authSession = await loginWithPassword(trimmedPassword);
            await setStoredAuthToken(authSession);
            setPassword("");
            setIsLoading(true);
            setAuthToken(authSession.accessToken);
        } catch (loginError) {
            clearAuthToken();
            setAuthError(loginError.message);
        } finally {
            setIsAuthenticating(false);
        }
    }

    async function addFriend(event) {
        event.preventDefault();
        const name = friendName.trim();

        if (!name || data.friends.some((friend) => friend.name === name)) {
            return;
        }

        const friend = { id: createId(), name, createdAt: nowIso() };
        const saved = await commit(
            { ...data, friends: [...data.friends, friend] },
            () => insertFriend(authToken, friend),
        );
        if (saved) {
            setFriendName("");
        }
    }

    async function removeFriend(friendId) {
        const isUsed = data.sessions.some((session) =>
            session.friendIds.includes(friendId),
        );
        if (isUsed) {
            setError({
                message:
                    "이미 세션에 포함된 프로게이머는 기록 보존을 위해 삭제할 수 없습니다.",
                id: Date.now(),
            });
            return;
        }

        await commit(
            {
                ...data,
                friends: data.friends.filter(
                    (friend) => friend.id !== friendId,
                ),
            },
            () => deleteRemoteFriend(authToken, friendId),
        );
    }

    async function createSession(event) {
        event.preventDefault();
        const title = sessionDraft.title.trim() || formatSessionTitle();
        const price = Math.max(Number(sessionDraft.price) || DEFAULT_PRICE, 0);

        if (
            sessionDraft.friendIds.length < 2 ||
            sessionDraft.friendIds.length > 5
        ) {
            setError({
                message: "세션에는 2명부터 5명까지 선택할 수 있습니다.",
                id: Date.now(),
            });
            return;
        }

        const session = {
            id: createId(),
            title,
            price,
            friendIds: sessionDraft.friendIds,
            createdAt: nowIso(),
        };

        const saved = await commit(
            { ...data, sessions: [session, ...data.sessions] },
            () => insertSession(authToken, session),
        );
        if (saved) {
            setSessionDraft({
                title: formatSessionTitle(),
                price: DEFAULT_PRICE,
                friendIds: [],
            });
            setActiveSessionId(session.id);
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

        const nextData = {
            ...data,
            sessions: data.sessions.filter(
                (session) => session.id !== sessionId,
            ),
            games: data.games.filter((game) => game.sessionId !== sessionId),
        };

        const saved = await commit(nextData, () =>
            deleteRemoteSession(authToken, sessionId),
        );

        if (saved && activeSessionId === sessionId) {
            closeModal();
        }
    }

    async function addGame(event) {
        event.preventDefault();

        if (
            !activeSession ||
            !gameDraft.winnerIds.length ||
            !gameDraft.loserIds.length
        ) {
            setModalError({
                message: "승자와 패자를 각각 1명 이상 선택해 주세요.",
                id: Date.now(),
            });
            return;
        }

        if (gameDraft.winnerIds.length !== gameDraft.loserIds.length) {
            setModalError({
                message: "승자와 패자 수가 일치해야 합니다.",
                id: Date.now(),
            });
            return;
        }

        const overlap = gameDraft.winnerIds.some((friendId) =>
            gameDraft.loserIds.includes(friendId),
        );
        if (overlap) {
            setModalError({
                message: "같은 사람을 승자와 패자로 동시에 기록할 수 없습니다.",
                id: Date.now(),
            });
            return;
        }

        const game = {
            id: createId(),
            sessionId: activeSession.id,
            winnerIds: gameDraft.winnerIds,
            loserIds: gameDraft.loserIds,
            note: gameDraft.note.trim(),
            createdAt: nowIso(),
        };

        const saved = await commit(
            { ...data, games: [...data.games, game] },
            () => insertGame(authToken, game),
            setModalError,
        );
        if (saved) {
            setGameDraft({ winnerIds: [], loserIds: [], note: "" });
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

        await commit(
            { ...data, games: data.games.filter((game) => game.id !== gameId) },
            () => deleteRemoteGame(authToken, gameId),
            setModalError,
        );
    }

    function closeModal() {
        setActiveSessionId("");
        setModalError(null);
        setGameDraft({ winnerIds: [], loserIds: [], note: "" });
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
                                {isAuthenticating ? "확인 중" : "입장"}
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
                            onDraftChange={setSessionDraft}
                            onSubmit={createSession}
                            onToggleFriend={toggleSessionFriend}
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
                        games={data.games}
                        friends={data.friends}
                        onOpenSession={setActiveSessionId}
                        onDeleteSession={deleteSession}
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
                gameDraft={gameDraft}
                onClose={closeModal}
                onAddGame={addGame}
                onDeleteGame={deleteGame}
                onToggleWinner={(friendId) =>
                    toggleGameFriend("winnerIds", friendId)
                }
                onToggleLoser={(friendId) =>
                    toggleGameFriend("loserIds", friendId)
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
