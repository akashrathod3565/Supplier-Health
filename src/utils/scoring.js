export const WEIGHTS = {
  'Financial Health':   { weight: 0.25, label: '25%' },
  'Annual Turnover':    { weight: 0.20, label: '20%' },
  'Credit Risk':        { weight: 0.20, label: '20%' },
  'Legal & Compliance': { weight: 0.20, label: '20%' },
  'Market Reputation':  { weight: 0.10, label: '10%' },
  'ESG Score':          { weight: 0.05, label: '5%'  }
}

export function calculateScore(factors) {
  let totalScore = 0
  let totalWeight = 0

  factors.forEach(factor => {
    const config = WEIGHTS[factor.name]
    if (config) {
      totalScore += factor.score * config.weight
      totalWeight += config.weight
    }
  })

  const finalScore = totalWeight > 0
    ? Math.round(totalScore / totalWeight)
    : Math.round(totalScore)

  return Math.min(100, Math.max(0, finalScore))
}

export function getVerdict(score) {
  if (score >= 65) return 'APPROVED'
  if (score >= 40) return 'CONDITIONAL'
  return 'REJECTED'
}

export function getScoreColor(score) {
  if (score >= 65) return 'var(--green)'
  if (score >= 40) return 'var(--amber)'
  return 'var(--red)'
}