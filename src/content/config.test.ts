import { describe, it, expect } from 'vitest';
import { projectSchema, postSchema, serviceSchema, testimonialSchema } from './schemas';

describe('projects schema', () => {
  it('accepts valid project frontmatter', () => {
    const valid = {
      slugKey: 'tatra-textil',
      slug: 'eshop-tatra-textil',
      lang: 'sk',
      title: 'E-shop Tatra Textil',
      tags: ['wordpress'],
      cover: { src: '/foo.jpg', width: 800, height: 600, format: 'jpg' },
      excerpt: 'Redizajn e-shopu.',
    };
    expect(() => projectSchema.parse(valid)).not.toThrow();
  });

  it('rejects missing slugKey', () => {
    const invalid = {
      slug: 'foo',
      lang: 'sk',
      title: 'X',
      cover: { src: '/foo.jpg', width: 1, height: 1, format: 'jpg' },
      excerpt: 'X',
    };
    expect(() => projectSchema.parse(invalid)).toThrow();
  });

  it('rejects invalid lang', () => {
    const invalid = {
      slugKey: 'a', slug: 'a', lang: 'de', title: 'X', excerpt: 'X',
      cover: { src: '/foo.jpg', width: 1, height: 1, format: 'jpg' },
    };
    expect(() => projectSchema.parse(invalid)).toThrow();
  });
});

describe('posts schema', () => {
  it('coerces date string to Date', () => {
    const result = postSchema.parse({
      slugKey: 'a', slug: 'a', lang: 'sk',
      title: 'Hello', excerpt: 'world',
      date: '2026-05-01',
    });
    expect(result.date).toBeInstanceOf(Date);
  });

  it('defaults draft to false', () => {
    const result = postSchema.parse({
      slugKey: 'a', slug: 'a', lang: 'sk',
      title: 'X', excerpt: 'Y',
      date: '2026-05-01',
    });
    expect(result.draft).toBe(false);
  });
});

describe('services schema', () => {
  it('requires icon', () => {
    expect(() => serviceSchema.parse({
      slugKey: 'a', lang: 'sk', title: 'X', ctaLabel: 'Y',
    })).toThrow();
  });
});

describe('testimonials schema', () => {
  it('rejects too-short quote', () => {
    expect(() => testimonialSchema.parse({
      quote: 'short', author: 'A', role: 'R', lang: 'sk',
    })).toThrow();
  });
});
