/**
 * Metrics Cache Service
 * Cache metric responses with 5-15 min TTL
 * Key format: {filters, window, as_of_day}
 */

import type { FilterParams } from '@/types/metrics.types';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export class MetricsCache {
  private cache: Map<string, CacheEntry<unknown>> = new Map();
  private readonly DEFAULT_TTL = 10 * 60 * 1000; // 10 minutes

  /**
   * Generate cache key from filters and window
   */
  private generateKey(metric: string, filters: FilterParams, window: string): string {
    const today = new Date().toISOString().split('T')[0];
    const filterKey = JSON.stringify(filters);
    return `${metric}:${window}:${filterKey}:${today}`;
  }

  /**
   * Get cached metric
   */
  get<T>(metric: string, filters: FilterParams, window: string): T | null {
    const key = this.generateKey(metric, filters, window);
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    console.log(`📦 Cache HIT: ${key}`);
    return entry.data as T;
  }

  /**
   * Set cached metric
   */
  set<T>(metric: string, filters: FilterParams, window: string, data: T, ttl?: number): void {
    const key = this.generateKey(metric, filters, window);
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.DEFAULT_TTL,
    });
    console.log(`📦 Cache SET: ${key}`);
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
    console.log('📦 Cache CLEARED');
  }

  /**
   * Clear cache for specific metric
   */
  clearMetric(metric: string): void {
    const keys = Array.from(this.cache.keys()).filter(k => k.startsWith(metric));
    keys.forEach(k => this.cache.delete(k));
    console.log(`📦 Cache CLEARED for metric: ${metric}`);
  }

  /**
   * Get cache stats
   */
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

export const metricsCache = new MetricsCache();