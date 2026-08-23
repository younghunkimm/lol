import { AnimatedList } from "../shared/motion";
import { formatMoney, getName, sortByCreatedAt } from "../../lib/utils";
import { Button, EmptyState, Panel } from "../shared/ui";
import { SessionLockControl } from "./SessionLockControl";

export function SessionList({
    sessions,
    friends,
    totalSessions,
    hasMore,
    isLoadingMore,
    onOpenSession,
    onLoadMore,
}) {
    return (
        <Panel className="mb-4">
            <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-xl font-black tracking-tight">세션 목록</h2>
                <span className="text-sm font-extrabold text-slate-400">
                    총 {totalSessions}개
                </span>
            </div>
            <div className="grid gap-3">
                <AnimatedList
                    as="article"
                    className="grid gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 shadow-sm shadow-black/20 sm:grid-cols-[minmax(0,1fr)_auto] lg:grid-cols-[minmax(0,1fr)_auto_auto] lg:items-center"
                    getKey={(session) => session.id}
                    items={sortByCreatedAt(sessions)}
                    renderItem={(session) => (
                        <>
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
                            <SessionLockControl
                                className="size-5"
                                isLocked={session.isLocked}
                                variant="icon"
                            />
                            <span className="rounded-full bg-violet-400/10 px-2.5 py-1 text-xs font-black text-violet-300">
                                {formatMoney(session.price)} / 판
                            </span>
                                <span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-xs font-black text-slate-300">
                                    {session.gameCount ?? 0}게임
                                </span>
                            </div>
                        <div className="flex">
                            <Button
                                type="button"
                                onClick={() => onOpenSession(session.id)}
                            >
                                상세보기
                            </Button>
                        </div>
                        </>
                    )}
                />
                {!sessions.length && (
                    <EmptyState>아직 생성된 세션이 없습니다.</EmptyState>
                )}
                {hasMore ? (
                    <Button
                        className="justify-self-center px-6"
                        type="button"
                        disabled={isLoadingMore}
                        onClick={onLoadMore}
                    >
                        {isLoadingMore ? "불러오는 중" : "더보기"}
                    </Button>
                ) : null}
            </div>
        </Panel>
    );
}
