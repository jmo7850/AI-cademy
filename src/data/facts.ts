import type { Fact } from '../domain/types';

/** Date the official-source facts in the seed catalog were read. */
export const CATALOG_CHECKED_ON = '2026-10-10';

/** Catalog facts older than this need a re-check before being trusted. */
export const STALE_AFTER_DAYS = 90;

export const verified = <T>(value: T, note?: string): Fact<T> => ({ value, status: 'verified', note });
export const unverified = <T>(value: T, note?: string): Fact<T> => ({ value, status: 'unverified', note });
export const estimate = <T>(value: T, note?: string): Fact<T> => ({ value, status: 'estimate', note });
