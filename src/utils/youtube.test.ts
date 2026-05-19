import { describe, it, expect } from 'vitest';
import { getYoutubeEmbedUrl } from './youtube';

describe('getYoutubeEmbedUrl', () => {
  it('converts standard watch URL', () => {
    expect(getYoutubeEmbedUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ'))
      .toBe('https://www.youtube.com/embed/dQw4w9WgXcQ');
  });

  it('converts short youtu.be URL', () => {
    expect(getYoutubeEmbedUrl('https://youtu.be/dQw4w9WgXcQ'))
      .toBe('https://www.youtube.com/embed/dQw4w9WgXcQ');
  });

  it('returns null for undefined input', () => {
    expect(getYoutubeEmbedUrl(undefined)).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(getYoutubeEmbedUrl('')).toBeNull();
  });

  it('returns null for non-YouTube URL', () => {
    expect(getYoutubeEmbedUrl('https://vimeo.com/123')).toBeNull();
  });

  it('already returns embed URL unchanged', () => {
    expect(getYoutubeEmbedUrl('https://www.youtube.com/embed/dQw4w9WgXcQ'))
      .toBe('https://www.youtube.com/embed/dQw4w9WgXcQ');
  });
});
