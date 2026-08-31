import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import {
  DirectoryPhotoMediaView,
  selectDirectoryPhoto,
} from './DirectoryPhotoMedia';

const listing = {
  id: 'grant-park',
  name: 'Grant Park',
  groupId: 'things-to-do',
  imageUrl: 'https://official.example/park.jpg',
  imageSourceUrl: 'https://official.example/park',
  imageSourceLabel: 'Nassau County Parks',
};

const googlePhoto = {
  listingId: 'grant-park',
  status: 'ready',
  imageUrl: 'https://google.example/park.jpg',
  sourceUrl: 'https://maps.google.com/park',
  sourceLabel: 'Google Places',
  authorName: 'Grant Park',
  authorUri: 'https://maps.google.com/contrib/park',
};

describe('DirectoryPhotoMedia', () => {
  it('keeps a reviewed official photo ahead of Google', () => {
    const html = renderToStaticMarkup(<DirectoryPhotoMediaView listing={listing} runtimePhoto={googlePhoto} />);
    expect(html).toContain('https://official.example/park.jpg');
    expect(html).toContain('Official photo · Nassau County Parks');
    expect(html).not.toContain('https://google.example/park.jpg');
  });

  it('shows an attributed Google photo when no official photo exists', () => {
    const html = renderToStaticMarkup(
      <DirectoryPhotoMediaView listing={{ ...listing, imageUrl: '', imageSourceUrl: '' }} runtimePhoto={googlePhoto} />,
    );
    expect(html).toContain('https://google.example/park.jpg');
    expect(html).toContain('Photo by Grant Park');
    expect(html).toContain('https://maps.google.com/contrib/park');
    expect(html).toContain('https://maps.google.com/park');
  });

  it('falls back cleanly after an image error or when no photo exists', () => {
    expect(selectDirectoryPhoto(listing, googlePhoto, new Set(['official']))?.kind).toBe('google');
    expect(selectDirectoryPhoto(listing, googlePhoto, new Set(['official', 'google']))).toBeNull();
    const html = renderToStaticMarkup(
      <DirectoryPhotoMediaView listing={{ ...listing, imageUrl: '' }} runtimePhoto={{ status: 'empty' }} />,
    );
    expect(html).toContain('Explore Grant Park');
    expect(html).not.toContain('<img');
  });

  it('loads lazily unless the card is eager', () => {
    const lazy = renderToStaticMarkup(<DirectoryPhotoMediaView listing={listing} />);
    const eager = renderToStaticMarkup(<DirectoryPhotoMediaView listing={listing} eager />);
    expect(lazy).toContain('loading="lazy"');
    expect(eager).toContain('loading="eager"');
  });
});
