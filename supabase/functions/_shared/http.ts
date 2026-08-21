export function createCorsHeaders(methods: string[]) {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": methods.join(", "),
  };
}

export function jsonResponse(body: unknown, status = 200, headers?: HeadersInit) {
  return Response.json(body, {
    status,
    headers,
  });
}

export function optionsResponse(headers: HeadersInit) {
  return new Response(null, { status: 204, headers });
}
