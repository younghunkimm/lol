import "@supabase/functions-js/edge-runtime.d.ts";
import {
  createCorsHeaders,
  jsonResponse,
  optionsResponse,
} from "../_shared/http.ts";

const corsHeaders = createCorsHeaders(["POST", "OPTIONS"]);

type PasswordGrantResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_at?: number;
  expires_in?: number;
  token_type?: string;
  user?: unknown;
  error?: string;
  error_description?: string;
  msg?: string;
};

async function createSupabaseSession() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const publishableKey =
    Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY");
  const email = Deno.env.get("APP_AUTH_EMAIL");
  const password = Deno.env.get("APP_AUTH_PASSWORD");

  if (!supabaseUrl || !publishableKey || !email || !password) {
    throw new Error("Supabase Auth 세션 발급 설정이 누락되었습니다.");
  }

  const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: publishableKey,
    },
    body: JSON.stringify({
      email,
      password,
    }),
  });

  const body = (await response.json().catch(() => ({}))) as PasswordGrantResponse;

  if (!response.ok || !body.access_token || !body.refresh_token) {
    throw new Error(
      body.error_description ??
        body.msg ??
        body.error ??
        "Supabase Auth 세션 발급에 실패했습니다.",
    );
  }

  return {
    accessToken: body.access_token,
    refreshToken: body.refresh_token,
    expiresAt: body.expires_at,
    expiresIn: body.expires_in,
    tokenType: body.token_type ?? "bearer",
    user: body.user,
  };
}

export default {
  async fetch(req: Request) {
    if (req.method === "OPTIONS") {
      return optionsResponse(corsHeaders);
    }

    if (req.method !== "POST") {
      return jsonResponse({ error: "허용되지 않는 방법" }, 405, corsHeaders);
    }

    const appPassword = Deno.env.get("PASSWORD");

    if (!appPassword) {
      return jsonResponse({ error: "인증 비밀번호가 구성되지 않았습니다." }, 500, corsHeaders);
    }

    let body: { password?: string };
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ error: "잘못된 JSON 본문" }, 400, corsHeaders);
    }

    if (body.password !== appPassword) {
      return jsonResponse({ error: "비밀번호 검증 실패" }, 401, corsHeaders);
    }

    try {
      return jsonResponse(await createSupabaseSession(), 200, corsHeaders);
    } catch (error) {
      return jsonResponse(
        { error: error instanceof Error ? error.message : "인증 세션 발급 실패" },
        500,
        corsHeaders,
      );
    }
  },
};
