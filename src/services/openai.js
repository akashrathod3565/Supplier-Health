// ══════════════════════════════════════════════════════════
// SUPPLIERIQ — CLIENT-SIDE SCORING & CREDIBILITY ENGINE
// ══════════════════════════════════════════════════════════

const WEIGHTS = {
  'Financial Health':   0.25,
  'Annual Turnover':    0.20,
  'Credit Risk':        0.20,
  'Legal & Compliance': 0.20,
  'Market Reputation':  0.10,
  'ESG Score':          0.05
}

export async function assessSupplier(supplierName) {
  const response = await fetch('/api/assess', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ supplierName })
  })

  const text = await response.text()
  if (!text || text.trim() === '') {
    throw new Error('Server returned empty response — likely a timeout. Please try again.')
  }

  let data
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error('Invalid response from server. Please try again.')
  }

  if (!response.ok) {
    throw new Error(data.error || 'Assessment failed')
  }

  // ── 1. Resolve sourceIndex into a lookup map: SRC01 → {url, title, domain}
  const sourceMap = {}
  ;(data.sourceIndex || []).forEach(s => { sourceMap[s.id] = s })
  data.sourceMap = sourceMap

  // ── 2. Client-side weighted scoring (overrides GPT's placeholder 0)
  const scored = calculateWeightedScore(data.factors)
  data.overallScore = scored.total
  data.scoreBreakdown = scored.breakdown

  // ── 3. Recalculate verdict from computed score
  data.verdict = deriveVerdict(data.overallScore)

  // ── 4. Normalize factor status to match computed scores
  data.factors = data.factors.map(f => ({
    ...f,
    status: scoreToStatus(f.score),
    // Resolve sourceId → full source object for display
    source: f.sourceId ? sourceMap[f.sourceId] : null
  }))

  // ── 5. Staleness: mark stale factors/fields (server sends staleFields array)
  const staleFieldNames = new Set((data.staleFields || []).map(s => s.field))
  data.hasStaleData = staleFieldNames.size > 0

  // ── 6. Unknown company detection — override alert if needed
  if (!data.reliabilityAlert && data.reliabilityTier === 'limited') {
    data.reliabilityAlert = 'LIMITED PUBLIC DATA: Manual verification strongly recommended before onboarding.'
  }
  if (!data.reliabilityAlert && data.reliabilityTier === 'unverifiable') {
    data.reliabilityAlert = 'INSUFFICIENT PUBLIC DATA: This assessment is largely estimated. Independent verification is mandatory.'
  }

  // ── 7. Resolve news URLs from sourceIndex
  data.news = (data.news || []).map(n => ({
    ...n,
    resolvedSource: n.sourceId ? sourceMap[n.sourceId] : null
  }))

  return data
}

// ── Weighted scoring ──────────────────────────────────────
function calculateWeightedScore(factors) {
  let totalScore = 0
  let totalWeight = 0
  const breakdown = []

  factors.forEach(factor => {
    const weight = WEIGHTS[factor.name]
    if (weight) {
      const contribution = factor.score * weight
      totalScore += contribution
      totalWeight += weight
      breakdown.push({
        name: factor.name,
        score: factor.score,
        weight,
        weightLabel: `${Math.round(weight * 100)}%`,
        contribution: Math.round(contribution)
      })
    }
  })

  const total = totalWeight > 0
    ? Math.round(totalScore / totalWeight)
    : Math.round(totalScore)

  return { total: Math.min(100, Math.max(0, total)), breakdown }
}

export function deriveVerdict(score) {
  if (score >= 65) return 'APPROVED'
  if (score >= 40) return 'CONDITIONAL'
  return 'REJECTED'
}

export function scoreToStatus(score) {
  if (score >= 65) return 'green'
  if (score >= 40) return 'amber'
  return 'red'
}

export { WEIGHTS, calculateWeightedScore }
