import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  fetchDirectoryPhotos,
  requestDirectoryPhoto,
  resetDirectoryPhotoQueueForTests,
} from './directoryPhotoService';

const clientWith = (response) => ({
  functions: { invoke: vi.fn().mockResolvedValue(response) },
});

afterEach(() => {
  resetDirectoryPhotoQueueForTests();
  vi.useRealTimers();
});

describe('directoryPhotoService', () => {
  it('deduplicates IDs and normalizes missing results to empty', async () => {
    const client = clientWith({
      data: { photos: [{
        listingId: 'one',
        status: 'ready',
        imageUrl: 'https://images.example/one.jpg',
        sourceUrl: 'https://maps.google.com/one',
      }] },
      error: null,
    });

    await expect(fetchDirectoryPhotos(['one', 'one', 'two'], { client })).resolves.toEqual({
      one: expect.objectContaining({ listingId: 'one', status: 'ready' }),
      two: { listingId: 'two', status: 'empty' },
    });
    expect(client.functions.invoke).toHaveBeenCalledWith('directory-photos', {
      body: { listingIds: ['one', 'two'] },
    });
  });

  it('splits provider calls into batches of eight', async () => {
    const client = clientWith({ data: { photos: [] }, error: null });
    const ids = Array.from({ length: 9 }, (_, index) => `listing-${index}`);

    await fetchDirectoryPhotos(ids, { client });

    expect(client.functions.invoke.mock.calls.map((call) => call[1].body.listingIds.length)).toEqual([8, 1]);
  });

  it('normalizes invocation errors and malformed records to unavailable', async () => {
    const failedClient = clientWith({ data: null, error: new Error('down') });
    const malformedClient = clientWith({ data: { photos: [{ listingId: 'one', status: 'mystery' }] }, error: null });

    await expect(fetchDirectoryPhotos(['one'], { client: failedClient })).resolves.toEqual({
      one: { listingId: 'one', status: 'unavailable' },
    });
    await expect(fetchDirectoryPhotos(['one'], { client: malformedClient })).resolves.toEqual({
      one: { listingId: 'one', status: 'unavailable' },
    });
  });

  it('coalesces nearby single-photo requests', async () => {
    vi.useFakeTimers();
    const client = clientWith({
      data: {
        photos: [
          { listingId: 'one', status: 'empty' },
          { listingId: 'two', status: 'empty' },
        ],
      },
      error: null,
    });

    const first = requestDirectoryPhoto('one', { client });
    const second = requestDirectoryPhoto('two', { client });
    await vi.advanceTimersByTimeAsync(50);

    await expect(Promise.all([first, second])).resolves.toEqual([
      { listingId: 'one', status: 'empty' },
      { listingId: 'two', status: 'empty' },
    ]);
    expect(client.functions.invoke).toHaveBeenCalledTimes(1);
  });

  it('never sends a browser-side provider secret', async () => {
    const client = clientWith({ data: { photos: [] }, error: null });
    await fetchDirectoryPhotos(['one'], { client });

    const request = JSON.stringify(client.functions.invoke.mock.calls);
    expect(request).not.toContain('GOOGLE_PLACES_API_KEY');
    expect(request).not.toContain('VITE_GOOGLE');
  });
});
