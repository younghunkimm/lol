import { useEffect, useMemo, useState } from "react";
import { DEFAULT_PRICE, emptyData, hasSupabase } from "./constants";
import { FriendManager } from "./components/FriendManager";
import { LeaderSummary } from "./components/LeaderSummary";
import { SessionComposer } from "./components/SessionComposer";
import { SessionList } from "./components/SessionList";
import { SessionModal } from "./components/SessionModal";
import { StatsTable } from "./components/StatsTable";
import { Alert, Panel } from "./components/ui";
import { getLocalData, setLocalData, supabaseRequest } from "./dataClient";
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
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [modalError, setModalError] = useState("");
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
            if (!hasSupabase) {
                setData(getLocalData());
                setIsLoading(false);
                return;
            }

            try {
                const [friends, sessions, games] = await Promise.all([
                    supabaseRequest("friends", { query: "?select=*" }),
                    supabaseRequest("sessions", { query: "?select=*" }),
                    supabaseRequest("games", { query: "?select=*" }),
                ]);

                setData({ friends, sessions, games });
            } catch (loadError) {
                setError(`${loadError.message}. 로컬 저장소로 전환했습니다.`);
                setData(getLocalData());
            } finally {
                setIsLoading(false);
            }
        }

        loadData();
    }, []);

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

    async function commit(nextData, action, errorHandler = setError) {
        errorHandler("");

        if (!hasSupabase || error.includes("로컬 저장소")) {
            setData(nextData);
            setLocalData(nextData);
            return;
        }

        try {
            await action();
            setData(nextData);
            setLocalData(nextData);
        } catch (actionError) {
            errorHandler(
                `${actionError.message}. 이번 변경은 로컬에 저장했습니다.`,
            );
            setData(nextData);
            setLocalData(nextData);
        }
    }

    async function addFriend(event) {
        event.preventDefault();
        const name = friendName.trim();

        if (!name || data.friends.some((friend) => friend.name === name)) {
            return;
        }

        const friend = { id: createId(), name, createdAt: nowIso() };
        await commit({ ...data, friends: [...data.friends, friend] }, () =>
            supabaseRequest("friends", { method: "POST", body: friend }),
        );
        setFriendName("");
    }

    async function removeFriend(friendId) {
        const isUsed = data.sessions.some((session) =>
            session.friendIds.includes(friendId),
        );
        if (isUsed) {
            setError(
                "이미 세션에 포함된 친구는 기록 보존을 위해 삭제할 수 없습니다.",
            );
            return;
        }

        await commit(
            {
                ...data,
                friends: data.friends.filter(
                    (friend) => friend.id !== friendId,
                ),
            },
            () =>
                supabaseRequest("friends", {
                    method: "DELETE",
                    query: `?id=eq.${friendId}`,
                }),
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
            setError("세션에는 2명부터 5명까지 선택할 수 있습니다.");
            return;
        }

        const session = {
            id: createId(),
            title,
            price,
            friendIds: sessionDraft.friendIds,
            createdAt: nowIso(),
        };

        await commit({ ...data, sessions: [session, ...data.sessions] }, () =>
            supabaseRequest("sessions", { method: "POST", body: session }),
        );
        setSessionDraft({
            title: formatSessionTitle(),
            price: DEFAULT_PRICE,
            friendIds: [],
        });
        setActiveSessionId(session.id);
    }

    async function deleteSession(sessionId) {
        if (
            !window.confirm(
                "이 세션을 삭제할까요? 세션의 승패 기록도 함께 삭제됩니다.",
            )
        ) {
            return;
        }

        const nextData = {
            ...data,
            sessions: data.sessions.filter(
                (session) => session.id !== sessionId,
            ),
            games: data.games.filter((game) => game.sessionId !== sessionId),
        };

        await commit(nextData, async () => {
            await supabaseRequest("games", {
                method: "DELETE",
                query: `?sessionId=eq.${sessionId}`,
            });
            await supabaseRequest("sessions", {
                method: "DELETE",
                query: `?id=eq.${sessionId}`,
            });
        });

        if (activeSessionId === sessionId) {
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
            setModalError("승자와 패자를 각각 1명 이상 선택해 주세요.");
            return;
        }

        if (gameDraft.winnerIds.length !== gameDraft.loserIds.length) {
            setModalError("승자와 패자 수가 일치해야 합니다.");
            return;
        }

        const overlap = gameDraft.winnerIds.some((friendId) =>
            gameDraft.loserIds.includes(friendId),
        );
        if (overlap) {
            setModalError(
                "같은 사람을 승자와 패자로 동시에 기록할 수 없습니다.",
            );
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

        await commit(
            { ...data, games: [...data.games, game] },
            () => supabaseRequest("games", { method: "POST", body: game }),
            setModalError,
        );
        setGameDraft({ winnerIds: [], loserIds: [], note: "" });
    }

    async function deleteGame(gameId) {
        if (!window.confirm("이 승패 기록을 삭제할까요?")) {
            return;
        }

        await commit(
            { ...data, games: data.games.filter((game) => game.id !== gameId) },
            () =>
                supabaseRequest("games", {
                    method: "DELETE",
                    query: `?id=eq.${gameId}`,
                }),
            setModalError,
        );
    }

    function closeModal() {
        setActiveSessionId("");
        setModalError("");
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
            <Alert>{error}</Alert>

            {isLoading ? (
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
                modalError={modalError}
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
        </main>
    );
}

export default App;
