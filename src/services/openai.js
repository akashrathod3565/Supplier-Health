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
  } catch (e) {
    throw new Error('Invalid response from server. Please try again.')
  }

  if (!response.ok) {
    throw new Error(data.error || 'Assessment failed')
  }

  // Calculate overall score from weighted factors
  data.overallScore = calculateScore(data.factors)

  // Derive verdict from calculated score
  if (data.overallScore >= 65) {
    data.verdict = 'APPROVED'
  } else if (data.overallScore >= 40) {
    data.verdict = 'CONDITIONAL'
  } else {
    data.verdict = 'REJECTED'
  }

  return data
}

// Weighted scoring engine
function calculateScore(factors) {
  const weights = {
    'Financial Health':   0.25,
    'Annual Turnover':    0.20,
    'Credit Risk':        0.20,
    'Legal & Compliance': 0.20,
    'Market Reputation':  0.10,
    'ESG Score':          0.05
  }

  let totalScore = 0
  let totalWeight = 0

  factors.forEach(factor => {
    const weight = weights[factor.name]
    if (weight) {
      totalScore += factor.score * weight
      totalWeight += weight
    }
  })

  // If weights don't add up to 1, normalize
  const finalScore = totalWeight > 0
    ? Math.round(totalScore / totalWeight)
    : Math.round(totalScore)

  return Math.min(100, Math.max(0, finalScore))
}