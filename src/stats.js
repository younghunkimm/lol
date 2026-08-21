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
            if (rowMap.has(friendId))
                rowMap.get(friendId).paid += settlement.payerAmount;
        });
        game.winnerIds.forEach((friendId) => {
            if (rowMap.has(friendId))
                rowMap.get(friendId).received += settlement.receiverAmount;
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
    const getFirstName = (name) => (name.length > 1 ? name.slice(1) : name);
    const emptyLeader = {
        name: "-",
        wins: 0,
        losses: 0,
        paid: 0,
        received: 0,
        net: 0,
    };

    const getLeaders = (getScore) => {
        if (!stats.length) {
            return [emptyLeader];
        }

        const bestScore = Math.max(...stats.map(getScore));
        return stats.filter((row) => getScore(row) === bestScore);
    };

    const formatNames = (leaders) => leaders.map((leader) => leader.name);
    const firstLeader = (leaders) => leaders[0] ?? emptyLeader;

    const winsLeaders = getLeaders((row) => row.wins - row.losses);
    const receivedLeaders = getLeaders((row) => row.received - row.paid);
    const lossesLeaders = getLeaders((row) => row.losses - row.wins);
    const paidLeaders = getLeaders((row) => row.paid - row.received);
    const winsLeader = firstLeader(winsLeaders);
    const receivedLeader = firstLeader(receivedLeaders);
    const lossesLeader = firstLeader(lossesLeaders);
    const paidLeader = firstLeader(paidLeaders);

    return [
        {
            label: "개고수",
            mean: "최다 승리",
            value: formatNames(winsLeaders),
            metric: `${winsLeader.wins - winsLeader.losses}승`,
            positive: true,
        },
        {
            label: `외쳐 갓${getFirstName(receivedLeader.name)}`,
            mean: "최다 수령",
            value: formatNames(receivedLeaders),
            metric: formatMoney(receivedLeader.net),
            positive: true,
        },
        {
            label: "병슨ㅋ",
            mean: "최다 패배",
            value: formatNames(lossesLeaders),
            metric: `${lossesLeader.losses - lossesLeader.wins}패`,
            positive: false,
        },
        {
            label: "기부천사",
            mean: "최다 지불",
            value: formatNames(paidLeaders),
            metric: formatMoney(paidLeader.paid - paidLeader.received),
            positive: false,
        },
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
