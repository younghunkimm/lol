import { AnimatedList } from "../shared/motion";
import { LoadingIcon, MoreIcon } from "../shared/ActionIcons";
import { formatMoney, getName, sortByCreatedAt } from "../../lib/utils";
import {
    Badge,
    Button,
    CardHeader,
    EmptyState,
    HeaderCount,
    Panel,
} from "../shared/ui";
import { SessionLockControl } from "./SessionLockControl";
import { SessionModeBadge } from "./SessionModeBadge";

export function SessionList({
    sessions,
    friends,
    totalSessions,
    hasMore,
    isLoadingMore,
    activeSessionId,
    onOpenSession,
    onLoadMore,
}) {
    return (
        <Panel className="mb-4">
            <CardHeader
                className="mb-4"
                right={
                    <HeaderCount
                        prefix="총 "
                        suffix="건"
                        value={totalSessions}
                    />
                }
                title="세션 목록"
            />
            <div className="grid gap-3">
                <AnimatedList
                    as="button"
                    className={(session) =>
                        `grid w-full gap-3 rounded-2xl border p-4 text-left shadow-sm transition sm:grid-cols-[minmax(0,1fr)_auto] lg:grid-cols-[minmax(0,1fr)_auto_auto] lg:items-center ${
                            session.id === activeSessionId
                                ? "border-cyan-400 bg-cyan-400/10 shadow-cyan-400/20 ring-2 ring-cyan-400/30"
                                : "border-white/10 bg-white/[0.03] shadow-black/20 hover:border-cyan-400/50 hover:bg-cyan-400/[0.06]"
                        }`
                    }
                    getKey={(session) => session.id}
                    itemProps={(session) => ({
                        "aria-label": `${session.title} 상세보기`,
                        "aria-pressed": session.id === activeSessionId,
                        type: "button",
                        onClick: () => onOpenSession(session.id),
                    })}
                    items={sortByCreatedAt(sessions)}
                    renderItem={(session) => (
                        <>
                            <div className="min-w-0">
                                <h3 className="truncate text-base font-black text-slate-50">
                                    {session.title}
                                </h3>
                                {session.isInhouse ? (
                                    <div className="mt-2 grid gap-1.5 text-xs font-bold">
                                        {[
                                            {
                                                ids: session.teamAIds,
                                                className:
                                                    "border-indigo-400/30 bg-indigo-400/10 text-indigo-100",
                                            },
                                            {
                                                ids: session.teamBIds,
                                                className:
                                                    "border-lime-400/30 bg-lime-400/10 text-lime-100",
                                            },
                                        ].map(({ ids, className }, index) => (
                                            <div
                                                className="flex flex-wrap gap-1.5"
                                                key={index}
                                            >
                                                {ids.map((friendId) => (
                                                    <span
                                                        className={`rounded-md border px-2 py-1 ${className}`}
                                                        key={friendId}
                                                    >
                                                        {getName(
                                                            friends,
                                                            friendId,
                                                        )}
                                                    </span>
                                                ))}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="mt-2 flex flex-wrap gap-1.5 text-xs font-bold">
                                        {session.friendIds.map((friendId) => (
                                            <span
                                                className="rounded-md bg-white/[0.06] px-2 py-1 text-slate-300"
                                                key={friendId}
                                            >
                                                {getName(friends, friendId)}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-wrap gap-1.5 items-center">
                                <SessionLockControl
                                    className="size-5"
                                    isLocked={session.isLocked}
                                    variant="icon"
                                />
                                <SessionModeBadge
                                    className="px-2 py-1"
                                    session={session}
                                />
                                <Badge className="bg-violet-400/10 px-2.5 py-1 text-violet-300">
                                    {formatMoney(session.price)} 빵
                                </Badge>
                                <Badge className="bg-white/[0.06] px-2.5 py-1 text-slate-300">
                                    {session.gameCount ?? 0}게임
                                </Badge>
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
                        aria-label={
                            isLoadingMore ? "세션 불러오는 중" : "세션 더보기"
                        }
                        type="button"
                        disabled={isLoadingMore}
                        onClick={onLoadMore}
                        title={
                            isLoadingMore ? "세션 불러오는 중" : "세션 더보기"
                        }
                    >
                        {isLoadingMore ? <LoadingIcon /> : <MoreIcon />}
                    </Button>
                ) : null}
            </div>
        </Panel>
    );
}
