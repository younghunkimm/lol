export const DEFAULT_PRICE = 5000;
export const SESSION_PAGE_SIZE = 5;
export const AUTH_TOKEN_KEY = "lol-bet-dashboard-auth-token";
export const AUTH_EXPIRES_AT_KEY = "lol-bet-dashboard-auth-expires-at";

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
export const SUPABASE_PUBLISHABLE_KEY = import.meta.env
    .VITE_SUPABASE_PUBLISHABLE_KEY;

export const INHOUSE_TEAM = Object.freeze({
    A: "A",
    B: "B",
});
export const INHOUSE_TEAMS = Object.freeze([
    INHOUSE_TEAM.A,
    INHOUSE_TEAM.B,
]);
export const INHOUSE_TEAM_LABELS = Object.freeze({
    [INHOUSE_TEAM.A]: "A팀",
    [INHOUSE_TEAM.B]: "B팀",
});
export const INHOUSE_TEAM_MEMBER_KEYS = Object.freeze({
    [INHOUSE_TEAM.A]: "teamAIds",
    [INHOUSE_TEAM.B]: "teamBIds",
});

export function getOpponentInhouseTeam(team) {
    return team === INHOUSE_TEAM.A ? INHOUSE_TEAM.B : INHOUSE_TEAM.A;
}

export const emptyData = {
    friends: [],
    sessions: [],
    games: [],
    stats: [],
    hasMoreSessions: false,
    totalSessions: 0,
};
