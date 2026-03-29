export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { supplierName } = req.body
  if (!supplierName) {
    return res.status(400).json({ error: 'supplierName is required' })
  }

  const OPENAI_API_KEY = process.env.OPENAI_API_KEY
  const TAVILY_API_KEY = process.env.TAVILY_API_KEY

  try {
    let recentContext = ''
    try {
      const [globalRes, indiaRes, leadershipRes, financialRes] = await Promise.all([
        fetch('https://api.tavily.com/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            api_key: TAVILY_API_KEY,
            query: `${supplierName} company overview headquarters website employees founded history`,
            max_results: 5,
            search_depth: 'basic',
            include_answer: true
          })
        }),
        fetch('https://api.tavily.com/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            api_key: TAVILY_API_KEY,
            query: `${supplierName} India CIN MCA GST registration address contact phone email`,
            max_results: 5,
            search_depth: 'basic',
            include_answer: true
          })
        }),
        fetch('https://api.tavily.com/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            api_key: TAVILY_API_KEY,
            query: `${supplierName} CEO MD director board members leadership management team`,
            max_results: 5,
            search_depth: 'basic',
            include_answer: true
          })
        }),
        fetch('https://api.tavily.com/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            api_key: TAVILY_API_KEY,
            query: `${supplierName} revenue turnover annual report 2024 2025 financial results clients certifications fraud litigation blacklist`,
            max_results: 5,
            search_depth: 'basic',
            include_answer: true
          })
        })
      ])

      const [globalData, indiaData, leadershipData, financialData] = await Promise.all([
        globalRes.json(),
        indiaRes.json(),
        leadershipRes.json(),
        financialRes.json()
      ])

      const extractContext = (data) => {
        const answer = data.answer ? `Summary: ${data.answer}\n` : ''
        const headlines = (data.results || [])
          .slice(0, 5)
          .map(r => `- ${r.title}: ${r.content?.slice(0, 350)}`)
          .join('\n')
        return answer + headlines
      }

      recentContext = `
COMPANY OVERVIEW & HQ:
${extractContext(globalData)}

INDIA REGISTRY (MCA/GST/CIN):
${extractContext(indiaData)}

LEADERSHIP & BOARD:
${extractContext(leadershipData)}

FINANCIALS, CLIENTS, COMPLIANCE & RED FLAGS:
${extractContext(financialData)}
      `.trim()

    } catch (e) {
      recentContext = 'Web search unavailable — using training knowledge only.'
    }

    const currentYear = new Date().getFullYear()

    const gptRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        temperature: 0.1,
        max_tokens: 4000,
        messages: [
          {
            role: 'system',
            content: `You are a senior procurement intelligence analyst. The current year is ${currentYear}.

══════════════════════════════════════════════
MULTI-LAYER RUBRIC SCORING SYSTEM
══════════════════════════════════════════════

You must score each factor using the rubric bands below. Do NOT guess numbers — classify into the correct band then assign a score within that band.

─────────────────────────────────────────────
LAYER 1 — RUBRIC BANDS (India-context thresholds)
─────────────────────────────────────────────

ANNUAL TURNOVER:
  Band 80–100 (STRONG):   >₹1000 Cr annual revenue / $120M+ global
  Band 60–79  (GOOD):     ₹250–1000 Cr / $30M–$120M
  Band 40–59  (MODERATE): ₹10–250 Cr / $1.2M–$30M
  Band 0–39   (WEAK):     <₹10 Cr / <$1.2M or startup with no revenue

FINANCIAL HEALTH:
  Band 80–100: Profitable multi-year, low debt-to-equity (<0.5), positive cash flow, growing
  Band 60–79:  Stable profit, moderate debt (0.5–1.5), flat growth acceptable
  Band 40–59:  Break-even or mild losses, higher debt (1.5–3.0), restructuring possible
  Band 0–39:   Recurring losses, very high debt (>3.0), negative equity, insolvency risk

CREDIT RISK:
  Band 80–100: AAA/AA rated, zero payment defaults, clean banking history
  Band 60–79:  A/BBB rated, minor payment delays, manageable obligations
  Band 40–59:  BB rated, occasional issues, some overdue payments
  Band 0–39:   B/C/D rated or unrated with active defaults, NPA classification risk

LEGAL & COMPLIANCE:
  Band 80–100: Clean record, all MCA/GST filings current, no litigation, full certifications
  Band 60–79:  Minor historical issues, no active cases, mostly compliant
  Band 40–59:  Pending filings, minor disputes, some regulatory notices
  Band 0–39:   Active legal cases, major violations, government show-cause notices, blacklisted

ESG SCORE:
  Band 80–100: Published ESG/sustainability report, net-zero commitment, BRSR compliant
  Band 60–79:  Active CSR programs, some ESG reporting, decent environmental track record
  Band 40–59:  Basic statutory compliance only, no voluntary ESG initiatives
  Band 0–39:   Environmental violations, labour issues, poor governance on record

MARKET REPUTATION:
  Band 80–100: Industry leader, Fortune 500/Nifty 50 clients, multiple industry awards
  Band 60–79:  Well-known in sector, positive client feedback, stable brand presence
  Band 40–59:  Mixed market reviews, some negative press, regional known only
  Band 0–39:   Active reputational damage, public controversies, negative media coverage

─────────────────────────────────────────────
LAYER 2 — RED FLAG PENALTIES (you MUST check these)
─────────────────────────────────────────────
These are DEDUCTIONS from the base rubric score:
  • Bankruptcy / insolvency proceedings:       −30 points on Financial Health
  • Fraud / criminal investigation:            −25 points on Legal & Compliance
  • Government blacklisted / debarred:         −40 points on Legal & Compliance
  • Major compliance violations (SEBI/MCA):    −20 points on Legal & Compliance
  • Sudden unexplained leadership exits:       −10 points on Market Reputation
  • NPA classification by any bank:            −20 points on Credit Risk
  • Environmental/safety violations:           −15 points on ESG Score
  • Active customer fraud complaints:          −15 points on Market Reputation

─────────────────────────────────────────────
LAYER 3 — TRUST BONUSES (additive, cap each factor at 100)
─────────────────────────────────────────────
  • BSE/NSE/NYSE/NASDAQ listed:                +5 to Financial Health
  • Each ISO certification:                    +3 to Legal & Compliance (max +10)
  • 20+ years in business:                     +5 to Market Reputation
  • Fortune 500 / Nifty 50 client base:        +5 to Market Reputation
  • Published annual report (last 2 years):    +3 to Financial Health
  • MSME Udyam registered:                     +3 to Legal & Compliance

─────────────────────────────────────────────
SCORING WORKFLOW (follow in order):
─────────────────────────────────────────────
1. Classify company into rubric band for each factor → assign mid-band score
2. Apply any Layer 2 red flag deductions (subtract from that factor's score)
3. Apply any Layer 3 trust bonuses (add to that factor's score, cap at 100)
4. Report final score per factor in the "score" field
5. In the "detail" field, explain: which band, why, any penalties/bonuses applied

IMPORTANT RULES:
- For LARGE/WELL-KNOWN companies: use your training knowledge freely and confidently
- For MEDIUM companies: combine training knowledge with web search results
- For UNKNOWN/SMALL: use web context + make conservative estimates
- NEVER invent specific CIN, GST, or phone numbers you are not certain of
- ALWAYS fill keyProducts — every company has products or services
- Red flag penalties make scores go BELOW the band floor — that is correct and expected`
          },
          {
            role: 'user',
            content: `Provide a comprehensive procurement intelligence report for: "${supplierName}"

WEB INTELLIGENCE (supplement with your own knowledge):
${recentContext}

Apply the multi-layer rubric scoring system exactly as instructed. Return ONLY this JSON — no markdown, no preamble:

{
  "supplierName": "Official full legal name",
  "country": "HQ country",
  "industry": "Detailed industry sector e.g. IT Services & Consulting",
  "founded": "Year founded",
  "employees": "Most recent headcount with year e.g. 3,35,000 (FY2024)",
  "headquarters": "City, State, Country — never leave blank for known companies",
  "registeredOffice": "Registered office address if Indian company",
  "cin": "Real CIN only if certain e.g. L17110MH1973PLC019786, else Not found",
  "website": "Official URL",
  "linkedin": "LinkedIn company page URL",
  "contactEmail": "Official contact email if known",
  "contactPhone": "Official phone if known",
  "parentCompany": "Parent company name if subsidiary, else Independent",
  "stockExchange": "BSE/NSE/NYSE/NASDAQ/LSE or Privately Held",
  "marketCap": "Market cap with year e.g. ₹45,000 Cr (2024), or Private",
  "annualRevenue": "Most recent revenue/turnover e.g. ₹92,000 Cr (FY2024)",
  "supplierType": "Large Enterprise / SME / MSME / Micro Enterprise / Startup",
  "udyamNumber": "Udyam number if MSME Indian company, else N/A",
  "gstNumber": "GST number only if certain, else Not found",
  "certifications": ["ISO 9001:2015", "list all known certifications"],
  "keyProducts": ["Product or Service 1", "Product or Service 2", "Product or Service 3"],
  "majorClients": ["Known major client 1", "Known major client 2"],
  "boardMembers": [
    { "name": "Full Name", "designation": "Title e.g. Managing Director & CEO" }
  ],
  "redFlags": [],
  "trustBonuses": [],
  "overallScore": 0,
  "verdict": "APPROVED",
  "verdictReason": "One concise sentence explaining the verdict",
  "summary": "4-5 rich sentences: company background, financial health, market position, risk profile, procurement suitability.",
  "factors": [
    {
      "name": "Annual Turnover",
      "icon": "💰",
      "value": "Revenue figure with year",
      "detail": "Band classification, reason, any penalties/bonuses applied",
      "status": "green",
      "score": 85,
      "band": "80-100",
      "bandReason": "Why this band was selected",
      "penalties": [],
      "bonuses": []
    },
    {
      "name": "Financial Health",
      "icon": "📊",
      "value": "Strong / Stable / Weak",
      "detail": "Band classification and adjustments",
      "status": "green",
      "score": 80,
      "band": "80-100",
      "bandReason": "Why this band",
      "penalties": [],
      "bonuses": []
    },
    {
      "name": "Credit Risk",
      "icon": "🏦",
      "value": "Rating or risk assessment",
      "detail": "Band and adjustments",
      "status": "green",
      "score": 75,
      "band": "60-79",
      "bandReason": "Why this band",
      "penalties": [],
      "bonuses": []
    },
    {
      "name": "Legal & Compliance",
      "icon": "⚖️",
      "value": "Clean / Minor Issues / Issues",
      "detail": "Band and adjustments",
      "status": "green",
      "score": 90,
      "band": "80-100",
      "bandReason": "Why this band",
      "penalties": [],
      "bonuses": []
    },
    {
      "name": "ESG Score",
      "icon": "🌱",
      "value": "High / Medium / Low",
      "detail": "Band and adjustments",
      "status": "amber",
      "score": 60,
      "band": "60-79",
      "bandReason": "Why this band",
      "penalties": [],
      "bonuses": []
    },
    {
      "name": "Market Reputation",
      "icon": "⭐",
      "value": "Strong / Good / Moderate",
      "detail": "Band and adjustments",
      "status": "green",
      "score": 88,
      "band": "80-100",
      "bandReason": "Why this band",
      "penalties": [],
      "bonuses": []
    }
  ],
  "news": [
    { "headline": "Relevant headline or known development", "source": "Publication · Year", "sentiment": "positive" },
    { "headline": "Another relevant headline", "source": "Publication · Year", "sentiment": "neutral" }
  ],
  "dataWarnings": []
}

Critical rules:
- overallScore: set to 0, the client will calculate it from factors
- verdict: set to APPROVED, the client will recalculate
- status: green (score≥65), amber (score 40-64), red (score<40)
- sentiment: positive, neutral, or negative only
- redFlags: array of strings describing any red flags found e.g. ["Active litigation in NCLT", "GST cancellation notice 2023"]
- trustBonuses: array of strings describing bonuses applied e.g. ["BSE listed: +5 to Financial Health", "ISO 9001: +3 to Legal & Compliance"]
- penalties/bonuses in each factor: arrays of strings e.g. ["−20: Major SEBI compliance violation"]
- boardMembers: always include 2-4 real names for known companies
- Return ONLY valid JSON`
          }
        ]
      })
    })

    if (!gptRes.ok) {
      const err = await gptRes.json()
      throw new Error(err.error?.message || 'OpenAI API error')
    }

    const gptData = await gptRes.json()
    const rawText = gptData.choices[0].message.content
    const cleaned = rawText.replace(/```json|```/g, '').trim()
    const result = JSON.parse(cleaned)
    return res.status(200).json(result)

  } catch (err) {
    console.error('Error:', err.message)
    return res.status(500).json({ error: err.message })
  }
}