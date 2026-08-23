import { createClient } from "@supabase/supabase-js";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "../constants";

export function hasSupabaseConfig() {
    return Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY);
}

export const supabase = hasSupabaseConfig()
    ? createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)
    : null;
