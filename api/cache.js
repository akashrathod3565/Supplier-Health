/**
 * cache.js — Deterministic supplier assessment cache
 *
 * PURPOSE: Fix the inconsistency bug where the same supplier search
 * yields different results on refresh.
 *
 * HOW IT WORKS:
 * - Cache key = SHA-256(supplierName_normalised + "::" + deepSearch)
 * - Results are stored in a module-level Map (survives warm lambda restarts)
 * - TTL = 24 hours (configurable via CACHE_TTL_HOURS env var)
 * - Cache can be bypassed by passing nocache:true in request body (dev/testing)
 *
 * WHY SHA-256:
 * - Normalises supplier name variations ("Tata Steel" vs "tata steel" → same key)
 * - Collapses whitespace so "Infosys  Limited" and "Infosys Limited" match
 * - Produces a fixed-length opaque key safe for Map storage
 *
 * ENTERPRISE UPGRADE PATH:
 * Replace the in-memory Map with:
 *   - Redis (Upstash) for multi-instance consistency
 *   - Vercel KV for zero-config serverless persistence
 *   - PostgreSQL / Supabase for audit trail + analytics
 */

import crypto from "crypto";

const TTL_MS =
  parseInt(process.env.CACHE_TTL_HOURS || "24") * 60 * 60 * 1000;

// Module-level store — survives warm lambda restarts on Vercel
const store = new Map();

/**
 * Compute a deterministic cache key for a supplier + search mode combination.
 * Normalises supplier name: lowercase, trim, collapse whitespace.
 */
export function computeCacheKey(supplierName, deepSearch = false) {
  const normalised = supplierName.trim().toLowerCase().replace(/\s+/g, " ");
  const raw = `${normalised}::${String(deepSearch)}`;
  return crypto.createHash("sha256").update(raw).digest("hex");
}

/**
 * Retrieve a cached result. Returns null on miss or expiry.
 */
export function getCache(key) {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.data;
}

/**
 * Store a result with TTL.
 */
export function setCache(key, data) {
  store.set(key, {
    data,
    expiresAt: Date.now() + TTL_MS,
    createdAt: Date.now(),
  });
}

/**
 * Invalidate a specific cache entry (e.g., on manual re-assess).
 */
export function invalidateCache(key) {
  store.delete(key);
}

/**
 * Invalidate by supplier name (convenience wrapper).
 */
export function invalidateByName(supplierName, deepSearch = false) {
  const key = computeCacheKey(supplierName, deepSearch);
  store.delete(key);
  return key;
}

/**
 * Cache stats — useful for a /api/cache-stats admin endpoint.
 */
export function getCacheStats() {
  const now = Date.now();
  let live = 0;
  let expired = 0;
  for (const [, v] of store) {
    if (now < v.expiresAt) live++;
    else expired++;
  }
  return {
    total: store.size,
    live,
    expired,
    ttlHours: TTL_MS / 3600000,
  };
}