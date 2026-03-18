export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { supplierName } = req.body
  if (!supplierName) {
    return res.status(400).json({ error: 'supplierName is required' })
  }

  const OPENAI_API_KEY = process.env.OPENAI_API_KEY

  try {
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
            content: `You are a senior procurement risk analyst with deep knowledge of global companies. 
Given a supplier name, return a thorough risk assessment as ONLY valid JSON. 
No markdown, no explanation, no preamble — only the raw JSON object.`
          },
          {
            role: 'user',
            content: `Assess this supplier for procurement onboarding: "${supplierName}"

Return ONLY this exact JSON structure:
{
  "supplierName": "Official full company name",
  "country": "HQ country",
  "industry": "Industry sector",
  "founded": "Year founded",
  "employees": "Approximate employee count e.g. 3,35,000+",
  "headquarters": "City, State, Country",
  "cin": "CIN if Indian company e.g. L17110MH1973PLC019786, else N/A",
  "website": "Official website URL",
  "contactEmail": "Official contact email if known else N/A",
  "contactPhone": "Official phone number if known else N/A",
  "boardMembers": [
    { "name": "Full Name", "designation": "Title e.g. Chairman & MD" },
    { "name": "Full Name", "designation": "CEO & MD" },
    { "name": "Full Name", "designation": "Independent Director" }
  ],
  "overallScore": <number 0-100, 100 = lowest risk>,
  "verdict": "APPROVED",
  "verdictReason": "One concise sentence explaining verdict",
  "summary": "3-4 sentence executive summary covering financials, risk profile, reputation and recommendation",
  "factors": [
    { "name": "Annual Turnover",    "icon": "💰", "value": "Real revenue figure",      "detail": "Revenue trend and scale",          "status": "green", "score": 85 },
    { "name": "Financial Health",   "icon": "📊", "value": "Strong / Stable / Weak",   "detail": "Profitability and balance sheet",  "status": "green", "score": 80 },
    { "name": "Credit Risk",        "icon": "🏦", "value": "Rating or risk level",     "detail": "Credit standing and stability",    "status": "green", "score": 75 },
    { "name": "Legal & Compliance", "icon": "⚖️", "value": "Clean / Minor / Major",    "detail": "Litigation and compliance status", "status": "green", "score": 90 },
    { "name": "ESG Score",          "icon": "🌱", "value": "High / Medium / Low",      "detail": "Environmental and governance",     "status": "amber", "score": 60 },
    { "name": "Market Reputation",  "icon": "⭐", "value": "Market standing",          "detail": "Brand strength and trust",         "status": "green", "score": 88 }
  ],
  "news": [
    { "headline": "Realistic recent headline about this company", "source": "Publication · Year", "sentiment": "positive" },
    { "headline": "Realistic recent headline about this company", "source": "Publication · Year", "sentiment": "neutral" },
    { "headline": "Realistic recent headline about this company", "source": "Publication · Year", "sentiment": "negative" },
    { "headline": "Realistic recent headline about this company", "source": "Publication · Year", "sentiment": "positive" }
  ]
}

Rules:
- verdict: "APPROVED"(65-100), "CONDITIONAL"(40-64), "REJECTED"(0-39)
- status: "green", "amber", or "red" only
- sentiment: "positive", "neutral", or "negative" only
- boardMembers: 3-5 real members with accurate designations
- cin: real CIN for Indian listed companies
- Return ONLY the JSON, nothing else`
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