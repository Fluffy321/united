import { assertEquals } from 'jsr:@std/assert@1';
import { handlePublishingRequest } from './publishing.ts';

type RpcCall = { name: string; args: Record<string, unknown> };

function request(body: unknown, token = 'user-token') {
  return new Request('http://localhost/functions/v1/publish-content', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
}

function dependencies(result: unknown = { contentId: 'post-1' }) {
  const calls: RpcCall[] = [];
  return {
    calls,
    deps: {
      createUserClient: (_authorization: string) => ({
        rpc: async (name: string, args: Record<string, unknown>) => {
          calls.push({ name, args });
          return { data: result, error: null };
        },
      }),
    },
  };
}

Deno.test('publishing endpoint rejects a missing bearer token', async () => {
  const { deps } = dependencies();
  const response = await handlePublishingRequest(request({ operation: 'publish', payload: {} }, ''), deps);

  assertEquals(response.status, 401);
  assertEquals(await response.json(), { code: 'UNAUTHENTICATED', message: 'Sign in to publish.' });
});

Deno.test('publishing endpoint rejects an unsupported operation', async () => {
  const { deps } = dependencies();
  const response = await handlePublishingRequest(request({ operation: 'deleteEverything' }), deps);

  assertEquals(response.status, 400);
  assertEquals((await response.json()).code, 'INVALID_COMMAND');
});

Deno.test('publish forwards one command and never supplies a caller identity', async () => {
  const { deps, calls } = dependencies();
  const payload = { submissionKey: 'key-1', publishingType: 'local_news' };
  const response = await handlePublishingRequest(request({ operation: 'publish', payload }), deps);

  assertEquals(response.status, 200);
  assertEquals(calls, [{ name: 'publish_content', args: { p_command: payload } }]);
  assertEquals('authorId' in calls[0].args, false);
});

Deno.test('update, end, and listMine call only their owner-scoped RPCs', async () => {
  const { deps, calls } = dependencies([]);

  await handlePublishingRequest(request({ operation: 'update', payload: { contentId: '00000000-0000-0000-0000-000000000001', command: { headline: 'Updated' } } }), deps);
  await handlePublishingRequest(request({ operation: 'end', payload: { contentId: '00000000-0000-0000-0000-000000000001' } }), deps);
  await handlePublishingRequest(request({ operation: 'listMine', payload: { cursor: null } }), deps);

  assertEquals(calls.map((call) => call.name), ['update_published_content', 'end_published_content', 'list_my_publishing']);
});

Deno.test('database errors become stable public error codes without SQL details', async () => {
  const deps = {
    createUserClient: () => ({
      rpc: async () => ({ data: null, error: { message: 'duplicate key internal_table_idx', code: '23505' } }),
    }),
  };
  const response = await handlePublishingRequest(request({ operation: 'publish', payload: { submissionKey: 'key-1' } }), deps);
  const body = await response.json();

  assertEquals(response.status, 409);
  assertEquals(body, { code: 'PUBLISH_FAILED', message: 'That post was already handled. Refresh My posts.' });
});
