import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Shared mutable mock so each test can swap in a fresh query builder.
// Hoisted because vi.mock factories run before test-file statements.
const { mockSupabase } = vi.hoisted(() => ({
  mockSupabase: { from: () => {} },
}));

vi.mock('@/api/supabaseClient', () => ({
  supabase: mockSupabase,
  shouldUseSupabase: true,
  getAuthRedirectUrl: vi.fn(() => 'http://localhost:5173/login'),
}));

const { supabaseBackend, batchFetchByIds } = await import('./supabaseRepository');
const entities = supabaseBackend.entities;

const QUERY_METHODS = [
  'select', 'range', 'order', 'limit', 'eq', 'neq', 'in', 'contains',
  'is', 'or', 'gte', 'lte', 'insert', 'update', 'delete', 'single', 'maybeSingle',
];

// Chainable, awaitable stand-in for a PostgREST query. Every method returns
// the builder; awaiting it resolves to `result` ({ data, error }).
const createQueryBuilder = (result = { data: [], error: null }) => {
  const builder = {};
  QUERY_METHODS.forEach((method) => {
    builder[method] = vi.fn(() => builder);
  });
  builder.then = (onFulfilled, onRejected) =>
    Promise.resolve(result).then(onFulfilled, onRejected);
  return builder;
};

let builder;
const nextQuery = (result) => {
  builder = createQueryBuilder(result);
  mockSupabase.from = vi.fn(() => builder);
  return builder;
};

beforeEach(() => {
  nextQuery();
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('supabaseRepository entity table mapping', () => {
  it('routes a mapped entity to its Supabase table', async () => {
    await entities.Community.list();
    expect(mockSupabase.from).toHaveBeenCalledWith('communities');
    expect(console.warn).not.toHaveBeenCalled();
    expect(console.error).not.toHaveBeenCalled();
  });

  it('warns with the "no SUPABASE_ENTITY_TABLES mapping" message for an unmapped entity in dev', async () => {
    // Unique name so the once-per-entity warning is not swallowed by another test.
    const api = entities.UnmappedDevOnlyTestEntity;
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('Entity "UnmappedDevOnlyTestEntity" has no SUPABASE_ENTITY_TABLES mapping')
    );
    // Dev mode returns the localStorage API so local work is not blocked.
    await expect(api.list()).resolves.toEqual(expect.any(Array));
    expect(mockSupabase.from).not.toHaveBeenCalled();
  });

  it('makes every CRUD method throw for an unmapped entity in production', () => {
    vi.stubEnv('DEV', false);
    const api = entities.UnmappedProdOnlyTestEntity;
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('Entity "UnmappedProdOnlyTestEntity" has no SUPABASE_ENTITY_TABLES mapping')
    );
    const expected = /not mapped to a Supabase table/;
    expect(() => api.list()).toThrow(expected);
    expect(() => api.filter()).toThrow(expected);
    expect(() => api.get('x')).toThrow(expected);
    expect(() => api.create({})).toThrow(expected);
    expect(() => api.update('x', {})).toThrow(expected);
    expect(() => api.delete('x')).toThrow(expected);
    // subscribe stays a safe no-op even in production.
    expect(api.subscribe(() => {})).toBeTypeOf('function');
  });

  it('reads User/Profile entities from public_profiles with a restricted column list', async () => {
    nextQuery({ data: { id: 'u-1', display_name: 'Devorah' }, error: null });
    const user = await entities.User.get('u-1');
    expect(mockSupabase.from).toHaveBeenCalledWith('public_profiles');
    expect(builder.select).toHaveBeenCalledWith(expect.stringContaining('display_name'));
    expect(builder.select).not.toHaveBeenCalledWith('*');
    expect(builder.eq).toHaveBeenCalledWith('id', 'u-1');
    expect(builder.single).toHaveBeenCalledOnce();
    expect(user.id).toBe('u-1');
  });
});

describe('supabaseRepository query building', () => {
  it('list() applies range and a descending order with created_date mapped to created_at', async () => {
    nextQuery({ data: [{ id: 'c-1', created_at: '2026-07-01T00:00:00Z' }], error: null });
    const rows = await entities.Community.list('-created_date', 10, 5);
    expect(mockSupabase.from).toHaveBeenCalledWith('communities');
    expect(builder.select).toHaveBeenCalledWith('*');
    expect(builder.range).toHaveBeenCalledWith(5, 14);
    expect(builder.order).toHaveBeenCalledWith('created_at', { ascending: false });
    // Rows come back normalized to app field names.
    expect(rows[0].created_date).toBe('2026-07-01T00:00:00Z');
  });

  it('list() without a sort does not add an order clause', async () => {
    await entities.Community.list();
    expect(builder.order).not.toHaveBeenCalled();
  });

  it('filter() maps scalars to .eq, arrays to .contains, and applies limit and ascending order', async () => {
    await entities.Community.filter(
      { city: 'Woodmere', tags: ['chesed', 'events'], updated_date: '2026-07-01' },
      'name',
      7
    );
    expect(mockSupabase.from).toHaveBeenCalledWith('communities');
    expect(builder.limit).toHaveBeenCalledWith(7);
    expect(builder.eq).toHaveBeenCalledWith('city', 'Woodmere');
    expect(builder.contains).toHaveBeenCalledWith('tags', ['chesed', 'events']);
    // Filter keys go through the same created_date/updated_date column mapping.
    expect(builder.eq).toHaveBeenCalledWith('updated_at', '2026-07-01');
    expect(builder.order).toHaveBeenCalledWith('name', { ascending: true });
  });
});

describe('supabaseRepository delete(idOrIds)', () => {
  it('routes a single id through one .delete().in() call', async () => {
    const result = await entities.Post.delete('p-1');
    expect(mockSupabase.from).toHaveBeenCalledWith('posts');
    expect(builder.delete).toHaveBeenCalledOnce();
    expect(builder.in).toHaveBeenCalledOnce();
    expect(builder.in).toHaveBeenCalledWith('id', ['p-1']);
    expect(result).toBe(true);
  });

  it('routes an array of ids through one .delete().in() call', async () => {
    const result = await entities.Post.delete(['p-1', 'p-2', 'p-3']);
    expect(builder.delete).toHaveBeenCalledOnce();
    expect(builder.in).toHaveBeenCalledOnce();
    expect(builder.in).toHaveBeenCalledWith('id', ['p-1', 'p-2', 'p-3']);
    expect(result).toBe(true);
  });
});

describe('supabaseRepository local fallback (runWithLocalFallback)', () => {
  it('falls back to local data for dev reads when Supabase reports a permissions error', async () => {
    nextQuery({ data: null, error: { message: 'permission denied for table communities' } });
    const rows = await entities.Community.list();
    expect(rows).toEqual(expect.any(Array));
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('Using local Community data'),
      expect.anything()
    );
  });

  it('does not fall back for reads when the error is not a setup/permissions error', async () => {
    nextQuery({ data: null, error: { message: 'network timeout' } });
    await expect(entities.Community.list()).rejects.toEqual(
      expect.objectContaining({ message: 'network timeout' })
    );
  });

  it('surfaces read errors instead of falling back in production', async () => {
    vi.stubEnv('DEV', false);
    nextQuery({ data: null, error: { message: 'permission denied for table communities' } });
    await expect(entities.Community.list()).rejects.toThrow(/Failed to load Community/);
  });

  it('never falls back for writes, even in dev with a fallback-eligible error', async () => {
    nextQuery({ data: null, error: { message: 'permission denied for table communities' } });
    await expect(entities.Community.create({ name: 'Test Community' }))
      .rejects.toThrow(/Failed to save Community/);
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('Supabase write failed'),
      expect.anything()
    );
  });
});

describe('batchFetchByIds', () => {
  it('returns [] without querying when ids are empty or missing', async () => {
    await expect(batchFetchByIds('Post', [])).resolves.toEqual([]);
    await expect(batchFetchByIds('Post', null)).resolves.toEqual([]);
    expect(mockSupabase.from).not.toHaveBeenCalled();
  });

  it('fetches all ids in a single .in() query', async () => {
    nextQuery({ data: [{ id: 'p-1' }, { id: 'p-2' }], error: null });
    const rows = await batchFetchByIds('Post', ['p-1', 'p-2']);
    expect(mockSupabase.from).toHaveBeenCalledTimes(1);
    expect(mockSupabase.from).toHaveBeenCalledWith('posts');
    expect(builder.in).toHaveBeenCalledWith('id', ['p-1', 'p-2']);
    expect(rows.map((row) => row.id)).toEqual(['p-1', 'p-2']);
  });
});
