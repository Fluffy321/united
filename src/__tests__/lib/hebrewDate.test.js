import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  gregorianToHebrew,
  formatDualDate,
  formatZmanTime,
  getShabbatTimes,
  getParsha,
  HEBREW_MONTHS,
  CANDLE_LIGHTING_MINUTES,
} from '@/lib/hebrewDate';

const MOCK_CONVERTER_RESPONSE = {
  hebrew: 'כ״ז בניסן תשפ״ו',
  hd: 27,
  hm: 'Nisan',
  hy: 5786,
};

const MOCK_SHABBAT_RESPONSE = {
  location: { title: 'New York, NY' },
  items: [
    { category: 'candles',  date: '2025-05-23T19:30:00-04:00', title: 'Candle lighting' },
    { category: 'havdalah', date: '2025-05-24T20:45:00-04:00', title: 'Havdalah' },
    { category: 'parashat', title: 'Parashat Bamidbar', hebrew: 'בְּמִדְבַּר', link: 'https://hebcal.com/s/bamidbar' },
  ],
};

function mockFetchSuccess(body) {
  global.fetch = vi.fn().mockResolvedValue({ json: () => Promise.resolve(body) });
}
function mockFetchFailure() {
  global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
}

afterEach(() => vi.restoreAllMocks());

describe('gregorianToHebrew', () => {
  it('returns the expected shape on success', async () => {
    mockFetchSuccess(MOCK_CONVERTER_RESPONSE);
    const result = await gregorianToHebrew(new Date('2025-04-27'));
    expect(result).toEqual({
      hebrewString: 'כ״ז בניסן תשפ״ו',
      hd: 27,
      hm: 'Nisan',
      hy: 5786,
      display: '27 Nisan 5786',
    });
  });
  it('calls the Hebcal converter API with the correct date params', async () => {
    mockFetchSuccess(MOCK_CONVERTER_RESPONSE);
    await gregorianToHebrew(new Date('2025-06-15'));
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('gy=2025&gm=6&gd=15'));
  });
  it('returns null on network failure', async () => {
    mockFetchFailure();
    expect(await gregorianToHebrew(new Date())).toBeNull();
  });
  it('uses today when no date is provided', async () => {
    mockFetchSuccess(MOCK_CONVERTER_RESPONSE);
    await gregorianToHebrew(); // should not throw
    expect(fetch).toHaveBeenCalled();
  });
});

describe('formatDualDate', () => {
  it('combines civil and Hebrew dates separated by ·', async () => {
    mockFetchSuccess(MOCK_CONVERTER_RESPONSE);
    const result = await formatDualDate('2025-04-27');
    expect(result).toContain('·');
    expect(result).toContain('27 Nisan 5786');
  });
  it('accepts a Date object', async () => {
    mockFetchSuccess(MOCK_CONVERTER_RESPONSE);
    const result = await formatDualDate(new Date('2025-04-27'));
    expect(result).toContain('·');
  });
  it('falls back to civil date only when Hebcal fails', async () => {
    mockFetchFailure();
    const result = await formatDualDate('2025-04-27');
    expect(result).not.toContain('·');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
});

describe('getShabbatTimes', () => {
  beforeEach(() => mockFetchSuccess(MOCK_SHABBAT_RESPONSE));

  it('returns candleLighting, havdalah, and parsha', async () => {
    const result = await getShabbatTimes(40.6157, -73.7296);
    expect(result.candleLighting).toBe('2025-05-23T19:30:00-04:00');
    expect(result.havdalah).toBe('2025-05-24T20:45:00-04:00');
    expect(result.parsha).toBe('Parashat Bamidbar');
  });
  it('returns the location title', async () => {
    const result = await getShabbatTimes(40.6157, -73.7296);
    expect(result.location).toBe('New York, NY');
  });
  it('includes allCandles and allHavdalah arrays', async () => {
    const result = await getShabbatTimes(40.6157, -73.7296);
    expect(Array.isArray(result.allCandles)).toBe(true);
    expect(Array.isArray(result.allHavdalah)).toBe(true);
    expect(result.allCandles).toHaveLength(1);
    expect(result.allHavdalah).toHaveLength(1);
  });
  it('exposes candleLightingMinutes', async () => {
    const result = await getShabbatTimes(40.6157, -73.7296);
    expect(result.candleLightingMinutes).toBe(CANDLE_LIGHTING_MINUTES);
  });
  it('returns null on network failure', async () => {
    mockFetchFailure();
    expect(await getShabbatTimes(0, 0)).toBeNull();
  });
  it('includes an empty majorHolidays array when no major holidays exist', async () => {
    const result = await getShabbatTimes(40.6157, -73.7296);
    expect(Array.isArray(result.majorHolidays)).toBe(true);
  });
});

describe('getParsha', () => {
  it('returns parsha name and hebrew when found', async () => {
    mockFetchSuccess({
      items: [
        { category: 'parashat', title: 'Parashat Bamidbar', hebrew: 'בְּמִדְבַּר', link: 'https://hebcal.com' },
      ],
    });
    const result = await getParsha();
    expect(result.name).toBe('Parashat Bamidbar');
    expect(result.hebrew).toBe('בְּמִדְבַּר');
  });
  it('returns null when no parsha item exists', async () => {
    mockFetchSuccess({ items: [] });
    expect(await getParsha()).toBeNull();
  });
  it('returns null on network failure', async () => {
    mockFetchFailure();
    expect(await getParsha()).toBeNull();
  });
});

describe('formatZmanTime', () => {
  it('returns "—" for null', () => expect(formatZmanTime(null)).toBe('—'));
  it('returns "—" for undefined', () => expect(formatZmanTime(undefined)).toBe('—'));
  it('returns "—" for empty string', () => expect(formatZmanTime('')).toBe('—'));
  it('formats a valid ISO time string in 12-hour format', () => {
    const result = formatZmanTime('2025-05-23T19:30:00-04:00');
    // Locale-independent shape check: "7:30 PM" or "7:30PM"
    expect(result).toMatch(/\d{1,2}:\d{2}\s?(AM|PM)/i);
  });
});

describe('HEBREW_MONTHS', () => {
  it('has 14 entries (0-indexed, 1=Tishrei … 13=Adar II)', () => {
    expect(HEBREW_MONTHS).toHaveLength(14);
  });
  it('index 0 is empty (sentinel)', () => {
    expect(HEBREW_MONTHS[0]).toBe('');
  });
  it('index 1 is Tishrei', () => {
    expect(HEBREW_MONTHS[1]).toBe('Tishrei');
  });
  it('index 7 is Nisan', () => {
    expect(HEBREW_MONTHS[7]).toBe('Nisan');
  });
  it('index 13 is Adar II', () => {
    expect(HEBREW_MONTHS[13]).toBe('Adar II');
  });
});

describe('CANDLE_LIGHTING_MINUTES', () => {
  it('is 18 (Ashkenazi standard)', () => {
    expect(CANDLE_LIGHTING_MINUTES).toBe(18);
  });
});
