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
    // Single fast Tavily search for latest context only
    let recentContext = ''
    try {
      const tavilyRes = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: TAVILY_API_KEY,
          query: `${supplierName} 2024 2025 revenue news financial results`,
          max_results: 3,
          search_depth: 'basic',
          include_answer: true
        })
      })
      const tavilyData = await tavilyRes.json()

      // Extract only the answer + top 3 titles — keep it tiny
      const answer = tavilyData.answer
        ? `Latest summary: ${tavilyData.answer}\n`
        : ''
      const headlines = (tavilyData.results || [])
        .slice(0, 3)
        .map(r => `- ${r.title}`)
        .join('\n')
      recentContext = answer + headlines

    } catch (e) {
      // If Tavily fails, continue without it
      recentContext = 'No recent web data available.'
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
        temperature: 0.2,
        max_tokens: 1500,
        messages: [
          {
            role: 'system',
            content: `You are a senior procurement risk analyst. 
The current year is ${currentYear}.
Use the most recent data available — prioritize ${currentYear} and 2024 figures over older data.
Return ONLY valid JSON, no markdown, no explanation.`
          },
          {
            role: 'user',
            content: `Assess this supplier: "${supplierName}"

LATEST WEB INTELLIGENCE (${currentYear}):
${recentContext}

Use the above recent data combined with your knowledge to return the most up-to-date assessment possible.
Prioritize ${currentYear} revenue, headcount, and news. If ${currentYear} data is unavailable use 2024.

Return ONLY this exact JSON:
{
  "supplierName": "Official full company name",
  "country": "HQ country",
  "industry": "Industry sector",
  "founded": "Year founded",
  "employees": "Most recent employee count e.g. 3,35,000+ (${currentYear})",
  "headquarters": "City, State, Country",
  "cin": "CIN if Indian company else N/A",
  "website": "Official website URL",
  "contactEmail": "Official contact email if known else N/A",
  "contactPhone": "Official phone number if known else N/A",
  "boardMembers": [
    { "name": "Full Name", "designation": "Current title as of ${currentYear}" },
    { "name": "Full Name", "designation": "Current title" },
    { "name": "Full Name", "designation": "Current title" }
  ],
  "overallScore": <number 0-100>,
  "verdict": "APPROVED",
  "verdictReason": "One concise sentence with current context",
  "summary": "3-4 sentences using most recent ${currentYear}/2024 data available",
  "factors": [
    { "name": "Annual Turnover",    "icon": "💰", "value": "Most recent revenue figure with year",  "detail": "Revenue trend using latest data",          "status": "green", "score": 85 },
    { "name": "Financial Health",   "icon": "📊", "value": "Strong / Stable / Weak",                "detail": "Latest profitability and balance sheet",   "status": "green", "score": 80 },
    { "name": "Credit Risk",        "icon": "🏦", "value": "Current rating or risk level",          "detail": "Most recent credit standing",              "status": "green", "score": 75 },
    { "name": "Legal & Compliance", "icon": "⚖️", "value": "Clean / Minor Issues / Major Issues",   "detail": "Current legal and compliance status",      "status": "green", "score": 90 },
    { "name": "ESG Score",          "icon": "🌱", "value": "High / Medium / Low",                   "detail": "Latest ESG initiatives and rating",        "status": "amber", "score": 60 },
    { "name": "Market Reputation",  "icon": "⭐", "value": "Current market standing",               "detail": "Recent brand signals and trust indicators","status": "green", "score": 88 }
  ],
  "news": [
    { "headline": "Most recent headline from ${currentYear} or 2024", "source": "Publication · ${currentYear}", "sentiment": "positive" },
    { "headline": "Recent headline",                                   "source": "Publication · 2024",          "sentiment": "neutral"  },
    { "headline": "Recent headline",                                   "source": "Publication · 2024",          "sentiment": "negative" },
    { "headline": "Recent headline",                                   "source": "Publication · 2024",          "sentiment": "positive" }
  ]
}

Rules:
- verdict: "APPROVED"(65-100), "CONDITIONAL"(40-64), "REJECTED"(0-39)
- status: "green", "amber", or "red" only
- sentiment: "positive", "neutral", or "negative" only
- boardMembers: 3-5 current members as of ${currentYear}
- Always mention the year next to revenue figures
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