export function parseShabbosTime(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function getShabbosTimes(dailyContent = {}) {
  return {
    candleLighting: parseShabbosTime(dailyContent.candle_lighting_at),
    havdalah: parseShabbosTime(dailyContent.havdalah_at),
  };
}

export function isShabbos(date = new Date(), shabbosTimes = {}) {
  const { candleLighting, havdalah } = getShabbosTimes(shabbosTimes);
  if (!candleLighting || !havdalah) return false;

  const timestamp = date.getTime();
  return timestamp >= candleLighting.getTime() && timestamp < havdalah.getTime();
}
