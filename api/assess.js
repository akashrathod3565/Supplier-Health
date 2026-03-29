export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { supplierName, deepSearch, uploadedText } = req.body
  if (!supplierName) {
    return res.status(400).json({ error: 'supplierName is required' })
  }

  const OPENAI_API_KEY = process.env.OPENAI_API_KEY
  const TAVILY_API_KEY = process.env.TAVILY_API_KEY

  // deepSearch toggle: 'advanced' gives richer results, 'basic' is faster
  const searchDepth = deepSearch ? 'advanced' : 'basic'
  // increase results from 5 → 10 for much better coverage
  const maxResults = deepSearch ? 10 : 7

  try {
    // ─── TAVILY: 5 parallel searches (was 4) ─────────────────────────────────
    let recentContext = ''
    let sourceIndex = []

    try {
      const [globalRes, indiaRes, leadershipRes, financialRes, registryRes] = await Promise.all([

        // 1. Global overview
        fetch('https://api.tavily.com/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            api_key: TAVILY_API_KEY,
            query: `${supplierName} company overview headquarters website employees founded history`,
            max_results: maxResults,
            search_depth: searchDepth,
            include_answer: true
          })
        }),

        // 2. India-specific
        fetch('https://api.tavily.com/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            api_key: TAVILY_API_KEY,
            query: `${supplierName} India CIN MCA GST registration address contact phone email`,
            max_results: maxResults,
            search_depth: searchDepth,
            include_answer: true
          })
        }),

        // 3. Leadership
        fetch('https://api.tavily.com/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            api_key: TAVILY_API_KEY,
            query: `${supplierName} CEO MD director board members leadership management team`,
            max_results: maxResults,
            search_depth: searchDepth,
            include_answer: true
          })
        }),

        // 4. Financials, compliance, red flags
        fetch('https://api.tavily.com/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            api_key: TAVILY_API_KEY,
            query: `${supplierName} revenue turnover annual report 2024 2025 financial results clients certifications fraud litigation blacklist`,
            max_results: maxResults,
            search_depth: searchDepth,
            include_answer: true
          })
        }),

        // 5. NEW — Indian registry deep dive: MCA21, Zauba, Screener, Tofler
        fetch('https://api.tavily.com/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            api_key: TAVILY_API_KEY,
            query: `"${supplierName}" site:zaubacorp.com OR site:screener.in OR site:tofler.in OR site:mca.gov.in CIN directors charges annual filing`,
            max_results: maxResults,
            search_depth: searchDepth,
            include_answer: true
          })
        })
      ])

      const [globalData, indiaData, leadershipData, financialData, registryData] = await Promise.all([
        globalRes.json(), indiaRes.json(), leadershipRes.json(), financialRes.json(), registryRes.json()
      ])

      // Build numbered source index
      let srcId = 1
      const buildSection = (data, sectionLabel) => {
        const answer = data.answer ? `Summary: ${data.answer}\n` : ''
        const lines = (data.results || []).slice(0, maxResults).map(r => {
          const id = `SRC${String(srcId).padStart(2, '0')}`
          let domain = r.url
          try { domain = new URL(r.url).hostname.replace('www.', '') } catch {}
          sourceIndex.push({ id, url: r.url, title: r.title, domain })
          srcId++
          return `[${id}] ${r.title} (${domain}): ${r.content?.slice(0, 400)}`
        }).join('\n')
        return `${sectionLabel}:\n${answer}${lines}`
      }

      recentContext = [
        buildSection(globalData,     'COMPANY OVERVIEW & HQ'),
        buildSection(indiaData,      'INDIA REGISTRY (MCA/GST/CIN)'),
        buildSection(leadershipData, 'LEADERSHIP & BOARD'),
        buildSection(financialData,  'FINANCIALS, CLIENTS, COMPLIANCE & RED FLAGS'),
        buildSection(registryData,   'REGISTRY DEEP DIVE (Zauba/Screener/Tofler/MCA21)')
      ].join('\n\n')

    } catch (e) {
      recentContext = 'Web search unavailable — using training knowledge only.'
    }

    // ─── If user uploaded a document, append it as context ───────────────────
    if (uploadedText && uploadedText.trim().length > 0) {
      recentContext += `\n\nUSER-UPLOADED DOCUMENT CONTEXT:\n${uploadedText.slice(0, 8000)}`
    }

    const currentYear = new Date().getFullYear()
    const staleYear = currentYear - 2

    const sourceIndexStr = sourceIndex.length > 0
      ? '\n\nSOURCE INDEX (use these IDs when citing):\n' +
        sourceIndex.map(s => `${s.id}: "${s.title}" — ${s.url}`).join('\n')
      : ''

    const gptRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_API_KEY}` },
      body: JSON.stringify({
        model: 'gpt-4o',
        temperature: 0.1,
        max_tokens: 5000,
        messages: [
          {
            role: 'system',
            content: `You are a senior procurement intelligence analyst. The current year is ${currentYear}.

═══════════════════════════════════════════════════════════════
CREDIBILITY FRAMEWORK — 5 MANDATORY SYSTEMS (follow ALL of them)
═══════════════════════════════════════════════════════════════

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SYSTEM 1 — SOURCE CITATIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Every field or factor that uses data from the web search results MUST cite the source by its SRCxx ID.
Set "sourceId": "SRCxx" when a web result informed the value.
Set "sourceId": null when data comes solely from training knowledge.

You now have a dedicated REGISTRY DEEP DIVE section from Zauba, Screener, Tofler and MCA21.
Prioritise data from these registry sources for CIN, GST, directors, charges and annual filings.
These registry sources carry the highest credibility for Indian company data.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SYSTEM 2 — CONFIDENCE SCORING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Assign a "confidence" field to EVERY data field and factor:
  "high"   = confirmed by a web search result (sourceId present)
  "medium" = from training knowledge, likely accurate for large/well-known/listed companies
  "low"    = estimated, inferred, uncertain, or no public data found

Hard rules:
- CIN, GST, phone numbers → confidence "high" ONLY if found in a web result. Otherwise value="Not found", confidence="low"
- Revenue for private/unlisted SMEs → confidence "low" unless a web result confirms it
- Board members for small unknown companies → confidence "low" unless in web results
- Registry sources (Zauba, Screener, Tofler, MCA21) count as "high" confidence

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SYSTEM 3 — PRIMARY SOURCE VERIFY LINKS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Always populate verifyLinks with authoritative government/exchange portals:
  - MCA21: https://www.mca.gov.in/mcafoportal/viewCompanyMasterData.do
  - GST: https://services.gst.gov.in/services/searchtp
  - Zauba: https://www.zaubacorp.com/company-search
  - Screener: https://www.screener.in
  - Tofler: https://www.tofler.in
For listed companies add BSE and NSE links.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SYSTEM 4 — STALENESS DETECTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
For every financial/numerical field, extract the data year into a "*DataYear" field.
A field is STALE if its dataYear < ${staleYear}.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SYSTEM 5 — UNKNOWN COMPANY DETECTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Set "reliabilityTier": "verified" | "partial" | "limited" | "unverifiable"
Set "reliabilityAlert" appropriately based on tier.

═══════════════════════════════════════════════════════════════
MULTI-LAYER RUBRIC SCORING
═══════════════════════════════════════════════════════════════

LAYER 1 — BANDS:
  Annual Turnover:    80-100 >₹1000Cr/$120M+ | 60-79 ₹250-1000Cr | 40-59 ₹10-250Cr | 0-39 <₹10Cr
  Financial Health:   80-100 Profitable, low debt | 60-79 Stable | 40-59 Break-even | 0-39 Losses/insolvency
  Credit Risk:        80-100 AAA/AA, zero defaults | 60-79 A/BBB | 40-59 BB | 0-39 B/C/D or NPA
  Legal & Compliance: 80-100 Clean, all filings | 60-79 Minor historical | 40-59 Pending | 0-39 Active cases
  ESG Score:          80-100 ESG report + net-zero | 60-79 Active CSR | 40-59 Basic only | 0-39 Violations
  Market Reputation:  80-100 Industry leader | 60-79 Well-known | 40-59 Mixed | 0-39 Damaged

LAYER 2 — RED FLAG PENALTIES:
  Bankruptcy/insolvency → −30 Financial Health
  Fraud/criminal investigation → −25 Legal & Compliance
  Government blacklisted → −40 Legal & Compliance
  Major SEBI/MCA violations → −20 Legal & Compliance
  Unexplained leadership exits → −10 Market Reputation
  NPA bank classification → −20 Credit Risk
  Environmental violations → −15 ESG Score
  Active fraud complaints → −15 Market Reputation

LAYER 3 — TRUST BONUSES:
  BSE/NSE/NYSE/NASDAQ listed → +5 Financial Health
  Each ISO certification → +3 Legal & Compliance (max +10)
  20+ years in business → +5 Market Reputation
  Fortune 500/Nifty 50 clients → +5 Market Reputation
  Published annual report (last 2 yrs) → +3 Financial Health
  MSME Udyam registered → +3 Legal & Compliance`
          },
          {
            role: 'user',
            content: `Assess supplier: "${supplierName}"

WEB SEARCH RESULTS (5 parallel searches including registry deep dive):
${recentContext}
${sourceIndexStr}

${uploadedText ? `\nNOTE: The user has also uploaded a document with supplier information. Treat this as high-confidence primary source data and prioritise it over web search results where they conflict.\n` : ''}

Return ONLY valid JSON matching this exact structure. No markdown. No extra text:

{
  "supplierName": "Official legal name",
  "country": "HQ country",
  "industry": "Industry sector",
  "founded": "Year",
  "employees": "Count with year",
  "employeesDataYear": null,
  "headquarters": "City, State, Country",
  "registeredOffice": "Address or Not found",
  "cin": "CIN or Not found",
  "cinConfidence": "high|low",
  "cinSourceId": null,
  "website": "URL",
  "linkedin": "URL",
  "contactEmail": "Email or Not found",
  "contactPhone": "Phone or Not found",
  "parentCompany": "Parent or Independent",
  "stockExchange": "Exchange or Privately Held",
  "marketCap": "Value with year or Private",
  "marketCapDataYear": null,
  "annualRevenue": "Value with FY year",
  "annualRevenueDataYear": null,
  "annualRevenueSourceId": null,
  "annualRevenueConfidence": "high|medium|low",
  "supplierType": "Large Enterprise|SME|MSME|Micro Enterprise|Startup",
  "udyamNumber": "Number or N/A",
  "gstNumber": "GST or Not found",
  "gstConfidence": "high|low",
  "gstSourceId": null,
  "charges": "Active charges / liens or None found",
  "chargesSourceId": null,
  "lastFilingDate": "Date or Not found",
  "lastFilingSourceId": null,
  "certifications": [],
  "keyProducts": [],
  "majorClients": [],
  "boardMembers": [
    { "name": "Name", "designation": "Title", "confidence": "high|medium|low", "sourceId": null }
  ],
  "verifyLinks": [
    { "label": "Verify on MCA21", "url": "https://www.mca.gov.in/mcafoportal/viewCompanyMasterData.do", "description": "Check CIN, directors and filing status" },
    { "label": "GST Verification", "url": "https://services.gst.gov.in/services/searchtp", "description": "Verify GSTIN registration and status" },
    { "label": "Company Search (Zauba)", "url": "https://www.zaubacorp.com/company-search", "description": "Cross-check directors, charges and financials" },
    { "label": "Screener.in", "url": "https://www.screener.in", "description": "Financial ratios, P&L, balance sheet" },
    { "label": "Tofler", "url": "https://www.tofler.in", "description": "MCA filings, annual returns, charges" }
  ],
  "reliabilityTier": "verified|partial|limited|unverifiable",
  "reliabilityAlert": null,
  "lowConfidenceFieldCount": 0,
  "redFlags": [],
  "trustBonuses": [],
  "overallScore": 0,
  "verdict": "APPROVED",
  "verdictReason": "One sentence",
  "summary": "4-5 sentences",
  "factors": [
    {
      "name": "Annual Turnover",
      "icon": "💰",
      "value": "Revenue figure",
      "detail": "Band, reason, adjustments applied",
      "status": "green",
      "score": 85,
      "band": "80-100",
      "bandReason": "Why this band",
      "confidence": "high|medium|low",
      "sourceId": null,
      "penalties": [],
      "bonuses": []
    },
    {
      "name": "Financial Health",
      "icon": "📊",
      "value": "Strong|Stable|Weak",
      "detail": "Band and adjustments",
      "status": "green",
      "score": 80,
      "band": "80-100",
      "bandReason": "Why",
      "confidence": "high|medium|low",
      "sourceId": null,
      "penalties": [],
      "bonuses": []
    },
    {
      "name": "Credit Risk",
      "icon": "🏦",
      "value": "Rating",
      "detail": "Band and adjustments",
      "status": "green",
      "score": 75,
      "band": "60-79",
      "bandReason": "Why",
      "confidence": "high|medium|low",
      "sourceId": null,
      "penalties": [],
      "bonuses": []
    },
    {
      "name": "Legal & Compliance",
      "icon": "⚖️",
      "value": "Clean|Minor|Issues",
      "detail": "Band and adjustments",
      "status": "green",
      "score": 90,
      "band": "80-100",
      "bandReason": "Why",
      "confidence": "high|medium|low",
      "sourceId": null,
      "penalties": [],
      "bonuses": []
    },
    {
      "name": "ESG Score",
      "icon": "🌱",
      "value": "High|Medium|Low",
      "detail": "Band and adjustments",
      "status": "amber",
      "score": 60,
      "band": "60-79",
      "bandReason": "Why",
      "confidence": "high|medium|low",
      "sourceId": null,
      "penalties": [],
      "bonuses": []
    },
    {
      "name": "Market Reputation",
      "icon": "⭐",
      "value": "Strong|Good|Moderate",
      "detail": "Band and adjustments",
      "status": "green",
      "score": 88,
      "band": "80-100",
      "bandReason": "Why",
      "confidence": "high|medium|low",
      "sourceId": null,
      "penalties": [],
      "bonuses": []
    }
  ],
  "news": [
    { "headline": "Headline", "source": "Publication · Year", "sentiment": "positive|neutral|negative", "sourceId": null, "url": null }
  ],
  "dataWarnings": []
}

Rules:
- overallScore = 0 always (client calculates)
- verdict = APPROVED always (client recalculates)
- status: green(≥65), amber(40-64), red(<40)
- NEVER invent CIN, GST, or phone numbers
- Populate charges and lastFilingDate from registry search results where available
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

    result.sourceIndex = sourceIndex
    result.deepSearch = !!deepSearch
    result.hasUploadedDoc = !!(uploadedText && uploadedText.trim().length > 0)

    // Staleness detection
    const staleYear2 = currentYear - 2
    const staleFields = []
    if (result.annualRevenueDataYear && result.annualRevenueDataYear < staleYear2)
      staleFields.push({ field: 'Annual Revenue', dataYear: result.annualRevenueDataYear })
    if (result.employeesDataYear && result.employeesDataYear < staleYear2)
      staleFields.push({ field: 'Employees', dataYear: result.employeesDataYear })
    if (result.marketCapDataYear && result.marketCapDataYear < staleYear2)
      staleFields.push({ field: 'Market Cap', dataYear: result.marketCapDataYear })
    result.staleFields = staleFields

    return res.status(200).json(result)

  } catch (err) {
    console.error('Error:', err.message)
    return res.status(500).json({ error: err.message })
  }
}