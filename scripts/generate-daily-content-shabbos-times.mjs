#!/usr/bin/env node

import { CandleLightingEvent, HavdalahEvent, HebrewCalendar, Location } from '@hebcal/core';

const FIVE_TOWNS_LOCATION = new Location(
  40.62,
  -73.73,
  false,
  'America/New_York',
  'Five Towns, NY',
  'US'
);

const FIVE_TOWNS_TIME_ZONE = 'America/New_York';
const WEEKDAY_INDEX = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: FIVE_TOWNS_TIME_ZONE,
  weekday: 'short',
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
});

function getFiveTownsParts(date) {
  return dateFormatter.formatToParts(date).reduce((parts, part) => {
    if (part.type !== 'literal') parts[part.type] = part.value;
    return parts;
  }, {});
}

function toUtcNoon({ year, month, day }, dayOffset = 0) {
  return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day) + dayOffset, 12));
}

function getDateKey(date) {
  return date.toISOString().slice(0, 10);
}

function getTargetSaturdayNoon(date) {
  const parts = getFiveTownsParts(date);
  const weekday = WEEKDAY_INDEX[parts.weekday];
  const daysUntilSaturday = (WEEKDAY_INDEX.Sat - weekday + 7) % 7;
  return toUtcNoon(parts, daysUntilSaturday);
}

function getShabbosTimes(date) {
  const saturdayNoon = getTargetSaturdayNoon(date);
  const fridayNoon = new Date(Date.UTC(
    saturdayNoon.getUTCFullYear(),
    saturdayNoon.getUTCMonth(),
    saturdayNoon.getUTCDate() - 1,
    12
  ));

  const events = HebrewCalendar.calendar({
    start: fridayNoon,
    end: saturdayNoon,
    candlelighting: true,
    location: FIVE_TOWNS_LOCATION,
  });

  return {
    candleLighting: events.find((event) => event instanceof CandleLightingEvent)?.eventTime ?? null,
    havdalah: events.find((event) => event instanceof HavdalahEvent)?.eventTime ?? null,
  };
}

function buildRows(startDate = new Date(), days = 14) {
  return Array.from({ length: days }, (_, dayOffset) => {
    const date = new Date(Date.UTC(
      startDate.getUTCFullYear(),
      startDate.getUTCMonth(),
      startDate.getUTCDate() + dayOffset,
      12
    ));
    const { candleLighting, havdalah } = getShabbosTimes(date);
    if (!candleLighting || !havdalah) {
      throw new Error(`Could not calculate Shabbos times for ${getDateKey(date)}`);
    }
    return {
      date: getDateKey(date),
      candleLighting: candleLighting.toISOString(),
      havdalah: havdalah.toISOString(),
    };
  });
}

function escapeSql(value) {
  return String(value).replaceAll("'", "''");
}

const startArg = process.argv[2];
const daysArg = process.argv[3];
const startDate = startArg ? new Date(`${startArg}T12:00:00.000Z`) : new Date();
const days = daysArg ? Number(daysArg) : 14;

if (Number.isNaN(startDate.getTime())) {
  throw new Error(`Invalid start date: ${startArg}`);
}
if (!Number.isInteger(days) || days < 1) {
  throw new Error(`Invalid day count: ${daysArg}`);
}

const values = buildRows(startDate, days)
  .map((row) => `  ('${escapeSql(row.date)}'::date, '${escapeSql(row.candleLighting)}'::timestamptz, '${escapeSql(row.havdalah)}'::timestamptz)`)
  .join(',\n');

console.log(`with shabbos_times(date, candle_lighting_at, havdalah_at) as (
  values
${values}
)
update public.daily_content dc
set
  candle_lighting_at = st.candle_lighting_at,
  havdalah_at = st.havdalah_at
from shabbos_times st
where dc.date = st.date;`);
