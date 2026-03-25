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
    // Two parallel searches — global + India specific
    let recentContext = ''
    try {
      const [globalRes, indiaRes] = await Promise.all([
        fetch('https://api.tavily.com/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            api_key: TAVILY_API_KEY,
            query: `${supplierName} 2024 2025 revenue employees news financial results`,
            max_results: 3,
            search_depth: 'basic',
            include_answer: true
          })
        }),
        fetch('https://api.tavily.com/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            api_key: TAVILY_API_KEY,
            query: `${supplierName} India MCA CIN Udyam MSME GST director registration`,
            max_results: 3,
            search_depth: 'basic',
            include_answer: true
          })
        })
      ])

      const [globalData, indiaData] = await Promise.all([
        globalRes.json(),
        indiaRes.json()
      ])

      const extractContext = (data) => {
        const answer = data.answer ? `Summary: ${data.answer}\n` : ''
        const headlines = (data.results || [])
          .slice(0, 3)
          .map(r => `- ${r.title}: ${r.content?.slice(0, 200)}`)
          .join('\n')
        return answer + headlines
      }

      recentContext = `
GLOBAL SEARCH RESULTS:
${extractContext(globalData)}

INDIA REGISTRY SEARCH (MCA/MSME/GST):
${extractContext(indiaData)}
      `.trim()

    } catch (e) {
      recentContext = 'Web search unavailable — using knowledge base only.'
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
        max_tokens: 2000,
        messages: [
          {
            role: 'system',
            content: `You are a senior procurement risk analyst specializing in Indian and global supplier due diligence.
The current year is ${currentYear}.
You have deep knowledge of Indian companies — large corporates, MSMEs, and micro suppliers.
You know MCA21, Udyam MSME portal, GST registration, and Indian company law.

HONESTY RULES — STRICTLY FOLLOW:
- NEVER invent CIN numbers, GST numbers, phone numbers, emails, or financial figures
- NEVER fabricate board member names you are not certain about
- If a field is unknown, write exactly: "Not found"
- If data is partial or uncertain, write: "Unverified — [what you know]"
- For small/micro suppliers with limited public data, lower confidence scores accordingly
- Always mention the source year next to any financial figure
- It is better to say "Not found" than to guess wrong`
          },
          {
            role: 'user',
            content: `Assess this supplier for procurement onboarding: "${supplierName}"

LATEST WEB INTELLIGENCE:
${recentContext}

Based ONLY on verified data from the above search results and your certain knowledge, return this exact JSON:

{
  "supplierName": "Official full company name",
  "country": "HQ country",
  "industry": "Industry sector",
  "founded": "Year founded or Not found",
  "employees": "Most recent headcount with year e.g. 3,35,000 (FY2024) or Not found",
  "headquarters": "Full address or city, state, country or Not found",
  "cin": "Real CIN only if certain e.g. L17110MH1973PLC019786 — else Not found",
  "website": "Official URL or Not found",
  "contactEmail": "Official email only if certain — else Not found",
  "contactPhone": "Official phone only if certain — else Not found",
  "supplierType": "Large Enterprise / SME / MSME / Micro Enterprise / Startup",
  "udyamNumber": "Udyam registration number if MSME — else Not found",
  "gstNumber": "GST number only if certain — else Not found",
  "boardMembers": [
    { "name": "Full Name only if certain", "designation": "Title", "confidence": "high" },
    { "name": "Full Name only if certain", "designation": "Title", "confidence": "medium" }
  ],
  "dataConfidence": {
    "overall": "high or medium or low",
    "revenue": "high or medium or low",
    "boardMembers": "high or medium or low",
    "cin": "high or medium or low",
    "employees": "high or medium or low",
    "legalStatus": "high or medium or low"
  },
  "overallScore": <number 0-100>,
  "verdict": "APPROVED",
  "verdictReason": "One concise sentence",
  "summary": "3-4 sentences. If small/micro supplier, note data limitations clearly.",
  "factors": [
    { "name": "Annual Turnover",    "icon": "💰", "value": "Figure with year or Not found", "detail": "Source and trend context",          "status": "green", "score": 85 },
    { "name": "Financial Health",   "icon": "📊", "value": "Strong / Stable / Weak",         "detail": "Latest financials or Not found",   "status": "green", "score": 80 },
    { "name": "Credit Risk",        "icon": "🏦", "value": "Rating or Not found",            "detail": "Credit standing or Not assessed",  "status": "green", "score": 75 },
    { "name": "Legal & Compliance", "icon": "⚖️", "value": "Clean / Issues / Not found",     "detail": "Legal status from available data", "status": "green", "score": 90 },
    { "name": "ESG Score",          "icon": "🌱", "value": "High / Medium / Low / Not found","detail": "ESG data or Not publicly reported", "status": "amber", "score": 60 },
    { "name": "Market Reputation",  "icon": "⭐", "value": "Market standing",                "detail": "Reputation signals found",         "status": "green", "score": 88 }
  ],
  "news": [
    { "headline": "Real headline from search or Not found", "source": "Publication · Year", "sentiment": "positive" }
  ],
  "dataWarnings": [
    "List any fields where data could not be verified",
    "e.g. CIN could not be verified from public sources",
    "e.g. Limited public data available — small supplier"
  ]
}

Rules:
- verdict: "APPROVED"(65-100), "CONDITIONAL"(40-64), "REJECTED"(0-39)
- status: "green", "amber", or "red" only
- sentiment: "positive", "neutral", or "negative" only
- confidence: "high", "medium", or "low" only
- supplierType: classify correctly — Indian MSMEs under ₹250Cr turnover
- udyamNumber and gstNumber: only for Indian suppliers, else "N/A"
- dataWarnings: list ALL fields that could not be verified — be transparent
- If this is a small/micro supplier, set overall dataConfidence to "low" and explain
- Return ONLY the JSON`
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