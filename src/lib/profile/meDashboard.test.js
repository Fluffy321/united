import { describe, expect, it } from 'vitest';
import {
  isUrgentPersonalAlert,
  rankPersonalAlerts,
  selectNextJewishTime,
  selectNextPersonalPlan,
} from './meDashboard';

const now = new Date('2026-08-13T16:00:00-04:00');

describe('selectNextJewishTime', () => {
  it('selects the earliest upcoming daily time', () => {
    expect(selectNextJewishTime({
      sunrise: '2026-08-13T06:05:00-04:00',
      sofZmanShma: '2026-08-13T09:32:00-04:00',
      minchaGedola: '2026-08-13T13:34:00-04:00',
      sunset: '2026-08-13T19:48:00-04:00',
    }, null, now)).toMatchObject({ label: 'Sunset', date: '2026-08-13T19:48:00-04:00' });
  });

  it('falls back to the next candle lighting when daily times passed', () => {
    expect(selectNextJewishTime(
      { sunset: '2026-08-13T15:30:00-04:00' },
      { candleLighting: '2026-08-14T19:36:00-04:00', candleTitle: 'Candle lighting' },
      now
    )).toMatchObject({ label: 'Candle lighting', date: '2026-08-14T19:36:00-04:00' });
  });

  it('returns null when there is no valid future time', () => {
    expect(selectNextJewishTime({ sunset: 'not-a-date' }, {}, now)).toBeNull();
  });
});

describe('personal alert ranking', () => {
  const alerts = [
    { id: 'community', type: 'community_activity', created_date: '2026-08-13T19:00:00Z', is_read: false, link_url: '/Communities' },
    { id: 'message', type: 'new_message', created_date: '2026-08-13T18:00:00Z', is_read: false, link_url: '/Messages' },
    { id: 'offer', type: 'mitzvah_offer', created_date: '2026-08-13T17:00:00Z', is_read: false, link_url: '/MitzvahCircle' },
    { id: 'read', type: 'verification_request', created_date: '2026-08-13T20:00:00Z', is_read: true, link_url: '/MitzvahCircle' },
  ];

  it('puts unread alerts before read alerts and limits the result', () => {
    expect(rankPersonalAlerts(alerts, 3).map((alert) => alert.id)).toEqual(['community', 'message', 'offer']);
  });

  it('selects help before messages and community activity as the next plan', () => {
    expect(selectNextPersonalPlan(alerts).id).toBe('offer');
  });

  it('ignores notifications without working routes for the next plan', () => {
    expect(selectNextPersonalPlan([{ id: 'dead', type: 'mitzvah_offer', is_read: false }])).toBeNull();
  });

  it('classifies only time-sensitive personal types as urgent', () => {
    expect(isUrgentPersonalAlert({ type: 'mitzvah_offer' })).toBe(true);
    expect(isUrgentPersonalAlert({ type: 'verification_request' })).toBe(true);
    expect(isUrgentPersonalAlert({ type: 'community_activity' })).toBe(false);
  });
});
