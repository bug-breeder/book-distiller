// Keyless CORS pass-through. Holds NO secret. Forwards the visitor's own
// Authorization header + body to the provider URL given in the X-Target header.
// Used only when a provider blocks browser-origin (CORS) calls.

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Target',
};

interface Ctx { request: Request; }

export async function onRequestOptions(): Promise<Response> {
  return new Response(null, { headers: CORS });
}

export async function onRequestPost({ request }: Ctx): Promise<Response> {
  const target = request.headers.get('X-Target');
  if (!target || !/^https:\/\//.test(target)) {
    return new Response(JSON.stringify({ error: 'Missing or invalid X-Target' }), {
      status: 400,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }
  const auth = request.headers.get('Authorization') ?? '';
  const upstream = await fetch(target, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: auth },
    body: await request.text(),
  });
  const headers = new Headers(upstream.headers);
  for (const [k, v] of Object.entries(CORS)) headers.set(k, v);
  return new Response(upstream.body, { status: upstream.status, headers });
}
