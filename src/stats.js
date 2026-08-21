import { formatMoney, getGameSettlement } from "./utils";

export function createStats({ friends, games, sessions }) {
    const rows = friends.map((friend) => ({
        id: friend.id,
        name: friend.name,
        wins: 0,
        losses: 0,
        paid: 0,
        received: 0,
    }));
    const rowMap = new Map(rows.map((row) => [row.id, row]));

    games.forEach((game) => {
        game.winnerIds.forEach((friendId) => {
            if (rowMap.has(friendId)) rowMap.get(friendId).wins += 1;
        });
        game.loserIds.forEach((friendId) => {
            if (rowMap.has(friendId)) rowMap.get(friendId).losses += 1;
        });
    });

    games.forEach((game) => {
        const session = sessions.find((item) => item.id === game.sessionId);
        const settlement = getGameSettlement(game, session);

        game.loserIds.forEach((friendId) => {
            if (rowMap.has(friendId)) rowMap.get(friendId).paid += settlement.payerAmount;
        });
        game.winnerIds.forEach((friendId) => {
            if (rowMap.has(friendId)) rowMap.get(friendId).received += settlement.receiverAmount;
        });
    });

    return rows.map((row) => {
        const totalGames = row.wins + row.losses;
        return {
            ...row,
            net: row.received - row.paid,
            winRate: totalGames ? Math.round((row.wins / totalGames) * 100) : 0,
        };
    });
}

export function createLeaders(stats) {
    const getLeader = (key) =>
        stats.reduce((leader, row) => (row[key] > leader[key] ? row : leader), {
            name: "-",
            wins: 0,
            losses: 0,
            paid: 0,
            received: 0,
        });

    return [
        { label: "최다 승자", value: getLeader("wins").name, metric: `${getLeader("wins").wins}승` },
        {
            label: "최다 수령자",
            value: getLeader("received").name,
            metric: formatMoney(getLeader("received").received),
        },
        { label: "최다 패자", value: getLeader("losses").name, metric: `${getLeader("losses").losses}패` },
        { label: "최다 지불자", value: getLeader("paid").name, metric: formatMoney(getLeader("paid").paid) },
    ];
}

export function createSessionSettlements({ participants, games, session }) {
    if (!session) {
        return [];
    }

    const rows = participants.map((friend) => ({
        ...friend,
        paid: 0,
        received: 0,
        net: 0,
    }));
    const rowMap = new Map(rows.map((row) => [row.id, row]));

    games.forEach((game) => {
        const settlement = getGameSettlement(game, session);

        game.loserIds.forEach((friendId) => {
            if (rowMap.has(friendId)) {
                rowMap.get(friendId).paid += settlement.payerAmount;
            }
        });
        game.winnerIds.forEach((friendId) => {
            if (rowMap.has(friendId)) {
                rowMap.get(friendId).received += settlement.receiverAmount;
            }
        });
    });

    return rows.map((row) => ({
        ...row,
        net: row.received - row.paid,
    }));
}

