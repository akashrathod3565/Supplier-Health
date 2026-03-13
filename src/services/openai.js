const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY

export async function assessSupplier(supplierName) {

  const systemPrompt = `You are a senior procurement risk analyst with 20 years of experience 
in supplier due diligence, financial risk assessment, and vendor onboarding. 
You have deep knowledge of global companies, their financials, legal standing, and market reputation.
When given a supplier name, you conduct a thorough assessment and return ONLY structured JSON — 
no markdown, no explanation, no preamble.`

  const userPrompt = `Conduct a full supplier onboarding risk assessment for: "${supplierName}"

Return ONLY a valid JSON object with exactly this structure:

{
  "supplierName": "Official full company name",
  "country": "Headquarter country",
  "industry": "Primary industry sector",
  "founded": "Year founded",
  "employees": "Approximate employee count e.g. 50,000+",
  "overallScore": <number between 0 and 100, where 100 means lowest risk>,
  "verdict": "APPROVED",
  "verdictReason": "One concise sentence explaining the verdict",
  "summary": "3-4 sentence executive summary covering financial health, risk profile, reputation and final recommendation for procurement team",
  "factors": [
    {
      "name": "Annual Turnover",
      "icon": "💰",
      "value": "Actual revenue figure e.g. $5.2B or ₹1.2L Cr",
      "detail": "Revenue trend insight and business scale context",
      "status": "green",
      "score": 85
    },
    {
      "name": "Financial Health",
      "icon": "📊",
      "value": "Strong / Stable / Weak / Critical",
      "detail": "Profitability, debt levels, cash flow and balance sheet insight",
      "status": "green",
      "score": 80
    },
    {
      "name": "Credit Risk",
      "icon": "🏦",
      "value": "Credit rating or qualitative risk level",
      "detail": "Credit standing, payment history and financial stability",
      "status": "green",
      "score": 75
    },
    {
      "name": "Legal & Compliance",
      "icon": "⚖️",
      "value": "Clean / Minor Issues / Major Issues",
      "detail": "Litigation history, regulatory compliance and legal standing",
      "status": "green",
      "score": 90
    },
    {
      "name": "ESG Score",
      "icon": "🌱",
      "value": "High / Medium / Low",
      "detail": "Environmental practices, social responsibility and governance quality",
      "status": "amber",
      "score": 60
    },
    {
      "name": "Market Reputation",
      "icon": "⭐",
      "value": "Market standing description",
      "detail": "Brand strength, customer trust, industry awards and peer recognition",
      "status": "green",
      "score": 88
    }
  ],
  "news": [
    {
      "headline": "Realistic recent news headline about this supplier",
      "source": "Publication name · Approximate date",
      "sentiment": "positive"
    },
    {
      "headline": "Another realistic news headline",
      "source": "Publication name · Approximate date",
      "sentiment": "neutral"
    },
    {
      "headline": "Another realistic news headline",
      "source": "Publication name · Approximate date",
      "sentiment": "negative"
    }
  ]
}

Rules:
- verdict must be exactly: "APPROVED", "CONDITIONAL", or "REJECTED"
- status must be exactly: "green", "amber", or "red"
- sentiment must be exactly: "positive", "neutral", or "negative"
- overallScore: 65-100 = APPROVED, 40-64 = CONDITIONAL, 0-39 = REJECTED
- Include 4 to 6 news items
- Be accurate and realistic based on your knowledge of this company
- If company is unknown, still provide a reasonable assessment based on the name
- Return ONLY the JSON object, nothing else`

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      temperature: 0.3,
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

  // Strip markdown fences if GPT wraps response in ```json
  const cleaned = rawText.replace(/```json|```/g, '').trim()

  return JSON.parse(cleaned)
}