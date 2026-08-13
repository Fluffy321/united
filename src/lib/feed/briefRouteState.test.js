import { describe, expect, it } from 'vitest';
import {
  closeBriefCategoryParams,
  closeBriefParams,
  openBriefCategoryParams,
  openBriefParams,
  readBriefRouteState,
} from './briefRouteState';

describe('Daily Brief route state', () => {
  it('reads closed, launchpad, focused, and invalid category states', () => {
    expect(readBriefRouteState(new URLSearchParams(''))).toEqual({ isBriefOpen: false, categoryId: null });
    expect(readBriefRouteState(new URLSearchParams('brief=1'))).toEqual({ isBriefOpen: true, categoryId: null });
    expect(readBriefRouteState(new URLSearchParams('brief=1&category=minyanim'))).toEqual({ isBriefOpen: true, categoryId: 'minyanim' });
    expect(readBriefRouteState(new URLSearchParams('brief=1&category=unknown'))).toEqual({ isBriefOpen: true, categoryId: null });
  });

  it('opens the Brief and a canonical category while preserving unrelated state', () => {
    const original = new URLSearchParams('reply=post-1');

    expect(openBriefParams(original).toString()).toBe('reply=post-1&brief=1');
    expect(openBriefCategoryParams(original, 'helping').toString()).toBe('reply=post-1&brief=1&category=helping');
    expect(openBriefCategoryParams(original, 'unknown').toString()).toBe('reply=post-1&brief=1');
    expect(original.toString()).toBe('reply=post-1');
  });

  it('closes category or Brief at the correct level', () => {
    const focused = new URLSearchParams('reply=post-1&brief=1&category=events');

    expect(closeBriefCategoryParams(focused).toString()).toBe('reply=post-1&brief=1');
    expect(closeBriefParams(focused).toString()).toBe('reply=post-1');
    expect(focused.toString()).toBe('reply=post-1&brief=1&category=events');
  });
});
