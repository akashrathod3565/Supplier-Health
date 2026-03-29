// ══════════════════════════════════════════════
// MULTI-LAYER RUBRIC SCORING SYSTEM
// ══════════════════════════════════════════════

export const WEIGHTS = {
  'Financial Health':   { weight: 0.25, label: '25%' },
  'Annual Turnover':    { weight: 0.20, label: '20%' },
  'Credit Risk':        { weight: 0.20, label: '20%' },
  'Legal & Compliance': { weight: 0.20, label: '20%' },
  'Market Reputation':  { weight: 0.10, label: '10%' },
  'ESG Score':          { weight: 0.05, label: '5%'  }
}

// Layer 1: Rubric bands per factor (for display in UI)
export const RUBRIC_BANDS = {
  'Annual Turnover': [
    { band: '80–100', label: 'Strong',   threshold: '>₹1000 Cr / $120M+',     color: 'var(--green)' },
    { band: '60–79',  label: 'Good',     threshold: '₹250–1000 Cr / $30–120M', color: 'var(--green)' },
    { band: '40–59',  label: 'Moderate', threshold: '₹10–250 Cr / $1.2–30M',  color: 'var(--amber)' },
    { band: '0–39',   label: 'Weak',     threshold: '<₹10 Cr or pre-revenue',  color: 'var(--red)'   }
  ],
  'Financial Health': [
    { band: '80–100', label: 'Strong',   threshold: 'Profitable, low debt, growing',          color: 'var(--green)' },
    { band: '60–79',  label: 'Stable',   threshold: 'Stable profit, moderate debt',           color: 'var(--green)' },
    { band: '40–59',  label: 'At Risk',  threshold: 'Break-even or mild losses',              color: 'var(--amber)' },
    { band: '0–39',   label: 'Distress', threshold: 'Recurring losses, high debt, insolvency', color: 'var(--red)'  }
  ],
  'Credit Risk': [
    { band: '80–100', label: 'Excellent', threshold: 'AAA/AA rated, zero defaults',           color: 'var(--green)' },
    { band: '60–79',  label: 'Good',      threshold: 'A/BBB rated, minor delays',             color: 'var(--green)' },
    { band: '40–59',  label: 'Moderate',  threshold: 'BB rated, occasional issues',           color: 'var(--amber)' },
    { band: '0–39',   label: 'High Risk', threshold: 'B/C/D or active defaults, NPA risk',    color: 'var(--red)'   }
  ],
  'Legal & Compliance': [
    { band: '80–100', label: 'Clean',    threshold: 'All filings current, no litigation',      color: 'var(--green)' },
    { band: '60–79',  label: 'Minor',    threshold: 'Historical issues only, mostly compliant', color: 'var(--green)' },
    { band: '40–59',  label: 'Pending',  threshold: 'Pending filings or minor disputes',       color: 'var(--amber)' },
    { band: '0–39',   label: 'Serious',  threshold: 'Active cases, major violations, blacklisted', color: 'var(--red)' }
  ],
  'ESG Score': [
    { band: '80–100', label: 'Leader',   threshold: 'ESG report, net-zero, BRSR compliant',   color: 'var(--green)' },
    { band: '60–79',  label: 'Active',   threshold: 'CSR programs, some ESG reporting',        color: 'var(--green)' },
    { band: '40–59',  label: 'Basic',    threshold: 'Statutory compliance only',               color: 'var(--amber)' },
    { band: '0–39',   label: 'Poor',     threshold: 'Violations on record',                    color: 'var(--red)'   }
  ],
  'Market Reputation': [
    { band: '80–100', label: 'Leader',   threshold: 'Industry leader, Fortune 500 clients',   color: 'var(--green)' },
    { band: '60–79',  label: 'Strong',   threshold: 'Well-known, positive standing',           color: 'var(--green)' },
    { band: '40–59',  label: 'Mixed',    threshold: 'Mixed reviews, regional known',           color: 'var(--amber)' },
    { band: '0–39',   label: 'Damaged',  threshold: 'Active reputational damage',              color: 'var(--red)'   }
  ]
}

// Layer 2: Red flag penalty definitions (for UI display)
export const RED_FLAG_PENALTIES = [
  { trigger: 'Bankruptcy/insolvency',         factor: 'Financial Health',   penalty: -30 },
  { trigger: 'Fraud/criminal investigation',  factor: 'Legal & Compliance', penalty: -25 },
  { trigger: 'Government blacklisted',        factor: 'Legal & Compliance', penalty: -40 },
  { trigger: 'Major compliance violations',   factor: 'Legal & Compliance', penalty: -20 },
  { trigger: 'Unexpected leadership exits',   factor: 'Market Reputation',  penalty: -10 },
  { trigger: 'NPA bank classification',       factor: 'Credit Risk',        penalty: -20 },
  { trigger: 'Environmental/safety violations', factor: 'ESG Score',        penalty: -15 },
  { trigger: 'Active customer fraud complaints', factor: 'Market Reputation', penalty: -15 }
]

// Layer 3: Trust bonus definitions (for UI display)
export const TRUST_BONUSES = [
  { trigger: 'BSE/NSE/NYSE/NASDAQ listed',    factor: 'Financial Health',   bonus: +5  },
  { trigger: 'Each ISO certification',        factor: 'Legal & Compliance', bonus: +3  },
  { trigger: '20+ years in business',         factor: 'Market Reputation',  bonus: +5  },
  { trigger: 'Fortune 500/Nifty 50 clients',  factor: 'Market Reputation',  bonus: +5  },
  { trigger: 'Published annual report',       factor: 'Financial Health',   bonus: +3  },
  { trigger: 'MSME Udyam registered',         factor: 'Legal & Compliance', bonus: +3  }
]

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

export function getBandForScore(score) {
  if (score >= 80) return { label: 'Strong', color: 'var(--green)' }
  if (score >= 60) return { label: 'Good',   color: 'var(--green)' }
  if (score >= 40) return { label: 'Moderate', color: 'var(--amber)' }
  return { label: 'Weak', color: 'var(--red)' }
}
