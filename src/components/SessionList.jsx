import { formatMoney, getName, sortByCreatedAt } from "../utils";
import { Button, DangerButton, EmptyState, Panel } from "./ui";

export function SessionList({
    sessions,
    games,
    friends,
    onOpenSession,
    onDeleteSession,
}) {
    return (
        <Panel className="mb-4">
            <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-xl font-black tracking-tight">세션 목록</h2>
                <span className="text-sm font-extrabold text-slate-400">
                    {sessions.length}개
                </span>
            </div>
            <div className="grid gap-3">
                {sortByCreatedAt(sessions).map((session) => {
                    const gameCount = games.filter(
                        (game) => game.sessionId === session.id,
                    ).length;

                    return (
                        <article
                            className="grid gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 shadow-sm shadow-black/20 sm:grid-cols-[minmax(0,1fr)_auto] lg:grid-cols-[minmax(0,1fr)_auto_auto] lg:items-center"
                            key={session.id}
                        >
                            <div className="min-w-0">
                                <h3 className="truncate text-base font-black text-slate-50">
                                    {session.title}
                                </h3>
                                <p className="mt-1 truncate text-sm font-semibold text-slate-400">
                                    {session.friendIds
                                        .map((friendId) =>
                                            getName(friends, friendId),
                                        )
                                        .join(", ")}
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-1.5 items-center">
                                <span className="rounded-full bg-violet-400/10 px-2.5 py-1 text-xs font-black text-violet-300">
                                    {formatMoney(session.price)} / 판
                                </span>
                                <span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-xs font-black text-slate-300">
                                    {gameCount}게임
                                </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 sm:flex">
                                <Button
                                    type="button"
                                    onClick={() => onOpenSession(session.id)}
                                >
                                    상세보기
                                </Button>
                                <DangerButton
                                    type="button"
                                    onClick={() => onDeleteSession(session.id)}
                                >
                                    삭제
                                </DangerButton>
                            </div>
                        </article>
                    );
                })}
                {!sessions.length && (
                    <EmptyState>아직 생성된 세션이 없습니다.</EmptyState>
                )}
            </div>
        </Panel>
    );
}
