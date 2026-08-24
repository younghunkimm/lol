import { AnimatedList } from "../shared/motion";
import { CheckIcon, LoadingIcon, MoreIcon } from "../shared/ActionIcons";
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
    isSelectionMode,
    selectedSessionIds,
    onOpenSession,
    onLoadMore,
    onStartSelection,
    onCancelSelection,
    onToggleSelection,
    onOpenSelectedSettlement,
}) {
    const selectedCount = selectedSessionIds.length;

    return (
        <Panel className="mb-4">
            <div className="mb-4 flex items-center justify-between gap-3">
                <CardHeader
                    meta={
                        <HeaderCount
                            prefix="총 "
                            suffix="건"
                            value={totalSessions}
                        />
                    }
                    title="세션 목록"
                />
                <button
                    aria-pressed={isSelectionMode}
                    className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-black shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 ${
                        isSelectionMode
                            ? "border-rose-300/50 bg-rose-400/15 text-rose-100 shadow-rose-950/30 hover:bg-rose-400/25"
                            : "border-cyan-300/80 bg-cyan-400 text-slate-950 shadow-cyan-950/40 hover:bg-cyan-300"
                    }`}
                    type="button"
                    onClick={
                        isSelectionMode
                            ? onCancelSelection
                            : onStartSelection
                    }
                >
                    <CheckIcon className="size-3.5" />
                    {isSelectionMode ? "선택 취소" : "선택 모드"}
                </button>
            </div>
            <div className="grid gap-3">
                <AnimatedList
                    as="button"
                    className={(session) => {
                        const isSelected = selectedSessionIds.includes(session.id);

                        return `relative grid w-full gap-3 rounded-2xl border p-4 text-left shadow-sm transition sm:grid-cols-[minmax(0,1fr)_auto] lg:grid-cols-[minmax(0,1fr)_auto_auto] lg:items-center ${
                            isSelectionMode && isSelected
                                ? "border-cyan-400 bg-cyan-400/10 shadow-cyan-400/20 ring-2 ring-cyan-400/30"
                                : session.id === activeSessionId
                                  ? "border-cyan-400 bg-cyan-400/10 shadow-cyan-400/20 ring-2 ring-cyan-400/30"
                                  : "border-white/10 bg-white/[0.03] shadow-black/20 hover:border-cyan-400/50 hover:bg-cyan-400/[0.06]"
                        }`;
                    }}
                    getKey={(session) => session.id}
                    itemProps={(session) => ({
                        "aria-label": isSelectionMode
                            ? `${session.title} ${selectedSessionIds.includes(session.id) ? "선택 해제" : "선택"}`
                            : `${session.title} 상세보기`,
                        "aria-pressed": isSelectionMode
                            ? selectedSessionIds.includes(session.id)
                            : session.id === activeSessionId,
                        type: "button",
                        onClick: () =>
                            isSelectionMode
                                ? onToggleSelection(session.id)
                                : onOpenSession(session.id),
                    })}
                    items={sortByCreatedAt(sessions)}
                    renderItem={(session) => (
                        <>
                            {isSelectionMode ? (
                                <span
                                    aria-hidden="true"
                                    className={`absolute left-4 top-4 grid size-6 place-items-center rounded-full border transition ${
                                        selectedSessionIds.includes(session.id)
                                            ? "border-cyan-300 bg-cyan-300 text-slate-950"
                                            : "border-white/20 bg-[#151a23] text-slate-600"
                                    }`}
                                >
                                    {selectedSessionIds.includes(session.id) ? (
                                        <CheckIcon className="size-4" />
                                    ) : null}
                                </span>
                            ) : null}
                            <div
                                className={`min-w-0 ${
                                    isSelectionMode ? "pl-9" : ""
                                }`}
                            >
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
                {isSelectionMode ? (
                    <div className="sticky bottom-3 z-10 flex items-center justify-between gap-3 rounded-2xl border border-cyan-400/20 bg-[#111722]/95 p-3 shadow-lg shadow-black/30 backdrop-blur">
                        <strong className="text-sm text-slate-200">
                            <span className="text-cyan-300">{selectedCount}</span>개 선택됨
                        </strong>
                        <Button
                            className="px-3 py-2"
                            type="button"
                            disabled={!selectedCount}
                            onClick={onOpenSelectedSettlement}
                        >
                            합산 정산 보기
                        </Button>
                    </div>
                ) : null}
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
