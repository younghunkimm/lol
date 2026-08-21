import "@supabase/functions-js/edge-runtime.d.ts";
import {
  createCorsHeaders,
  jsonResponse,
  optionsResponse,
} from "../_shared/http.ts";
import { signJwt } from "../_shared/jwt.ts";

const corsHeaders = createCorsHeaders(["POST", "OPTIONS"]);

export default {
  async fetch(req: Request) {
    if (req.method === "OPTIONS") {
      return optionsResponse(corsHeaders);
    }

    if (req.method !== "POST") {
      return jsonResponse({ error: "허용되지 않는 방법" }, 405, corsHeaders);
    }

    const password = Deno.env.get("PASSWORD");
    const jwtSecret = Deno.env.get("JWT_SECRET") ?? password;

    if (!password || !jwtSecret) {
      return jsonResponse({ error: "인증 비밀번호가 구성되지 않았습니다." }, 500, corsHeaders);
    }

    let body: { password?: string };
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ error: "잘못된 JSON 본문" }, 400, corsHeaders);
    }

    if (body.password !== password) {
      return jsonResponse({ error: "비밀번호 검증 실패" }, 401, corsHeaders);
    }

    const now = Math.floor(Date.now() / 1000);
    const expiresIn = 60 * 60 * 24 * 7;
    const expiresAt = now + expiresIn;
    const token = await signJwt(
      {
        sub: "shared-password-user",
        role: "app_user",
        iat: now,
        exp: expiresAt,
      },
      jwtSecret,
    );

    return jsonResponse(
      {
        token,
        tokenType: "Bearer",
        expiresAt,
      },
      200,
      corsHeaders,
    );
  },
};
