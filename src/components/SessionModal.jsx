import {
    formatMoney,
    formatSignedMoney,
    getName,
    getSignedMoneyClass,
} from "../utils";
import { Button, DangerButton, EmptyState, TextInput } from "./ui";

function ParticipantToggleGroup({
    label,
    participants,
    selectedIds,
    disabledIds,
    activeClass,
    onToggle,
}) {
    return (
        <>
            <p className="text-sm font-black text-slate-300">{label}</p>
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

function SettlementPanel({ rows }) {
    return (
        <div className="grid content-start gap-3 rounded-2xl border border-white/10 bg-[#151a23] p-4">
            <h3 className="text-lg font-black">자동 정산</h3>
            <div className="grid gap-2">
                {rows.map((row) => (
                    <div
                        className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-white/5 bg-white/[0.04] px-3 py-2.5"
                        key={row.id}
                    >
                        <span className="truncate text-sm font-extrabold text-slate-200">
                            {row.name}
                        </span>
                        <strong
                            className={`text-base font-black ${getSignedMoneyClass(row.net)}`}
                        >
                            {formatSignedMoney(row.net)}
                        </strong>
                    </div>
                ))}
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

function GameRecordCard({ game, gameNumber, index, friends, onDeleteGame }) {
    return (
        <article
            className={`rounded-2xl border bg-[#151a23] p-4 ${index === 0 ? "border-cyan-400/60" : "border-white/10"}`}
            key={game.id}
        >
            <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3">
                <div className="min-w-0 rounded-xl border border-cyan-400/10 bg-cyan-400/10 px-3 py-3 text-left">
                    <span className="block text-xs font-black text-cyan-300">
                        승자
                    </span>
                    <PlayerNameList ids={game.winnerIds} friends={friends} />
                </div>
                <div className="grid justify-items-center gap-2">
                    <span className="rounded-full bg-violet-400/15 px-3 py-1 text-xs font-black text-violet-100">
                        {gameNumber}경기
                    </span>
                    <DangerButton
                        className="rounded-lg px-2.5 py-1.5 text-xs"
                        type="button"
                        onClick={() => onDeleteGame(game.id)}
                    >
                        삭제
                    </DangerButton>
                </div>
                <div className="min-w-0 rounded-xl border border-rose-400/10 bg-rose-400/10 px-3 py-3 text-right">
                    <span className="block text-xs font-black text-rose-300">
                        패자
                    </span>
                    <PlayerNameList
                        ids={game.loserIds}
                        friends={friends}
                        align="right"
                    />
                </div>
            </div>
            {game.note && (
                <p className="mt-2 text-sm font-semibold text-slate-400">
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
    gameDraft,
    onClose,
    onAddGame,
    onDeleteGame,
    onToggleWinner,
    onToggleLoser,
    onGameDraftChange,
}) {
    if (!activeSession) {
        return null;
    }

    return (
        <div
            className="fixed inset-0 z-10 grid place-items-center bg-black/70 p-3 backdrop-blur-sm sm:p-6"
            role="dialog"
            aria-modal="true"
        >
            <section className="max-h-[calc(100svh-2rem)] w-full max-w-6xl overflow-auto rounded-3xl border border-white/10 bg-[#111722] p-4 shadow-2xl shadow-black/40 sm:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                        <h2 className="text-2xl font-black tracking-tight text-slate-50">
                            {activeSession.title}
                        </h2>
                    </div>
                    <Button
                        className="order-first self-end sm:order-none sm:self-auto"
                        type="button"
                        onClick={onClose}
                    >
                        닫기
                    </Button>
                </div>

                <div className="my-4 flex flex-wrap gap-2">
                    <span className="rounded-full bg-violet-400/10 px-3 py-1.5 text-xs font-black text-violet-300">
                        {formatMoney(activeSession.price)} / 판
                    </span>
                    <span className="rounded-full bg-white/[0.06] px-3 py-1.5 text-xs font-black text-slate-300">
                        {participants.map((friend) => friend.name).join(", ")}
                    </span>
                </div>

                <div className="grid gap-3 lg:grid-cols-2">
                    <form
                        className="grid gap-3 rounded-2xl border border-white/10 bg-[#151a23] p-4"
                        onSubmit={onAddGame}
                    >
                        <h3 className="text-lg font-black">게임 승패 기록</h3>
                        <ParticipantToggleGroup
                            label="승자"
                            participants={participants}
                            selectedIds={gameDraft.winnerIds}
                            disabledIds={gameDraft.loserIds}
                            activeClass="border-cyan-400 bg-cyan-400/15 text-cyan-100"
                            onToggle={onToggleWinner}
                        />
                        <ParticipantToggleGroup
                            label="패자"
                            participants={participants}
                            selectedIds={gameDraft.loserIds}
                            disabledIds={gameDraft.winnerIds}
                            activeClass="border-rose-400 bg-rose-400/15 text-rose-100"
                            onToggle={onToggleLoser}
                        />
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
                        <Button className="w-full" type="submit">
                            승패 추가
                        </Button>
                    </form>

                    <SettlementPanel rows={settlements} />
                </div>

                <div className="mt-4">
                    <h3 className="text-lg font-black">승패 기록</h3>
                    <div className="mt-3 grid gap-2">
                        {games.map((game, index) => (
                            <GameRecordCard
                                game={game}
                                gameNumber={games.length - index}
                                index={index}
                                friends={friends}
                                onDeleteGame={onDeleteGame}
                                key={game.id}
                            />
                        ))}
                        {!games.length && (
                            <EmptyState>승패 기록이 없습니다.</EmptyState>
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
}
