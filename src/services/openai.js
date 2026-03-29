const WEIGHTS = {
  'Financial Health':   0.25,
  'Annual Turnover':    0.20,
  'Credit Risk':        0.20,
  'Legal & Compliance': 0.20,
  'Market Reputation':  0.10,
  'ESG Score':          0.05
}

export async function assessSupplier(supplierName, deepSearch = false, uploadedText = null) {
  const response = await fetch('/api/assess', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ supplierName, deepSearch, uploadedText })
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

  // Resolve sourceIndex into lookup map
  const sourceMap = {}
  ;(data.sourceIndex || []).forEach(s => { sourceMap[s.id] = s })
  data.sourceMap = sourceMap

  // Client-side weighted scoring
  const scored = calculateWeightedScore(data.factors)
  data.overallScore = scored.total
  data.scoreBreakdown = scored.breakdown

  // Recalculate verdict
  data.verdict = deriveVerdict(data.overallScore)

  // Normalize factor status
  data.factors = data.factors.map(f => ({
    ...f,
    status: scoreToStatus(f.score),
    source: f.sourceId ? sourceMap[f.sourceId] : null
  }))

  // Staleness flags
  const staleFieldNames = new Set((data.staleFields || []).map(s => s.field))
  data.hasStaleData = staleFieldNames.size > 0

  // Unknown company detection
  if (!data.reliabilityAlert && data.reliabilityTier === 'limited') {
    data.reliabilityAlert = 'LIMITED PUBLIC DATA: Manual verification strongly recommended before onboarding.'
  }
  if (!data.reliabilityAlert && data.reliabilityTier === 'unverifiable') {
    data.reliabilityAlert = 'INSUFFICIENT PUBLIC DATA: This assessment is largely estimated. Independent verification is mandatory.'
  }

  // Resolve news URLs
  data.news = (data.news || []).map(n => ({
    ...n,
    resolvedSource: n.sourceId ? sourceMap[n.sourceId] : null
  }))

  return data
}

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