import { describe, expect, it } from 'vitest';
import { normalize, searchItems } from '../src/utils/search';

const items = [
  { name: 'Administration Block', aliases: ['Admin Block', 'Administration'] },
  { name: 'Students Services Center', aliases: ['SSC'] },
  { name: 'Library', aliases: [] },
  { name: 'Academic Block A', aliases: [] },
];
describe('search', () => {
  it('normalizes case, punctuation and whitespace', () => expect(normalize('  Admin-BLOCK!! ')).toBe('admin block'));
  it('finds by alias/abbreviation', () => expect(searchItems(items, 'ssc')[0].name).toBe('Students Services Center'));
  it('is case and whitespace tolerant', () => expect(searchItems(items, '  LIBRARY ')[0].name).toBe('Library'));
  it('ranks exact/prefix above partial', () => expect(searchItems(items, 'admin')[0].name).toBe('Administration Block'));
  it('matches multiple tokens', () => expect(searchItems(items, 'block a')[0].name).toBe('Academic Block A'));
  it('returns nothing for unknown terms', () => expect(searchItems(items, 'xyz')).toHaveLength(0));
});
