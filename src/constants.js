export const STORAGE_KEY = "lol-bet-dashboard";
export const DEFAULT_PRICE = 5000;

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const hasSupabase = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

export const emptyData = {
    friends: [],
    sessions: [],
    games: [],
};

