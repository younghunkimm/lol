import { useRef, useState } from "react";
import {
    DndContext,
    DragOverlay,
    MouseSensor,
    TouchSensor,
    useDraggable,
    useDroppable,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import { Button, CardHeader, Panel, TextInput } from "../shared/ui";
import { LoadingIcon, PlusIcon } from "../shared/ActionIcons";
import { INHOUSE_TEAM, INHOUSE_TEAM_LABELS } from "../../constants";

const teamStyles = {
    pool: "border-white/10 bg-white/[0.03] text-slate-200",
    [INHOUSE_TEAM.A]: "border-indigo-400/30 bg-indigo-400/10 text-indigo-100",
    [INHOUSE_TEAM.B]: "border-lime-400/30 bg-lime-400/10 text-lime-100",
};

function PlayerChip({ friend, team, onMove, suppressClickRef }) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: friend.id,
    });

    return (
        <button
            className={`rounded-full border border-current/30 bg-black/10 px-3 py-2 text-sm font-extrabold transition hover:bg-black/20 ${isDragging ? "opacity-35" : ""}`}
            ref={setNodeRef}
            style={{ touchAction: "none" }}
            type="button"
            {...attributes}
            {...listeners}
            onClick={
                team === "pool"
                    ? undefined
                    : () => {
                          if (!suppressClickRef.current) {
                              onMove(friend.id, "pool");
                          }
                      }
            }
            title={
                team === "pool"
                    ? "꾹 눌러 드래그하여 팀에 배치"
                    : "클릭하면 대기 선수로 복귀"
            }
        >
            {friend.name}
        </button>
    );
}

function TeamDropZone({ label, team, friends, onMove, suppressClickRef }) {
    const { isOver, setNodeRef } = useDroppable({ id: team });

    return (
        <div
            className={`min-h-28 rounded-2xl border p-3 transition ${teamStyles[team]} ${isOver ? "ring-2 ring-white/60" : ""}`}
            ref={setNodeRef}
        >
            <div className="mb-2 flex items-center justify-between gap-2">
                <strong className="text-sm font-black">{label}</strong>
                {team !== "pool" ? (
                    <span className="text-xs font-bold">
                        {friends.length}명
                    </span>
                ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
                {friends.map((friend) => (
                    <PlayerChip
                        friend={friend}
                        key={friend.id}
                        team={team}
                        onMove={onMove}
                        suppressClickRef={suppressClickRef}
                    />
                ))}
                {!friends.length ? (
                    <span className="text-xs font-semibold opacity-60">
                        여기에 놓으세요
                    </span>
                ) : null}
            </div>
        </div>
    );
}

function InhouseTeamPicker({ friends, sessionDraft, onMove }) {
    const [activeId, setActiveId] = useState(null);
    const suppressClickRef = useRef(false);
    const sensors = useSensors(
        useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
        useSensor(TouchSensor, {
            activationConstraint: { delay: 150, tolerance: 5 },
        }),
    );
    const teamAIds = new Set(sessionDraft.teamAIds);
    const teamBIds = new Set(sessionDraft.teamBIds);
    const teamA = friends.filter((friend) => teamAIds.has(friend.id));
    const teamB = friends.filter((friend) => teamBIds.has(friend.id));
    const pool = friends.filter(
        (friend) => !teamAIds.has(friend.id) && !teamBIds.has(friend.id),
    );
    const activeFriend = friends.find((friend) => friend.id === activeId);

    return (
        <div className="grid gap-3">
            <p className="text-sm font-black text-slate-300">선수 입장</p>
            <DndContext
                sensors={sensors}
                onDragCancel={() => {
                    setActiveId(null);
                    window.setTimeout(() => {
                        suppressClickRef.current = false;
                    });
                }}
                onDragEnd={({ active, over }) => {
                    setActiveId(null);
                    if (over) onMove(String(active.id), String(over.id));
                    window.setTimeout(() => {
                        suppressClickRef.current = false;
                    });
                }}
                onDragStart={({ active }) => {
                    suppressClickRef.current = true;
                    setActiveId(String(active.id));
                }}
            >
                <div className="grid gap-3">
                    <TeamDropZone
                        friends={pool}
                        label="대기 선수"
                        team="pool"
                        onMove={onMove}
                        suppressClickRef={suppressClickRef}
                    />
                    <div className="grid grid-cols-2 gap-3">
                        <TeamDropZone
                            friends={teamA}
                            label={INHOUSE_TEAM_LABELS[INHOUSE_TEAM.A]}
                            team={INHOUSE_TEAM.A}
                            onMove={onMove}
                            suppressClickRef={suppressClickRef}
                        />
                        <TeamDropZone
                            friends={teamB}
                            label={INHOUSE_TEAM_LABELS[INHOUSE_TEAM.B]}
                            team={INHOUSE_TEAM.B}
                            onMove={onMove}
                            suppressClickRef={suppressClickRef}
                        />
                    </div>
                </div>
                <DragOverlay dropAnimation={null}>
                    {activeFriend ? (
                        <span className="inline-flex rounded-full border border-white/40 bg-[#111722] px-3 py-2 text-sm font-extrabold text-slate-100 shadow-xl">
                            {activeFriend.name}
                        </span>
                    ) : null}
                </DragOverlay>
            </DndContext>
        </div>
    );
}

export function SessionComposer({
    friends,
    sessionDraft,
    isSubmitting,
    onDraftChange,
    onSubmit,
    onToggleFriend,
    onMoveInhouseFriend,
}) {
    return (
        <Panel>
            <CardHeader
                className="mb-4"
                right={
                    <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-black text-slate-300">
                        내전
                        <input
                            checked={sessionDraft.isInhouse}
                            className="peer sr-only"
                            type="checkbox"
                            onChange={(event) =>
                                onDraftChange({
                                    ...sessionDraft,
                                    isInhouse: event.target.checked,
                                    friendIds: [],
                                    teamAIds: [],
                                    teamBIds: [],
                                })
                            }
                        />
                        <span className="relative h-6 w-11 rounded-full bg-slate-600 transition peer-checked:bg-orange-400 after:absolute after:left-1 after:top-1 after:size-4 after:rounded-full after:bg-white after:transition peer-checked:after:translate-x-5" />
                    </label>
                }
                title="세션 생성"
            />
            <form className="grid gap-3" onSubmit={onSubmit}>
                <label className="grid gap-1.5 text-sm font-extrabold text-slate-300">
                    세션 제목
                    <TextInput
                        value={sessionDraft.title}
                        onChange={(event) =>
                            onDraftChange({
                                ...sessionDraft,
                                title: event.target.value,
                            })
                        }
                        placeholder="제목 입력"
                    />
                </label>
                <label className="grid gap-1.5 text-sm font-extrabold text-slate-300">
                    판당 금액
                    <TextInput
                        type="number"
                        min="0"
                        step="1000"
                        value={sessionDraft.price}
                        onChange={(event) =>
                            onDraftChange({
                                ...sessionDraft,
                                price: event.target.value,
                            })
                        }
                    />
                </label>
                {sessionDraft.isInhouse ? (
                    <InhouseTeamPicker
                        friends={friends}
                        sessionDraft={sessionDraft}
                        onMove={onMoveInhouseFriend}
                    />
                ) : (
                    <>
                        <p className="text-sm font-black text-slate-300">
                            선수 입장
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {friends.map((friend) => {
                                const isActive =
                                    sessionDraft.friendIds.includes(friend.id);
                                return (
                                    <button
                                        className={`rounded-full border px-3 py-2 text-sm font-extrabold transition ${isActive ? "border-cyan-400 bg-cyan-400/15 text-cyan-100" : "border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/20"}`}
                                        key={friend.id}
                                        type="button"
                                        onClick={() =>
                                            onToggleFriend(friend.id)
                                        }
                                    >
                                        {friend.name}
                                    </button>
                                );
                            })}
                            {!friends.length ? (
                                <p className="text-sm font-semibold text-slate-400">
                                    마 프로게이머부터 등록해라
                                </p>
                            ) : null}
                        </div>
                    </>
                )}
                <Button
                    aria-label={isSubmitting ? "세션 생성 중" : "세션 만들기"}
                    className="w-full disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={isSubmitting}
                    title={isSubmitting ? "세션 생성 중" : "세션 만들기"}
                    type="submit"
                >
                    {isSubmitting ? <LoadingIcon /> : <PlusIcon />}
                </Button>
            </form>
        </Panel>
    );
}
