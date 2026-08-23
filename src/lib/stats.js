import { getGameSettlement } from "./utils";
import {
    getOpponentInhouseTeam,
    INHOUSE_TEAM_LABELS,
    INHOUSE_TEAMS,
} from "../constants";

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

    const getWinLeaders = () => {
        if (!playedStats.length) {
            return [emptyLeader];
        }

        const highestWinRate = Math.max(
            ...playedStats.map((row) => row.winRate),
        );
        const highestWinRateRows = playedStats.filter(
            (row) => row.winRate === highestWinRate,
        );
        const maxWins = Math.max(
            ...highestWinRateRows.map((row) => row.wins - row.losses),
        );

        return highestWinRateRows.filter(
            (row) => row.wins - row.losses === maxWins,
        );
    };

    const getLossLeaders = () => {
        if (!playedStats.length) {
            return [emptyLeader];
        }

        const lowestWinRate = Math.min(
            ...playedStats.map((row) => row.winRate),
        );
        const lowestWinRateRows = playedStats.filter(
            (row) => row.winRate === lowestWinRate,
        );
        const maxLosses = Math.max(
            ...lowestWinRateRows.map((row) => row.losses - row.wins),
        );

        return lowestWinRateRows.filter(
            (row) => row.losses - row.wins === maxLosses,
        );
    };

    const formatNames = (leaders) => leaders.map((leader) => leader.name);
    const firstLeader = (leaders) => leaders[0] ?? emptyLeader;

    const winsLeaders = getWinLeaders();
    const receivedLeaders = getLeaders((row) => row.received - row.paid);
    const lossesLeaders = getLossLeaders();
    const paidLeaders = getLeaders((row) => row.paid - row.received);

    const winsLeader = firstLeader(winsLeaders);
    const receivedLeader = firstLeader(receivedLeaders);
    const lossesLeader = firstLeader(lossesLeaders);
    const paidLeader = firstLeader(paidLeaders);

    return [
        {
            label: "최다 승률",
            value: formatNames(winsLeaders),
            metricFormat: "rate",
            metricValue: winsLeader.winRate,
            textColor: "text-sky-500",
            bgColor: "bg-sky-400/20",
            borderColor: "border-sky-400/10",
        },
        {
            label: `수금왕`,
            value: formatNames(receivedLeaders),
            metricFormat: "money",
            metricValue: receivedLeader.net,
            textColor: "text-emerald-500",
            bgColor: "bg-emerald-400/20",
            borderColor: "border-emerald-400/10",
        },
        {
            label: "최저 승률",
            value: formatNames(lossesLeaders),
            metricFormat: "rate",
            metricValue: lossesLeader.winRate,
            textColor: "text-purple-500",
            bgColor: "bg-purple-400/20",
            borderColor: "border-purple-400/10",
        },
        {
            label: "기부천사",
            mean: "최다 지불",
            value: formatNames(paidLeaders),
            metricFormat: "money",
            metricValue: paidLeader.net,
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

    if (session.isInhouse) {
        const teamRows = INHOUSE_TEAMS.map((team) => ({
            id: `team-${team}`,
            name: INHOUSE_TEAM_LABELS[team],
            team,
            wins: 0,
            losses: 0,
            paid: 0,
            received: 0,
        }));
        const teamMap = new Map(teamRows.map((row) => [row.team, row]));

        games.forEach((game) => {
            if (!INHOUSE_TEAMS.includes(game.winnerTeam)) {
                return;
            }

            const loserTeam = getOpponentInhouseTeam(game.winnerTeam);
            const settlement = getGameSettlement(game, session);
            const winners = teamMap.get(game.winnerTeam);
            const losers = teamMap.get(loserTeam);

            winners.wins += 1;
            winners.received +=
                settlement.receiverAmount * game.winnerIds.length;
            losers.losses += 1;
            losers.paid += settlement.payerAmount * game.loserIds.length;
        });

        return teamRows.map((row) => ({
            ...row,
            net: row.received - row.paid,
        }));
    }

    const rows = participants.map((friend) => ({
        ...friend,
        wins: 0,
        losses: 0,
        paid: 0,
        received: 0,
        net: 0,
    }));
    const rowMap = new Map(rows.map((row) => [row.id, row]));

    games.forEach((game) => {
        const settlement = getGameSettlement(game, session);

        game.loserIds.forEach((friendId) => {
            if (rowMap.has(friendId)) {
                const row = rowMap.get(friendId);
                row.losses += 1;
                row.paid += settlement.payerAmount;
            }
        });
        game.winnerIds.forEach((friendId) => {
            if (rowMap.has(friendId)) {
                const row = rowMap.get(friendId);
                row.wins += 1;
                row.received += settlement.receiverAmount;
            }
        });
    });

    return rows
        .map((row) => ({
            ...row,
            net: row.received - row.paid,
        }))
        .sort((a, b) => b.net - a.net || a.name.localeCompare(b.name, "ko"));
}
