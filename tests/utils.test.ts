import { describe, it, expect } from 'vitest';
import { extractJsonFromMarkdown, chunkArray, truncate, safeJsonParse } from '../src/utils/helpers.js';

describe('Utils', () => {
  it('extracts JSON from markdown code block', () => {
    const text = 'Here is the plan:\n```json\n{"name": "test"}\n```\nDone.';
    const json = extractJsonFromMarkdown(text);
    expect(json).toBe('{"name": "test"}');
  });

  it('extracts JSON from plain code block', () => {
    const text = '```\n{"name": "test"}\n```';
    const json = extractJsonFromMarkdown(text);
    expect(json).toBe('{"name": "test"}');
  });

  it('returns plain text when no code block', () => {
    const text = '{"name": "test"}';
    expect(extractJsonFromMarkdown(text)).toBe('{"name": "test"}');
  });

  it('chunks arrays', () => {
    const arr = [1, 2, 3, 4, 5];
    const chunks = chunkArray(arr, 2);
    expect(chunks).toEqual([[1, 2], [3, 4], [5]]);
  });

  it('truncates long text', () => {
    const text = 'a'.repeat(100);
    const truncated = truncate(text, 50);
    expect(truncated.length).toBe(50);
    expect(truncated.endsWith('...')).toBe(true);
  });

  it('parses valid JSON safely', () => {
    const result = safeJsonParse<{ a: number }>('{"a": 1}');
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.a).toBe(1);
  });

  it('returns error for invalid JSON safely', () => {
    const result = safeJsonParse('not json');
    expect(result.ok).toBe(false);
  });
});
