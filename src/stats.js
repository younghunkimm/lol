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
        winRate: 0,
    };

    const getLeaders = (getScore, rows = stats) => {
        if (!rows.length) {
            return [emptyLeader];
        }

        const bestScore = Math.max(...rows.map(getScore));
        return rows.filter((row) => getScore(row) === bestScore);
    };

    const formatNames = (leaders) => leaders.map((leader) => leader.name);
    const firstLeader = (leaders) => leaders[0] ?? emptyLeader;

    const playedStats = stats.filter((row) => row.wins + row.losses > 0);
    const hasPlayedGames = playedStats.length > 0;
    const winsLeaders = hasPlayedGames
        ? getLeaders((row) => row.wins - row.losses, playedStats)
        : [emptyLeader];
    const receivedLeaders = hasPlayedGames
        ? getLeaders((row) => row.received - row.paid)
        : [emptyLeader];
    const lossesLeaders = getLeaders((row) => -row.winRate, playedStats);
    const paidLeaders = hasPlayedGames
        ? getLeaders((row) => row.paid - row.received)
        : [emptyLeader];
    const winsLeader = firstLeader(winsLeaders);
    const receivedLeader = firstLeader(receivedLeaders);
    const lossesLeader = firstLeader(lossesLeaders);
    const paidLeader = firstLeader(paidLeaders);

    return [
        {
            label: "개고수",
            mean: "최다 승리",
            value: formatNames(winsLeaders),
            metric: `${winsLeader.winRate}%`,
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
            metric: `${lossesLeader.winRate}%`,
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
