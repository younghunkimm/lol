import { Button, CardHeader, Panel, TextInput } from "../shared/ui";
import { LoadingIcon, PlusIcon } from "../shared/ActionIcons";

export function SessionComposer({
    friends,
    sessionDraft,
    isSubmitting,
    onDraftChange,
    onSubmit,
    onToggleFriend,
}) {
    return (
        <Panel>
            <CardHeader className="mb-4" title="세션 생성" />
            <form className="grid gap-3" onSubmit={onSubmit}>
                <label className="grid gap-1.5 text-sm font-extrabold text-slate-300">
                    제목
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
                <p className="text-sm font-black text-slate-300">선수 입장</p>
                <div className="flex flex-wrap gap-2">
                    {friends.map((friend) => {
                        const isActive = sessionDraft.friendIds.includes(
                            friend.id,
                        );

                        return (
                            <button
                                className={`rounded-full border px-3 py-2 text-sm font-extrabold transition ${
                                    isActive
                                        ? "border-cyan-400 bg-cyan-400/15 text-cyan-100"
                                        : "border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/20"
                                }`}
                                key={friend.id}
                                type="button"
                                onClick={() => onToggleFriend(friend.id)}
                            >
                                {friend.name}
                            </button>
                        );
                    })}
                    {!friends.length && (
                        <p className="text-sm font-semibold text-slate-400">
                            마 프로게이머부터 등록해라
                        </p>
                    )}
                </div>
                <Button
                    aria-label={isSubmitting ? "세션 생성 중" : "세션 만들기"}
                    className="w-full disabled:cursor-not-allowed disabled:opacity-60"
                    type="submit"
                    disabled={isSubmitting}
                    title={isSubmitting ? "세션 생성 중" : "세션 만들기"}
                >
                    {isSubmitting ? <LoadingIcon /> : <PlusIcon />}
                </Button>
            </form>
        </Panel>
    );
}
