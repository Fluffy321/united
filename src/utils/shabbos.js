import { CandleLightingEvent, HavdalahEvent, HebrewCalendar, Location } from '@hebcal/core';

export const FIVE_TOWNS_SHABBOS_LOCATION = new Location(
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

const fiveTownsDateFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: FIVE_TOWNS_TIME_ZONE,
  weekday: 'short',
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
});

function getFiveTownsDateParts(date) {
  return fiveTownsDateFormatter.formatToParts(date).reduce((parts, part) => {
    if (part.type !== 'literal') parts[part.type] = part.value;
    return parts;
  }, {});
}

function toUtcNoon({ year, month, day }, dayOffset = 0) {
  return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day) + dayOffset, 12));
}

function getTargetSaturdayNoon(date) {
  const parts = getFiveTownsDateParts(date);
  const weekday = WEEKDAY_INDEX[parts.weekday];
  const daysUntilSaturday = (WEEKDAY_INDEX.Sat - weekday + 7) % 7;
  return toUtcNoon(parts, daysUntilSaturday);
}

export function getShabbosTimes(date = new Date()) {
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
    location: FIVE_TOWNS_SHABBOS_LOCATION,
  });

  const candleLighting = events.find((event) => event instanceof CandleLightingEvent)?.eventTime ?? null;
  const havdalah = events.find((event) => event instanceof HavdalahEvent)?.eventTime ?? null;

  return { candleLighting, havdalah };
}

export function isShabbos(date = new Date()) {
  const { candleLighting, havdalah } = getShabbosTimes(date);
  if (!candleLighting || !havdalah) return false;

  const timestamp = date.getTime();
  return timestamp >= candleLighting.getTime() && timestamp < havdalah.getTime();
}
