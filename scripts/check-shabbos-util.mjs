import assert from 'node:assert/strict';
import { getShabbosTimes, isShabbos } from '../src/utils/shabbos.js';

const knownSaturdayNoonInFiveTowns = new Date('2026-06-13T16:00:00.000Z');
const knownTuesdayNoonInFiveTowns = new Date('2026-06-16T16:00:00.000Z');
const knownTimes = {
  candle_lighting_at: '2026-06-13T00:08:00.000Z',
  havdalah_at: '2026-06-14T01:17:00.000Z',
};

assert.equal(isShabbos(knownSaturdayNoonInFiveTowns, knownTimes), true, 'Saturday noon should be Shabbos');
assert.equal(isShabbos(knownTuesdayNoonInFiveTowns, knownTimes), false, 'Tuesday noon should not be Shabbos');

const { candleLighting, havdalah } = getShabbosTimes(knownTimes);
assert.ok(candleLighting instanceof Date, 'candleLighting should be a Date');
assert.ok(havdalah instanceof Date, 'havdalah should be a Date');
assert.ok(candleLighting < knownSaturdayNoonInFiveTowns, 'candleLighting should be before Saturday noon');
assert.ok(havdalah > knownSaturdayNoonInFiveTowns, 'havdalah should be after Saturday noon');

console.log('PASS: Shabbos utility known Saturday/Tuesday check');
