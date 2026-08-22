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
    const emptyLeader = {
        name: "-",
        wins: 0,
        losses: 0,
        paid: 0,
        received: 0,
        net: 0,
        winRate: 0,
    };

    const playedStats = stats.filter((row) => row.wins + row.losses > 0);
    const hasPlayedGames = playedStats.length > 0;

    const getLeaders = (getScore) => {
        if (!hasPlayedGames) {
            return [emptyLeader];
        }

        const bestScore = Math.max(...playedStats.map(getScore));
        return playedStats.filter((row) => getScore(row) === bestScore);
    };

    const formatNames = (leaders) => leaders.map((leader) => leader.name);
    const firstLeader = (leaders) => leaders[0] ?? emptyLeader;

    const winsLeaders = getLeaders((row) => row.wins);
    const receivedLeaders = getLeaders((row) => row.received - row.paid);
    const lossesLeaders = getLeaders((row) => row.losses);
    const paidLeaders = getLeaders((row) => row.paid - row.received);

    const winsLeader = firstLeader(winsLeaders);
    const receivedLeader = firstLeader(receivedLeaders);
    const lossesLeader = firstLeader(lossesLeaders);
    const paidLeader = firstLeader(paidLeaders);

    return [
        {
            label: "최다 승리",
            value: formatNames(winsLeaders),
            metric: `${winsLeader.wins}승`,
            textColor: "text-sky-500",
            bgColor: "bg-sky-400/20",
            borderColor: "border-sky-400/10",
        },
        {
            label: `수금왕`,
            value: formatNames(receivedLeaders),
            metric: `+${formatMoney(receivedLeader.net)}`,
            textColor: "text-emerald-500",
            bgColor: "bg-emerald-400/20",
            borderColor: "border-emerald-400/10",
        },
        {
            label: "최다 패배",
            value: formatNames(lossesLeaders),
            metric: `${lossesLeader.losses}패`,
            textColor: "text-purple-500",
            bgColor: "bg-purple-400/20",
            borderColor: "border-purple-400/10",
        },
        {
            label: "기부천사",
            mean: "최다 지불",
            value: formatNames(paidLeaders),
            metric: formatMoney(paidLeader.net),
            textColor: "text-amber-500",
            bgColor: "bg-amber-400/20",
            borderColor: "border-amber-400/10",
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
