import { describe, expect, it } from 'vitest';
import {
  PUBLISHING_GROUPS,
  PUBLISHING_TYPES,
  getExpirationOptions,
  getPublishingType,
} from './publishingTypes';

describe('publishing taxonomy', () => {
  it('exposes six groups and exactly twenty-six unique publishing types', () => {
    expect(PUBLISHING_GROUPS).toHaveLength(6);
    expect(PUBLISHING_TYPES).toHaveLength(26);
    expect(new Set(PUBLISHING_TYPES.map((type) => type.id)).size).toBe(26);
  });

  it('keeps kosher/menu updates and local deals as separate choices', () => {
    expect(getPublishingType('kosher_menu_update').label).toBe('Kosher or menu update');
    expect(getPublishingType('local_deal').label).toBe('Local deal');
  });

  it.each([
    ['local_news', 'post', 168],
    ['urgent_safety', 'post', 24],
    ['event', 'event', null],
    ['help_need', 'help', 168],
    ['lost_found', 'marketplace', 720],
    ['job', 'marketplace', 720],
    ['sale', 'marketplace', 336],
    ['business_update', 'post', 336],
  ])('%s has the approved destination and expiry', (id, destination, defaultHours) => {
    const type = getPublishingType(id);

    expect(type.destination).toBe(destination);
    expect(type.expiration.defaultHours).toBe(defaultHours);
    expect(getExpirationOptions(id).maxHours).toBeGreaterThanOrEqual(defaultHours || 1);
  });

  it('returns null for an unsupported type', () => {
    expect(getPublishingType('made_up_type')).toBeNull();
  });
});
