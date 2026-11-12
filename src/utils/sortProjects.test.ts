import { describe, it, expect } from 'vitest';
import { compareProjects } from './sortProjects';

const p = (year: string, order: number) => ({ data: { year, order } });

describe('compareProjects', () => {
  it('radí najnovší rok prvý', () => {
    expect([p('2024', 1), p('2026', 9), p('2025', 3)].sort(compareProjects).map((x) => x.data.year)).toEqual(['2026', '2025', '2024']);
  });
  it('v rámci roka radí podľa order', () => {
    expect([p('2026', 6), p('2026', 0), p('2026', 2)].sort(compareProjects).map((x) => x.data.order)).toEqual([0, 2, 6]);
  });
});
