import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { formatMoney, getName } from "../../lib/utils";
import {
    getOpponentInhouseTeam,
    INHOUSE_TEAM,
    INHOUSE_TEAM_LABELS,
    INHOUSE_TEAMS,
} from "../../constants";
import { AnimatedList } from "../shared/motion";
import {
    CloseIcon,
    PencilIcon,
    PlusIcon,
    TrashIcon,
} from "../shared/ActionIcons";
import { SettlementList } from "./SettlementList";
import { InhouseSettlementPanel } from "./InhouseSettlementPanel";
import { SessionModeBadge } from "./SessionModeBadge";
import {
    Badge,
    Button,
    DangerButton,
    EmptyState,
    TextInput,
} from "../shared/ui";
import { SessionLockControl } from "./SessionLockControl";

function ParticipantToggleGroup({
    label,
    type,
    participants,
    selectedIds,
    disabledIds,
    activeClass,
    onToggle,
}) {
    return (
        <>
            <p
                className={`text-sm font-black ${type == "winner" ? "text-cyan-400" : "text-rose-400"}`}
            >
                {label}
            </p>
            <div className="flex flex-wrap gap-2">
                {participants.map((friend) => {
                    const isActive = selectedIds.includes(friend.id);
                    const isDisabled = disabledIds.includes(friend.id);

                    return (
                        <button
                            className={`rounded-full border px-3 py-2 text-sm font-extrabold transition ${
                                isActive
                                    ? activeClass
                                    : isDisabled
                                      ? "border-white/5 bg-white/[0.02] text-slate-600"
                                      : "border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/20"
                            }`}
                            type="button"
                            key={friend.id}
                            disabled={isDisabled}
                            onClick={() => onToggle(friend.id)}
                        >
                            {friend.name}
                        </button>
                    );
                })}
            </div>
        </>
    );
}

function SettlementPanel({ rows, ready }) {
    return (
        <div className="grid content-start gap-3 rounded-2xl border border-white/10 bg-[#151a23] p-4">
            <h3 className="text-lg font-black">자동 정산</h3>
            <div className="grid gap-2">
                <SettlementList ready={ready} rows={rows} />
            </div>
        </div>
    );
}

function PlayerNameList({ ids, friends, align = "left" }) {
    return (
        <strong
            className={`mt-1 flex flex-wrap gap-x-1 gap-y-1 text-sm font-black ${
                align === "right"
                    ? "justify-end text-right text-rose-50"
                    : "justify-start text-left text-cyan-50"
            }`}
        >
            {ids.map((id) => (
                <span className="break-all" key={id}>
                    {getName(friends, id)}
                </span>
            ))}
        </strong>
    );
}

function GameRecordCard({
    game,
    gameNumber,
    index,
    friends,
    isLocked,
    isInhouse,
    onDeleteGame,
}) {
    const winnerTeam = game.winnerTeam;
    return (
        <article
            className={`rounded-2xl border bg-[#151a23] p-4 ${index === 0 ? "border-cyan-400/60" : "border-white/10"}`}
            key={game.id}
        >
            <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3">
                <div className="min-w-0 rounded-xl border border-cyan-400/10 bg-cyan-400/10 px-3 py-3 text-left">
                    <span
                        className={`block text-xs font-black ${
                            isInhouse
                                ? winnerTeam === INHOUSE_TEAM.A
                                    ? "text-indigo-300"
                                    : "text-lime-300"
                                : "text-cyan-300"
                        }`}
                    >
                        {isInhouse
                            ? `${INHOUSE_TEAM_LABELS[winnerTeam]} 승리`
                            : "승자"}
                    </span>
                    <PlayerNameList ids={game.winnerIds} friends={friends} />
                </div>
                <div className="grid justify-items-center gap-2">
                    <span className="rounded-full bg-violet-400/15 px-3 py-1 text-xs font-black text-violet-100">
                        {gameNumber}경기
                    </span>
                    {!isLocked ? (
                        <DangerButton
                            aria-label="승패 기록 삭제"
                            className="rounded-lg px-2.5 py-1.5 text-xs"
                            type="button"
                            onClick={() => onDeleteGame(game.id)}
                            title="승패 기록 삭제"
                        >
                            <TrashIcon className="size-4" />
                        </DangerButton>
                    ) : null}
                </div>
                <div className="min-w-0 rounded-xl border border-rose-400/10 bg-rose-400/10 px-3 py-3 text-right">
                    <span
                        className={`block text-xs font-black ${
                            isInhouse
                                ? winnerTeam === INHOUSE_TEAM.A
                                    ? "text-lime-300"
                                    : "text-indigo-300"
                                : "text-rose-300"
                        }`}
                    >
                        {isInhouse
                            ? `${INHOUSE_TEAM_LABELS[getOpponentInhouseTeam(winnerTeam)]} 패배`
                            : "패자"}
                    </span>
                    <PlayerNameList
                        ids={game.loserIds}
                        friends={friends}
                        align="right"
                    />
                </div>
            </div>
            {game.note && (
                <p className="mt-2 break-keep [overflow-wrap:anywhere] text-sm font-semibold text-slate-400">
                    {game.note}
                </p>
            )}
        </article>
    );
}

export function SessionModal({
    activeSession,
    participants,
    friends,
    games,
    settlements,
    isGamesReady,
    gameDraft,
    isLockUpdating,
    isTitleUpdating,
    onClose,
    onAddGame,
    onDeleteSession,
    onDeleteGame,
    onToggleLock,
    onUpdateTitle,
    onToggleWinner,
    onToggleLoser,
    onSelectWinningTeam,
    onGameDraftChange,
}) {
    const isOpen = Boolean(activeSession);
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [titleDraft, setTitleDraft] = useState("");
    const isSavingTitleRef = useRef(false);
    const titleInputRef = useRef(null);

    useEffect(() => {
        if (isEditingTitle) {
            titleInputRef.current?.focus();
            titleInputRef.current?.select();
        }
    }, [isEditingTitle]);

    useEffect(() => {
        if (!isOpen) {
            return undefined;
        }

        const scrollY = window.scrollY;
        const { body, documentElement } = document;
        const previousStyles = {
            overflow: body.style.overflow,
            paddingRight: body.style.paddingRight,
            position: body.style.position,
            top: body.style.top,
            width: body.style.width,
        };
        const scrollbarWidth = window.innerWidth - documentElement.clientWidth;

        body.style.overflow = "hidden";
        body.style.position = "fixed";
        body.style.top = `-${scrollY}px`;
        body.style.width = "100%";

        if (scrollbarWidth > 0) {
            body.style.paddingRight = `${scrollbarWidth}px`;
        }

        return () => {
            body.style.overflow = previousStyles.overflow;
            body.style.paddingRight = previousStyles.paddingRight;
            body.style.position = previousStyles.position;
            body.style.top = previousStyles.top;
            body.style.width = previousStyles.width;
            window.scrollTo(0, scrollY);
        };
    }, [isOpen]);

    function startTitleEditing() {
        setTitleDraft(activeSession.title);
        setIsEditingTitle(true);
    }

    function cancelTitleEditing() {
        setTitleDraft(activeSession.title);
        setIsEditingTitle(false);
    }

    async function saveTitle() {
        if (isSavingTitleRef.current) {
            return;
        }

        const title = titleDraft.trim();

        if (!title) {
            cancelTitleEditing();
            return;
        }

        if (title === activeSession.title) {
            setTitleDraft(title);
            setIsEditingTitle(false);
            return;
        }

        isSavingTitleRef.current = true;
        let saved;

        try {
            saved = await onUpdateTitle(activeSession.id, title);
        } finally {
            isSavingTitleRef.current = false;
        }

        if (saved) {
            setTitleDraft(title);
            setIsEditingTitle(false);
        }
    }

    return (
        <AnimatePresence>
            {activeSession ? (
                <motion.div
                    animate={{ opacity: 1 }}
                    className="fixed inset-0 z-10 grid place-items-center bg-black/70 p-3 backdrop-blur-sm sm:p-6"
                    exit={{ opacity: 0 }}
                    initial={{ opacity: 0 }}
                    role="dialog"
                    aria-modal="true"
                    transition={{ duration: 0.2 }}
                >
                    <motion.section
                        animate={{ opacity: 1, scale: 1 }}
                        className="max-h-[calc(100svh-2rem)] w-full max-w-6xl overflow-auto rounded-3xl border border-white/10 bg-[#111722] p-4 shadow-2xl shadow-black/40 sm:p-6"
                        exit={{ opacity: 0, scale: 0.88 }}
                        initial={{ opacity: 0, scale: 0.88 }}
                        style={{ transformOrigin: "center" }}
                        transition={{ duration: 0.24, ease: "easeOut" }}
                    >
                        <div className="flex items-start justify-between gap-3">
                            {!activeSession.isLocked ? (
                                <DangerButton
                                    aria-label="세션 삭제"
                                    type="button"
                                    onClick={() =>
                                        onDeleteSession(activeSession.id)
                                    }
                                    title="세션 삭제"
                                >
                                    <TrashIcon />
                                </DangerButton>
                            ) : (
                                <span />
                            )}
                            <div className="flex flex-shrink-0 gap-2">
                                <SessionLockControl
                                    isLocked={activeSession.isLocked}
                                    isUpdating={isLockUpdating}
                                    onToggle={() =>
                                        onToggleLock(activeSession.id)
                                    }
                                />
                                <Button
                                    aria-label="닫기"
                                    type="button"
                                    onClick={onClose}
                                    title="닫기"
                                >
                                    <CloseIcon />
                                </Button>
                            </div>
                        </div>
                        <div className="mt-3 min-w-0">
                            {isEditingTitle ? (
                                <TextInput
                                    aria-label="세션 제목"
                                    className="h-10 min-w-0 max-w-xl border-white/15 bg-white/[0.04] py-1 text-2xl font-black tracking-tight"
                                    disabled={isTitleUpdating}
                                    inputRef={titleInputRef}
                                    value={titleDraft}
                                    onBlur={saveTitle}
                                    onChange={(event) =>
                                        setTitleDraft(event.target.value)
                                    }
                                    onKeyDown={(event) => {
                                        if (event.key === "Enter") {
                                            event.preventDefault();
                                            event.currentTarget.blur();
                                        }

                                        if (event.key === "Escape") {
                                            event.preventDefault();
                                            cancelTitleEditing();
                                        }
                                    }}
                                />
                            ) : (
                                <h2 className="break-keep [overflow-wrap:anywhere] text-2xl font-black tracking-tight text-slate-50">
                                    <button
                                        aria-label="세션 제목 수정"
                                        className="mr-1 inline-flex align-middle items-center justify-center rounded-lg p-2 text-slate-400 transition hover:bg-white/[0.06] hover:text-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                                        type="button"
                                        disabled={isTitleUpdating}
                                        title="세션 제목 수정"
                                        onClick={startTitleEditing}
                                    >
                                        <PencilIcon className="size-4" />
                                    </button>
                                    <span
                                        onClick={
                                            isTitleUpdating
                                                ? undefined
                                                : startTitleEditing
                                        }
                                    >
                                        {activeSession.title}
                                    </span>
                                </h2>
                            )}
                        </div>

                        <div className="my-4 flex flex-wrap gap-2">
                            <SessionModeBadge
                                className="px-3 py-1.5"
                                session={activeSession}
                            />
                            <Badge className="bg-violet-400/10 px-3 py-1.5 text-violet-300">
                                {formatMoney(activeSession.price)} 빵
                            </Badge>
                        </div>

                        <div className="grid items-start gap-3 lg:grid-cols-2">
                            <form
                                className="grid content-start gap-3 rounded-2xl border border-white/10 bg-[#151a23] p-4"
                                onSubmit={onAddGame}
                            >
                                <h3 className="text-lg font-black">
                                    게임 승패 기록
                                </h3>
                                {activeSession.isInhouse ? (
                                    <div className="grid grid-cols-2 gap-2">
                                        {INHOUSE_TEAMS.map((team) => (
                                            <button
                                                className={`rounded-xl border px-3 py-3 text-sm font-black transition ${gameDraft.winnerTeam === team ? (team === INHOUSE_TEAM.A ? "border-indigo-400 bg-indigo-400/15 text-indigo-100" : "border-lime-400 bg-lime-400/15 text-lime-100") : "border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/20"}`}
                                                key={team}
                                                type="button"
                                                onClick={() =>
                                                    onSelectWinningTeam(team)
                                                }
                                            >
                                                {INHOUSE_TEAM_LABELS[team]} 승리
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <>
                                        <ParticipantToggleGroup
                                            label="승자"
                                            type="winner"
                                            participants={participants}
                                            selectedIds={gameDraft.winnerIds}
                                            disabledIds={gameDraft.loserIds}
                                            activeClass="border-cyan-400 bg-cyan-400/15 text-cyan-100"
                                            onToggle={onToggleWinner}
                                        />
                                        <ParticipantToggleGroup
                                            label="패자"
                                            type="loser"
                                            participants={participants}
                                            selectedIds={gameDraft.loserIds}
                                            disabledIds={gameDraft.winnerIds}
                                            activeClass="border-rose-400 bg-rose-400/15 text-rose-100"
                                            onToggle={onToggleLoser}
                                        />
                                    </>
                                )}
                                <TextInput
                                    value={gameDraft.note}
                                    onChange={(event) =>
                                        onGameDraftChange({
                                            ...gameDraft,
                                            note: event.target.value,
                                        })
                                    }
                                    placeholder="메모"
                                />
                                <Button
                                    aria-label="승패 기록 추가"
                                    className="w-full"
                                    type="submit"
                                    title="승패 기록 추가"
                                >
                                    <PlusIcon />
                                </Button>
                            </form>

                            {activeSession.isInhouse ? (
                                <InhouseSettlementPanel
                                    friends={friends}
                                    key={activeSession.id}
                                    ready={isGamesReady}
                                    rows={settlements}
                                    session={activeSession}
                                />
                            ) : (
                                <SettlementPanel
                                    rows={settlements}
                                    ready={isGamesReady}
                                />
                            )}
                        </div>

                        <div className="mt-4">
                            <h3 className="text-lg font-black">승패 기록</h3>
                            <div className="mt-3 grid gap-2">
                                <AnimatedList
                                    getKey={(game) => game.id}
                                    items={games}
                                    ready={isGamesReady}
                                    renderItem={(game, index) => (
                                        <GameRecordCard
                                            game={game}
                                            gameNumber={games.length - index}
                                            index={index}
                                            friends={friends}
                                            isLocked={activeSession.isLocked}
                                            isInhouse={activeSession.isInhouse}
                                            onDeleteGame={onDeleteGame}
                                        />
                                    )}
                                />
                                {!games.length && (
                                    <EmptyState>
                                        승패 기록이 없습니다.
                                    </EmptyState>
                                )}
                            </div>
                        </div>
                    </motion.section>
                </motion.div>
            ) : null}
        </AnimatePresence>
    );
}
