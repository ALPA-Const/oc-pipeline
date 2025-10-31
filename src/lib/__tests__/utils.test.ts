import { describe, it, expect } from 'vitest';
import { cn } from '../utils';

describe('cn utility', () => {
  it('should merge class names correctly', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('should handle conditional classes', () => {
    const isActive = true;
    expect(cn('base', isActive && 'active')).toBe('base active');
    expect(cn('base', !isActive && 'active')).toBe('base');
  });

  it('should handle tailwind merge conflicts', () => {
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4');
  });

  it('should handle undefined and null values', () => {
    expect(cn('foo', undefined, 'bar', null)).toBe('foo bar');
  });

  it('should handle arrays', () => {
    expect(cn(['foo', 'bar'])).toBe('foo bar');
  });

  it('should handle objects', () => {
    expect(cn({ foo: true, bar: false })).toBe('foo');
  });
});