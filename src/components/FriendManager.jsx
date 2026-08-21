import { Button, DangerButton, Panel, TextInput } from "./ui";

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
                <Button className="px-3 py-2" type="submit">
                    추가
                </Button>
            </form>
            <div className="grid gap-1.5 overflow-y-auto pr-1 flex-[1_0_0] min-h-50">
                {friends.map((friend) => (
                    <div
                        className="flex items-center justify-between gap-2 rounded-xl bg-white/[0.04] px-3 py-2"
                        key={friend.id}
                    >
                        <span className="truncate text-sm font-extrabold text-slate-200">
                            {friend.name}
                        </span>
                        <DangerButton
                            className="rounded-lg px-2.5 py-1.5 text-xs"
                            type="button"
                            onClick={() => onRemoveFriend(friend.id)}
                        >
                            삭제
                        </DangerButton>
                    </div>
                ))}
            </div>
        </Panel>
    );
}
