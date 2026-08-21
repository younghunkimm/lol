export type VerifyJwtResult =
  | { ok: true }
  | { ok: false; status: number; error: string };

function base64UrlEncode(input: ArrayBuffer | Uint8Array | string) {
  const bytes =
    typeof input === "string" ? new TextEncoder().encode(input) : new Uint8Array(input);
  let binary = "";

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlDecode(input: string) {
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new TextDecoder().decode(bytes);
}

async function createSignature(data: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));

  return base64UrlEncode(signature);
}

function timingSafeEqual(left: string, right: string) {
  if (left.length !== right.length) {
    return false;
  }

  let result = 0;
  for (let index = 0; index < left.length; index += 1) {
    result |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }

  return result === 0;
}

export async function signJwt(payload: Record<string, unknown>, secret: string) {
  const header = { alg: "HS256", typ: "JWT" };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const data = `${encodedHeader}.${encodedPayload}`;
  const signature = await createSignature(data, secret);

  return `${data}.${signature}`;
}

export async function verifyJwt(req: Request): Promise<VerifyJwtResult> {
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  const jwtSecret = Deno.env.get("JWT_SECRET") ?? Deno.env.get("PASSWORD");

  if (!jwtSecret) {
    return { ok: false, status: 500, error: "JWT 비밀번호가 구성되지 않았습니다." };
  }

  const [encodedHeader, encodedPayload, signature] = token.split(".");
  if (!encodedHeader || !encodedPayload || !signature) {
    return { ok: false, status: 401, error: "누락되거나 잘못된 토큰" };
  }

  let payload: { exp?: number };
  try {
    const expectedSignature = await createSignature(
      `${encodedHeader}.${encodedPayload}`,
      jwtSecret,
    );
    if (!timingSafeEqual(signature, expectedSignature)) {
      return { ok: false, status: 401, error: "잘못된 토큰 서명" };
    }

    payload = JSON.parse(base64UrlDecode(encodedPayload));
  } catch {
    return { ok: false, status: 401, error: "잘못된 토큰" };
  }

  const now = Math.floor(Date.now() / 1000);
  if (!payload.exp || payload.exp <= now) {
    return { ok: false, status: 401, error: "토큰이 만료되었습니다." };
  }

  return { ok: true };
}
