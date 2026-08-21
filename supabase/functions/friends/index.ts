import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "@supabase/supabase-js";
import {
  createCorsHeaders,
  jsonResponse,
  optionsResponse,
} from "../_shared/http.ts";
import { verifyJwt } from "../_shared/jwt.ts";

const corsHeaders = createCorsHeaders([
  "GET",
  "POST",
  "DELETE",
  "OPTIONS",
]);

type Resource = "friends" | "sessions" | "games";

type Friend = {
  id: string;
  name: string;
  createdAt: string;
};

type FriendRow = {
  id: string;
  name: string;
  created_at: string;
};

type Session = {
  id: string;
  title: string;
  price: number;
  friendIds: string[];
  createdAt: string;
};

type SessionRow = {
  id: string;
  title: string;
  price: number;
  friend_ids: string[];
  created_at: string;
};

type Game = {
  id: string;
  sessionId: string;
  winnerIds: string[];
  loserIds: string[];
  note: string;
  createdAt: string;
};

type GameRow = {
  id: string;
  session_id: string;
  winner_ids: string[];
  loser_ids: string[];
  note: string | null;
  created_at: string;
};

function fromFriendRow(row: FriendRow): Friend {
  return {
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
  };
}

function toFriendRow(friend: Friend) {
  return {
    id: friend.id,
    name: friend.name,
    created_at: friend.createdAt,
  };
}

function fromSessionRow(row: SessionRow): Session {
  return {
    id: row.id,
    title: row.title,
    price: row.price,
    friendIds: row.friend_ids ?? [],
    createdAt: row.created_at,
  };
}

function toSessionRow(session: Session) {
  return {
    id: session.id,
    title: session.title,
    price: session.price,
    friend_ids: session.friendIds,
    created_at: session.createdAt,
  };
}

function fromGameRow(row: GameRow): Game {
  return {
    id: row.id,
    sessionId: row.session_id,
    winnerIds: row.winner_ids ?? [],
    loserIds: row.loser_ids ?? [],
    note: row.note ?? "",
    createdAt: row.created_at,
  };
}

function toGameRow(game: Game) {
  return {
    id: game.id,
    session_id: game.sessionId,
    winner_ids: game.winnerIds,
    loser_ids: game.loserIds,
    note: game.note,
    created_at: game.createdAt,
  };
}

function createAdminClient() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase admin secrets are not configured");
  }

  return createClient(supabaseUrl, serviceRoleKey);
}

function getResource(req: Request): Resource | null {
  const resource = new URL(req.url).searchParams.get("resource");

  if (!resource) {
    return null;
  }

  if (resource === "friends" || resource === "sessions" || resource === "games") {
    return resource;
  }

  return null;
}

async function readJsonBody<T>(req: Request) {
  try {
    return (await req.json()) as T;
  } catch {
    throw new Error("잘못된 JSON 본문");
  }
}

function getDeleteId(req: Request) {
  return new URL(req.url).searchParams.get("id");
}

export default {
  async fetch(req: Request) {
    if (req.method === "OPTIONS") {
      return optionsResponse(corsHeaders);
    }

    const auth = await verifyJwt(req);
    if (!auth.ok) {
      return jsonResponse({ error: auth.error }, auth.status, corsHeaders);
    }

    let supabase;
    try {
      supabase = createAdminClient();
    } catch (error) {
      return jsonResponse(
        { error: error instanceof Error ? error.message : "Server error" },
        500,
        corsHeaders,
      );
    }

    if (req.method === "GET") {
      const [friendsResult, sessionsResult, gamesResult] = await Promise.all([
        supabase
          .from("friends")
          .select("*")
          .order("created_at", { ascending: true }),
        supabase
          .from("sessions")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase
          .from("games")
          .select("*")
          .order("created_at", { ascending: true }),
      ]);

      if (friendsResult.error) {
        return jsonResponse({ error: friendsResult.error.message }, 500, corsHeaders);
      }

      if (sessionsResult.error) {
        return jsonResponse({ error: sessionsResult.error.message }, 500, corsHeaders);
      }

      if (gamesResult.error) {
        return jsonResponse({ error: gamesResult.error.message }, 500, corsHeaders);
      }

      return jsonResponse(
        {
          friends: (friendsResult.data ?? []).map(fromFriendRow),
          sessions: (sessionsResult.data ?? []).map(fromSessionRow),
          games: (gamesResult.data ?? []).map(fromGameRow),
        },
        200,
        corsHeaders,
      );
    }

    if (req.method === "POST") {
      const resource = getResource(req);

      if (!resource) {
        return jsonResponse({ error: "resource is required" }, 400, corsHeaders);
      }

      try {
        if (resource === "friends") {
          const body = await readJsonBody<Friend>(req);

          if (!body.id || !body.name) {
            return jsonResponse({ error: "아이디와 이름은 필수입니다1" }, 400, corsHeaders);
          }

          const { data, error } = await supabase
            .from("friends")
            .insert(toFriendRow(body))
            .select("*")
            .single();

          if (error) {
            return jsonResponse({ error: error.message }, 400, corsHeaders);
          }

          return jsonResponse({ friend: fromFriendRow(data) }, 201, corsHeaders);
        }

        if (resource === "sessions") {
          const body = await readJsonBody<Session>(req);

          if (!body.id || !body.title || !Array.isArray(body.friendIds)) {
            return jsonResponse({ error: "세션 정보가 올바르지 않습니다" }, 400, corsHeaders);
          }

          const { data, error } = await supabase
            .from("sessions")
            .insert(toSessionRow(body))
            .select("*")
            .single();

          if (error) {
            return jsonResponse({ error: error.message }, 400, corsHeaders);
          }

          return jsonResponse({ session: fromSessionRow(data) }, 201, corsHeaders);
        }

        const body = await readJsonBody<Game>(req);

        if (
          !body.id ||
          !body.sessionId ||
          !Array.isArray(body.winnerIds) ||
          !Array.isArray(body.loserIds)
        ) {
          return jsonResponse({ error: "승패 기록이 올바르지 않습니다" }, 400, corsHeaders);
        }

        const { data, error } = await supabase
          .from("games")
          .insert(toGameRow(body))
          .select("*")
          .single();

        if (error) {
          return jsonResponse({ error: error.message }, 400, corsHeaders);
        }

        return jsonResponse({ game: fromGameRow(data) }, 201, corsHeaders);
      } catch (error) {
        return jsonResponse(
          { error: error instanceof Error ? error.message : "잘못된 요청" },
          400,
          corsHeaders,
        );
      }
    }

    if (req.method === "DELETE") {
      const resource = getResource(req);
      const id = getDeleteId(req);

      if (!resource) {
        return jsonResponse({ error: "resource is required" }, 400, corsHeaders);
      }

      if (!id) {
        return jsonResponse({ error: "id is required" }, 400, corsHeaders);
      }

      const table = resource;
      const { error } = await supabase.from(table).delete().eq("id", id);

      if (error) {
        return jsonResponse({ error: error.message }, 400, corsHeaders);
      }

      return jsonResponse({ id }, 200, corsHeaders);
    }

    return jsonResponse({ error: "Method not allowed" }, 405, corsHeaders);
  },
};
