export type RpcResult = { data: unknown; error: { message?: string; code?: string } | null };
export type UserClient = { rpc: (name: string, args: Record<string, unknown>) => PromiseLike<RpcResult> };
export type PublishingDependencies = { createUserClient: (authorization: string) => UserClient };

const CORS_HEADERS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'authorization, x-client-info, apikey, content-type',
  'access-control-allow-methods': 'POST, OPTIONS',
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...CORS_HEADERS, 'content-type': 'application/json' },
});

function publicDatabaseError(error: { message?: string; code?: string }) {
  if (error.code === '23505') {
    return json({ code: 'PUBLISH_FAILED', message: 'That post was already handled. Refresh My posts.' }, 409);
  }
  const message = String(error.message || '').toLowerCase();
  if (message.includes('rate limit')) {
    return json({ code: 'RATE_LIMITED', message: 'You’re posting too quickly—try again shortly.' }, 429);
  }
  if (message.includes('not a member') || message.includes('join that community')) {
    return json({ code: 'NOT_A_MEMBER', message: 'Join that community before posting there.' }, 403);
  }
  if (error.code === '42501') {
    return json({ code: 'UNAUTHENTICATED', message: 'Sign in to publish.' }, 401);
  }
  return json({ code: 'PUBLISH_FAILED', message: 'We couldn’t publish that. Your draft is still here.' }, 400);
}

function bearerAuthorization(request: Request) {
  const value = request.headers.get('authorization')?.trim() || '';
  return /^Bearer\s+\S+$/i.test(value) ? value : null;
}

export async function handlePublishingRequest(request: Request, deps: PublishingDependencies) {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS });
  if (request.method !== 'POST') return json({ code: 'INVALID_COMMAND', message: 'Use POST for publishing.' }, 405);

  const authorization = bearerAuthorization(request);
  if (!authorization) return json({ code: 'UNAUTHENTICATED', message: 'Sign in to publish.' }, 401);

  let body: { operation?: string; payload?: Record<string, unknown> };
  try {
    body = await request.json();
  } catch {
    return json({ code: 'INVALID_COMMAND', message: 'Send valid publishing details.' }, 400);
  }

  const payload = body.payload || {};
  let rpcName: string;
  let rpcArgs: Record<string, unknown>;
  switch (body.operation) {
    case 'publish':
      rpcName = 'publish_content';
      rpcArgs = { p_command: payload };
      break;
    case 'update':
      rpcName = 'update_published_content';
      rpcArgs = { p_content_id: payload.contentId, p_patch: payload.command || {} };
      break;
    case 'end':
      rpcName = 'end_published_content';
      rpcArgs = { p_content_id: payload.contentId };
      break;
    case 'listMine':
      rpcName = 'list_my_publishing';
      rpcArgs = { p_limit: 50, p_before: payload.cursor || null };
      break;
    default:
      return json({ code: 'INVALID_COMMAND', message: 'Choose a supported publishing action.' }, 400);
  }

  const client = deps.createUserClient(authorization);
  const { data, error } = await client.rpc(rpcName, rpcArgs);
  if (error) return publicDatabaseError(error);
  return json(data);
}
