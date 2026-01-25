import { describe, it, expect } from 'vitest';
import { formatCookingTime, formatDifficulty } from '../formatTime';

describe('formatCookingTime', () => {
  it('should format minutes only', () => {
    expect(formatCookingTime(15)).toBe('15分钟');
    expect(formatCookingTime(45)).toBe('45分钟');
    expect(formatCookingTime(59)).toBe('59分钟');
  });

  it('should format hours only', () => {
    expect(formatCookingTime(60)).toBe('1小时');
    expect(formatCookingTime(120)).toBe('2小时');
    expect(formatCookingTime(180)).toBe('3小时');
  });

  it('should format hours and minutes', () => {
    expect(formatCookingTime(90)).toBe('1小时30分钟');
    expect(formatCookingTime(75)).toBe('1小时15分钟');
    expect(formatCookingTime(150)).toBe('2小时30分钟');
  });

  it('should handle zero', () => {
    expect(formatCookingTime(0)).toBe('0分钟');
  });

  it('should handle single digit minutes', () => {
    expect(formatCookingTime(5)).toBe('5分钟');
    expect(formatCookingTime(61)).toBe('1小时1分钟');
  });
});

describe('formatDifficulty', () => {
  it('should format easy difficulty', () => {
    expect(formatDifficulty('easy')).toBe('简单');
  });

  it('should format medium difficulty', () => {
    expect(formatDifficulty('medium')).toBe('中等');
  });

  it('should format hard difficulty', () => {
    expect(formatDifficulty('hard')).toBe('困难');
  });
});
