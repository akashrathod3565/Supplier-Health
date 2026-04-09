/**
 * /api/cache-stats.js — Admin endpoint to inspect cache state
 *
 * GET  /api/cache-stats
 *   Returns live cache statistics.
 *
 * DELETE /api/cache-stats?key=<sha256>
 *   Invalidates a specific cache entry (force re-assessment).
 *
 * DELETE /api/cache-stats?supplier=<name>
 *   Invalidates by supplier name (auto-computes key).
 */

import { getCacheStats, invalidateCache, invalidateByName } from "./cache.js";

export default function handler(req, res) {
  if (req.method === "GET") {
    return res.status(200).json({
      message: "Supplier assessment cache statistics",
      ...getCacheStats(),
      note: "Cache persists across warm lambda restarts. Cold starts reset cache.",
    });
  }

  if (req.method === "DELETE") {
    const { key, supplier } = req.query;

    if (supplier) {
      const invalidatedKey = invalidateByName(supplier);
      return res.status(200).json({
        message: "Cache entry invalidated by supplier name",
        supplier,
        key: invalidatedKey,
      });
    }

    if (key) {
      invalidateCache(key);
      return res.status(200).json({ message: "Cache entry invalidated", key });
    }

    return res
      .status(400)
      .json({ error: "Provide either key= or supplier= query param" });
  }

  return res.status(405).json({ error: "Method not allowed" });
}