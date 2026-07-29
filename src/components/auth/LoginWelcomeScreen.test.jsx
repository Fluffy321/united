import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import CommunitySignalGraphic, { COMMUNITY_SIGNAL_STARS } from './CommunitySignalGraphic';
import LoginWelcomeScreen from './LoginWelcomeScreen';

describe('CommunitySignalGraphic', () => {
  it('uses the approved deterministic rich star field', () => {
    const html = renderToStaticMarkup(<CommunitySignalGraphic />);

    expect(COMMUNITY_SIGNAL_STARS).toHaveLength(56);
    expect((html.match(/data-signal-star=/g) || [])).toHaveLength(56);
    expect(html).toContain('See what matters.');
    expect(html).toContain('Show up where it counts.');
  });
});

describe('LoginWelcomeScreen', () => {
  it('renders the approved market-neutral welcome copy', () => {
    const html = renderToStaticMarkup(
      <LoginWelcomeScreen onGetStarted={() => {}} onSignIn={() => {}} />
    );

    expect(html).toContain('Local Jewish life, in one place.');
    expect(html).toContain('Built for real community');
    expect(html).toContain('Stay close to what matters.');
    expect(html).toContain('One place for local updates, mitzvah needs, shuls, events, businesses, and neighbors.');
    expect(html).toContain('Local updates');
    expect(html).toContain('Community needs');
    expect(html).toContain('Places &amp; plans');
  });

  it('does not introduce market-specific or guarantee copy', () => {
    const html = renderToStaticMarkup(
      <LoginWelcomeScreen onGetStarted={() => {}} onSignIn={() => {}} />
    );

    expect(html).not.toContain('Five Towns');
    expect(html).not.toContain('trusted place');
    expect(html).not.toContain('guaranteed');
  });

  it('exposes both welcome actions as buttons', () => {
    const html = renderToStaticMarkup(
      <LoginWelcomeScreen onGetStarted={() => {}} onSignIn={() => {}} />
    );

    expect((html.match(/<button/g) || [])).toHaveLength(2);
    expect(html).toContain('Get started');
    expect(html).toContain('Already have an account? Sign in');
  });
});
