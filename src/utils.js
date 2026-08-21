const formatter = new Intl.NumberFormat("ko-KR");

export function createId() {
    return crypto.randomUUID();
}

export function nowIso() {
    return new Date().toISOString();
}

export function formatSessionTitle(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const period = date.getHours() < 12 ? "오전" : "오후";
    const displayHour = date.getHours() % 12 || 12;
    const hour = String(displayHour).padStart(2, "0");
    const minute = String(date.getMinutes()).padStart(2, "0");

    return `${year}. ${month}. ${day}. ${period} ${hour}:${minute}`;
}

export function formatMoney(amount) {
    return `${formatter.format(Number(amount) || 0)}원`;
}

export function formatSignedMoney(amount) {
    const value = Number(amount) || 0;

    if (value > 0) {
        return `+${formatMoney(value)}`;
    }

    if (value < 0) {
        return `-${formatMoney(Math.abs(value))}`;
    }

    return formatMoney(0);
}

export function getSignedMoneyClass(amount) {
    if (amount > 0) {
        return "text-cyan-300";
    }

    if (amount < 0) {
        return "text-rose-300";
    }

    return "text-slate-400";
}

export function getGameSettlement(game, session) {
    if (!session || !game.winnerIds.length || !game.loserIds.length) {
        return {
            total: 0,
            payerAmount: 0,
            receiverAmount: 0,
        };
    }

    const payerAmount = Number(session.price) || 0;
    const total = payerAmount * game.loserIds.length;
    const receiverAmount = Math.round(total / game.winnerIds.length);

    return { total, payerAmount, receiverAmount };
}

export function getName(friends, friendId) {
    return friends.find((friend) => friend.id === friendId)?.name || "삭제된 친구";
}

export function sortByCreatedAt(items) {
    return [...items].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function getWinRateClass(winRate) {
    if (winRate === 0) {
        return "text-slate-500";
    }

    if (winRate >= 51) {
        return "text-cyan-300";
    }

    if (winRate <= 49) {
        return "text-rose-300";
    }

    return "text-slate-100";
}
