import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import HomeStartHere from './HomeStartHere';

describe('HomeStartHere', () => {
  it('offers four real JUnited actions without fabricating activity', () => {
    const html = renderToStaticMarkup(
      <HomeStartHere
        onShare={() => {}}
        onHelp={() => {}}
        onCommunities={() => {}}
        onDirectory={() => {}}
      />
    );

    expect(html).toContain('Start here');
    expect(html).toContain('Share an update');
    expect(html).toContain('Ask for help');
    expect(html).toContain('Find communities');
    expect(html).toContain('Browse directory');
    expect(html.match(/<button/g)).toHaveLength(4);
    expect(html).not.toMatch(/\b\d+ (people|posts|needs|nearby)\b/i);
  });

  it('connects every tile to its supplied action', () => {
    const actions = [vi.fn(), vi.fn(), vi.fn(), vi.fn()];
    const tree = HomeStartHere({
      onShare: actions[0],
      onHelp: actions[1],
      onCommunities: actions[2],
      onDirectory: actions[3],
    });

    tree.props.children[1].props.children.forEach((button) => button.props.onClick());

    actions.forEach((action) => expect(action).toHaveBeenCalledOnce());
  });
});
