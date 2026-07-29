import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Login from './Login';

vi.mock('@/lib/AuthContext', () => ({
  useAuth: () => ({
    checkAppState: vi.fn(),
    isAuthenticated: false,
    isLoadingAuth: false,
  }),
}));

vi.mock('@/services', () => ({
  dataService: {
    auth: {},
  },
}));

vi.mock('@/api/supabaseClient', () => ({
  getAuthRedirectUrl: vi.fn(),
  shouldUseSupabase: false,
  supabase: null,
}));

const renderLogin = (entry) => renderToStaticMarkup(
  <StaticRouter location={entry}>
    <Login />
  </StaticRouter>
);

describe('Login entry modes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the redesigned welcome screen on direct login visits', () => {
    const html = renderLogin('/login');

    expect(html).toContain('Stay close to what matters.');
    expect(html).toContain('Local Jewish life, in one place.');
    expect((html.match(/data-signal-star=/g) || [])).toHaveLength(56);
  });

  it('opens sign-in directly when a protected route supplies from_url', () => {
    const html = renderLogin('/login?from_url=%2FFeed');

    expect(html).toContain('Sign in');
    expect(html).toContain('Secure access');
    expect(html).not.toContain('Stay close to what matters.');
  });
});
