import { gatherSupplierIntel } from './tavily'

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY

export async function assessSupplier(supplierName) {

  // Step 1 — Gather real web intelligence
  const intel = await gatherSupplierIntel(supplierName)

  // Step 2 — Send to GPT with real context
  const systemPrompt = `You are a senior procurement risk analyst with 20 years of experience 
in supplier due diligence, financial risk assessment, and vendor onboarding.
You will be given real web search results about a supplier. 
Analyse this data carefully and return ONLY a structured JSON assessment.
Base your analysis on the provided search data — not your training knowledge.
Return ONLY valid JSON, no markdown, no explanation, no preamble.`

  const userPrompt = `Analyse this supplier for procurement onboarding: "${supplierName}"

REAL WEB INTELLIGENCE GATHERED:

=== COMPANY OVERVIEW & FINANCIALS ===
${intel.overview}

=== LATEST NEWS (2024-2025) ===
${intel.news}

=== LEGAL, COMPLIANCE & ESG ===
${intel.risk}

Based on this real data, return ONLY a valid JSON object with exactly this structure:

{
  "supplierName": "Official full company name",
  "country": "Headquarter country",
  "industry": "Primary industry sector",
  "founded": "Year founded",
  "employees": "Approximate employee count",
  "overallScore": <number 0-100, where 100 = lowest risk>,
  "verdict": "APPROVED",
  "verdictReason": "One concise sentence based on the real data",
  "summary": "3-4 sentences based on real search data covering financial health, risk signals found, recent news impact, and procurement recommendation",
  "factors": [
    {
      "name": "Annual Turnover",
      "icon": "💰",
      "value": "Actual figure from search data",
      "detail": "Revenue insight based on real data found",
      "status": "green",
      "score": 85
    },
    {
      "name": "Financial Health",
      "icon": "📊",
      "value": "Strong / Stable / Weak / Critical",
      "detail": "Based on real financial data found in search",
      "status": "green",
      "score": 80
    },
    {
      "name": "Credit Risk",
      "icon": "🏦",
      "value": "Rating or risk level from real data",
      "detail": "Credit and payment risk based on search results",
      "status": "green",
      "score": 75
    },
    {
      "name": "Legal & Compliance",
      "icon": "⚖️",
      "value": "Clean / Minor Issues / Major Issues",
      "detail": "Based on real legal/compliance data found",
      "status": "green",
      "score": 90
    },
    {
      "name": "ESG Score",
      "icon": "🌱",
      "value": "High / Medium / Low",
      "detail": "Based on real ESG data found in search",
      "status": "amber",
      "score": 60
    },
    {
      "name": "Market Reputation",
      "icon": "⭐",
      "value": "Market standing from real data",
      "detail": "Based on news sentiment and reputation signals found",
      "status": "green",
      "score": 88
    }
  ],
  "news": [
    {
      "headline": "Real headline extracted from the news search results above",
      "source": "Real source name from search · date if available",
      "sentiment": "positive"
    }
  ]
}

Rules:
- verdict must be exactly: "APPROVED", "CONDITIONAL", or "REJECTED"
- status must be exactly: "green", "amber", or "red"  
- sentiment must be exactly: "positive", "neutral", or "negative"
- overallScore: 65-100 = APPROVED, 40-64 = CONDITIONAL, 0-39 = REJECTED
- Extract 4-6 real news headlines from the news search data above
- All insights must be grounded in the real search data provided
- Return ONLY the JSON object, nothing else`

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
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

  if (!response.ok) {
    const err = await response.json()
    throw new Error(err.error?.message || 'OpenAI API error. Check your API key.')
  }

  const data = await response.json()
  const rawText = data.choices[0].message.content
  const cleaned = rawText.replace(/```json|```/g, '').trim()
  return JSON.parse(cleaned)
}