import { AnimatedList } from "../shared/motion";
import { PlusIcon, TrashIcon } from "../shared/ActionIcons";
import { Button, DangerButton, Panel, TextInput } from "../shared/ui";

export function FriendManager({
    friends,
    friendName,
    onNameChange,
    onSubmit,
    onRemoveFriend,
}) {
    return (
        <Panel className="flex flex-col gap-3 p-3 md:p-4">
            <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-black tracking-tight">
                    프로게이머 등록
                </h2>
                <span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-xs font-black text-slate-300">
                    {friends.length}명
                </span>
            </div>
            <form
                className="grid grid-cols-[minmax(0,1fr)_auto] gap-2"
                onSubmit={onSubmit}
            >
                <TextInput
                    className="py-2"
                    value={friendName}
                    onChange={(event) => onNameChange(event.target.value)}
                    placeholder="이름 입력"
                />
                <Button aria-label="프로게이머 추가" className="px-3 py-2" title="프로게이머 추가" type="submit">
                    <PlusIcon />
                </Button>
            </form>
            <div className="grid min-h-25 flex-[1_0_0] grid-cols-2 gap-1.5 overflow-y-auto pr-1">
                <AnimatedList
                    className="flex min-w-0 items-center justify-between gap-2 rounded-xl bg-white/[0.04] px-3 py-1.5"
                    getKey={(friend) => friend.id}
                    items={friends}
                    renderItem={(friend) => (
                        <>
                            <span className="truncate text-sm font-extrabold text-slate-200">
                                {friend.name}
                            </span>
                            <DangerButton
                                aria-label={`${friend.name} 삭제`}
                                className="!rounded-md !px-2.5 !py-1.5"
                                type="button"
                                onClick={() => onRemoveFriend(friend.id)}
                                title={`${friend.name} 삭제`}
                            >
                                <TrashIcon className="size-4" />
                            </DangerButton>
                        </>
                    )}
                />
            </div>
        </Panel>
    );
}
