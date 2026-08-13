import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import CommunitiesLoadingRecovery from './CommunitiesLoadingRecovery';

describe('CommunitiesLoadingRecovery', () => {
  it('starts with ordinary skeletons and no failure copy', () => {
    const html = renderToStaticMarkup(
      <CommunitiesLoadingRecovery timedOut={false} isError={false} onRetry={() => {}} onGoHome={() => {}} />
    );

    expect(html.match(/data-community-skeleton/g)).toHaveLength(4);
    expect(html).not.toContain('taking longer than expected');
  });

  it.each([
    ['timeout', true, false],
    ['query error', false, true],
  ])('gives a useful escape for %s', (_label, timedOut, isError) => {
    const html = renderToStaticMarkup(
      <CommunitiesLoadingRecovery timedOut={timedOut} isError={isError} onRetry={() => {}} onGoHome={() => {}} />
    );

    expect(html).toContain('Communities are taking longer than expected');
    expect(html).toContain('Try again');
    expect(html).toContain('Go home');
    expect(html.match(/<button/g)).toHaveLength(2);
  });

  it('connects both recovery buttons to working actions', () => {
    const onRetry = vi.fn();
    const onGoHome = vi.fn();
    const tree = CommunitiesLoadingRecovery({ timedOut: true, isError: false, onRetry, onGoHome });
    const [goHomeButton, retryButton] = tree.props.children[3].props.children;

    goHomeButton.props.onClick();
    retryButton.props.onClick();

    expect(onGoHome).toHaveBeenCalledOnce();
    expect(onRetry).toHaveBeenCalledOnce();
  });
});
