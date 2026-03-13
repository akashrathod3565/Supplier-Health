export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { supplierName } = req.body

  if (!supplierName) {
    return res.status(400).json({ error: 'supplierName is required' })
  }

  const TAVILY_API_KEY = process.env.TAVILY_API_KEY
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY

  try {
    // Step 1 — Tavily searches
    const [overviewRes, newsRes, riskRes] = await Promise.all([
      fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: TAVILY_API_KEY,
          query: `${supplierName} company overview annual revenue employees financials`,
          max_results: 5,
          search_depth: 'advanced',
          include_answer: true
        })
      }),
      fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: TAVILY_API_KEY,
          query: `${supplierName} latest news 2024 2025`,
          max_results: 6,
          search_depth: 'advanced',
          include_answer: true
        })
      }),
      fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: TAVILY_API_KEY,
          query: `${supplierName} legal issues compliance ESG sustainability rating`,
          max_results: 5,
          search_depth: 'advanced',
          include_answer: true
        })
      })
    ])

    const [overview, news, risk] = await Promise.all([
      overviewRes.json(),
      newsRes.json(),
      riskRes.json()
    ])

    const formatResults = (data) => {
      const answer = data.answer ? `Summary: ${data.answer}\n\n` : ''
      const results = (data.results || [])
        .map(r => `Title: ${r.title}\nContent: ${r.content}`)
        .join('\n\n---\n\n')
      return answer + results
    }

    const intel = {
      overview: formatResults(overview),
      news: formatResults(news),
      risk: formatResults(risk)
    }

    // Step 2 — GPT-4o analysis
    const systemPrompt = `You are a senior procurement risk analyst. 
Analyse real web search data about a supplier and return ONLY valid JSON assessment.
No markdown, no explanation, no preamble — only the JSON object.`

    const userPrompt = `Analyse this supplier: "${supplierName}"

=== COMPANY OVERVIEW & FINANCIALS ===
${intel.overview}

=== LATEST NEWS ===
${intel.news}

=== LEGAL, COMPLIANCE & ESG ===
${intel.risk}

Return ONLY this JSON structure:
{
  "supplierName": "Official name",
  "country": "HQ country",
  "industry": "Industry sector",
  "founded": "Year",
  "employees": "Approx count",
  "overallScore": <0-100>,
  "verdict": "APPROVED",
  "verdictReason": "One sentence reason",
  "summary": "3-4 sentence executive summary based on real data",
  "factors": [
    { "name": "Annual Turnover",    "icon": "💰", "value": "Real figure", "detail": "Insight from data", "status": "green", "score": 85 },
    { "name": "Financial Health",   "icon": "📊", "value": "Strong",      "detail": "Insight from data", "status": "green", "score": 80 },
    { "name": "Credit Risk",        "icon": "🏦", "value": "Low Risk",    "detail": "Insight from data", "status": "green", "score": 75 },
    { "name": "Legal & Compliance", "icon": "⚖️", "value": "Clean",       "detail": "Insight from data", "status": "green", "score": 90 },
    { "name": "ESG Score",          "icon": "🌱", "value": "Medium",      "detail": "Insight from data", "status": "amber", "score": 60 },
    { "name": "Market Reputation",  "icon": "⭐", "value": "Strong",      "detail": "Insight from data", "status": "green", "score": 88 }
  ],
  "news": [
    { "headline": "Real headline from search data", "source": "Real source · date", "sentiment": "positive" }
  ]
}

Rules:
- verdict: "APPROVED"(65-100), "CONDITIONAL"(40-64), "REJECTED"(0-39)
- status: "green", "amber", or "red" only
- sentiment: "positive", "neutral", or "negative" only
- 4-6 real news items from search data
- Return ONLY the JSON`

    const gptRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        temperature: 0.2,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ]
      })
    })

    if (!gptRes.ok) {
      const err = await gptRes.json()
      throw new Error(err.error?.message || 'OpenAI error')
    }

    const gptData = await gptRes.json()
    const rawText = gptData.choices[0].message.content
    const cleaned = rawText.replace(/```json|```/g, '').trim()
    const result = JSON.parse(cleaned)

    return res.status(200).json(result)

  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}