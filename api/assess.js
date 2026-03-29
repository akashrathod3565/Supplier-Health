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
    // Four parallel searches for comprehensive coverage
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
            query: `${supplierName} revenue turnover annual report 2024 2025 financial results clients certifications`,
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

FINANCIALS, CLIENTS & NEWS:
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
        max_tokens: 3500,
        messages: [
          {
            role: 'system',
            content: `You are a senior procurement intelligence analyst with deep expertise in Indian and global corporate research.
The current year is ${currentYear}.

YOUR PRIMARY GOAL: Provide the MOST COMPLETE, information-rich supplier profile possible. Never leave a field empty if you have any knowledge about it.

KNOWLEDGE USAGE — CRITICAL RULES:
1. For LARGE/WELL-KNOWN companies (Fortune 500, BSE/NSE listed, major multinationals, large Indian corporates): USE YOUR TRAINING KNOWLEDGE FREELY AND CONFIDENTLY. You know Tata, Infosys, Reliance, Manpower, Bosch, etc. very well. Do not pretend otherwise.
2. For MEDIUM companies: Combine training knowledge with web search results.
3. For SMALL/MICRO suppliers: Use what you know, note limitations in summary only.
4. ALWAYS fill keyProducts — every company has products or services you know about.
5. ALWAYS fill boardMembers with at least the CEO/MD if the company is well-known.
6. ALWAYS fill headquarters — you know where major companies are based.
7. ALWAYS fill annualRevenue with an approximate figure and year for known companies.
8. Only write "Not found" for specific regulated fields (CIN, GST numbers) where accuracy is critical and you are genuinely uncertain.
9. NEVER invent specific CIN, GST, or phone numbers you are not certain of.
10. Use your training knowledge for website URLs, LinkedIn URLs, parent companies, certifications — you know these for major companies.`
          },
          {
            role: 'user',
            content: `Provide a comprehensive procurement intelligence report for: "${supplierName}"

WEB INTELLIGENCE (supplement with your own knowledge):
${recentContext}

Return ONLY this JSON — no markdown, no preamble:

{
  "supplierName": "Official full legal name",
  "country": "HQ country",
  "industry": "Detailed industry sector e.g. IT Services & Consulting",
  "founded": "Year founded",
  "employees": "Most recent headcount with year e.g. 3,35,000 (FY2024)",
  "headquarters": "City, State, Country — never leave blank for known companies",
  "registeredOffice": "Registered office address if Indian company",
  "cin": "Real CIN only if certain e.g. L17110MH1973PLC019786, else Not found",
  "website": "Official URL — you know this for major companies",
  "linkedin": "LinkedIn company page URL e.g. linkedin.com/company/xxx",
  "contactEmail": "Official contact email if known",
  "contactPhone": "Official phone if known",
  "parentCompany": "Parent company name if subsidiary, else Independent",
  "stockExchange": "BSE/NSE/NYSE/NASDAQ/LSE or Privately Held",
  "marketCap": "Market cap with year e.g. ₹45,000 Cr (2024), or Private",
  "annualRevenue": "Most recent revenue/turnover e.g. ₹92,000 Cr (FY2024) — estimate if needed for known companies",
  "supplierType": "Large Enterprise / SME / MSME / Micro Enterprise / Startup",
  "udyamNumber": "Udyam number if MSME Indian company, else N/A",
  "gstNumber": "GST number only if certain, else Not found",
  "certifications": ["ISO 9001:2015", "ISO 27001", "list all known certifications"],
  "keyProducts": ["Product or Service 1", "Product or Service 2", "Product or Service 3", "Product or Service 4"],
  "majorClients": ["Known major client 1", "Known major client 2", "Known major client 3"],
  "boardMembers": [
    { "name": "Full Name", "designation": "Title e.g. Managing Director & CEO" },
    { "name": "Full Name", "designation": "Title" },
    { "name": "Full Name", "designation": "Title" }
  ],
  "overallScore": <number 0-100>,
  "verdict": "APPROVED",
  "verdictReason": "One concise sentence explaining the verdict",
  "summary": "4-5 rich sentences: company background, financial health, market position, risk profile, procurement suitability.",
  "factors": [
    { "name": "Annual Turnover",    "icon": "💰", "value": "Revenue figure with year",       "detail": "Trend and source context",          "status": "green", "score": 85 },
    { "name": "Financial Health",   "icon": "📊", "value": "Strong / Stable / Weak",         "detail": "Balance sheet and profitability",   "status": "green", "score": 80 },
    { "name": "Credit Risk",        "icon": "🏦", "value": "Rating or risk assessment",      "detail": "Credit standing and payment history","status": "green", "score": 75 },
    { "name": "Legal & Compliance", "icon": "⚖️", "value": "Clean / Minor Issues / Issues", "detail": "Regulatory and legal status",        "status": "green", "score": 90 },
    { "name": "ESG Score",          "icon": "🌱", "value": "High / Medium / Low",            "detail": "ESG initiatives and commitments",   "status": "amber", "score": 60 },
    { "name": "Market Reputation",  "icon": "⭐", "value": "Strong / Good / Moderate",       "detail": "Brand standing and client feedback", "status": "green", "score": 88 }
  ],
  "news": [
    { "headline": "Relevant headline or known development", "source": "Publication · Year", "sentiment": "positive" },
    { "headline": "Another relevant headline",              "source": "Publication · Year", "sentiment": "neutral"  }
  ],
  "dataWarnings": []
}

Critical rules:
- verdict: APPROVED(65-100), CONDITIONAL(40-64), REJECTED(0-39)
- status: green, amber, or red only
- sentiment: positive, neutral, or negative only
- boardMembers: always include 2-4 real names for known companies
- certifications: always fill for known companies — you know which ones they hold
- keyProducts: MANDATORY — always at minimum 3 items
- dataWarnings: only add entries for truly critical missing regulated data; leave array empty if not needed
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