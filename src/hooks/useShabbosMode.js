import { useState, useEffect } from 'react';
import { getFiveTownsShabbatTimes } from '@/lib/hebrewDate';

const HAVDALAH_OFFSET_MINUTES = 50;

function parseTime(str) {
  if (!str) return null;
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

export default function useShabbosMode() {
  const [state, setState] = useState({
    isShabbos: false,
    isErevShabbos: false,        // within 90 min of candle lighting
    candleLighting: null,
    havdalah: null,
    minutesUntilCandles: null,
    minutesUntilHavdalah: null,
  });

  useEffect(() => {
    let timer;

    async function update() {
      try {
        const times = await getFiveTownsShabbatTimes();
        const now = new Date();

        const candle = parseTime(times?.candleLighting);
        const havdalah = parseTime(times?.havdalah);

        if (!candle || !havdalah) return;

        const minutesToCandle = (candle - now) / 60000;
        const minutesToHavdalah = (havdalah - now) / 60000;

        const isShabbos = now >= candle && now < havdalah;
        const isErevShabbos = !isShabbos && minutesToCandle >= 0 && minutesToCandle <= 90;

        setState({
          isShabbos,
          isErevShabbos,
          candleLighting: candle,
          havdalah,
          minutesUntilCandles: minutesToCandle > 0 ? Math.round(minutesToCandle) : null,
          minutesUntilHavdalah: isShabbos && minutesToHavdalah > 0 ? Math.round(minutesToHavdalah) : null,
        });

        // Re-check every 2 minutes
        timer = setTimeout(update, 2 * 60 * 1000);
      } catch {
        timer = setTimeout(update, 10 * 60 * 1000);
      }
    }

    update();
    return () => clearTimeout(timer);
  }, []);

  return state;
}
