const TAVILY_API_KEY = import.meta.env.VITE_TAVILY_API_KEY

async function searchTavily(query, maxResults = 5) {
  const response = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: TAVILY_API_KEY,
      query,
      max_results: maxResults,
      search_depth: 'advanced',
      include_answer: true
    })
  })

  if (!response.ok) {
    const err = await response.json()
    throw new Error(err.message || 'Tavily search failed')
  }

  const data = await response.json()
  return data
}

export async function gatherSupplierIntel(supplierName) {
  // Run 3 targeted searches in parallel
  const [overviewData, newsData, riskData] = await Promise.all([
    searchTavily(`${supplierName} company overview annual revenue employees financials`),
    searchTavily(`${supplierName} latest news 2024 2025`, 6),
    searchTavily(`${supplierName} legal issues compliance ESG sustainability rating`)
  ])

  // Extract clean text from each search
  const formatResults = (data) => {
    const answer = data.answer ? `Summary: ${data.answer}\n\n` : ''
    const results = data.results
      .map(r => `Source: ${r.url}\nTitle: ${r.title}\nContent: ${r.content}`)
      .join('\n\n---\n\n')
    return answer + results
  }

  return {
    overview: formatResults(overviewData),
    news: formatResults(newsData),
    risk: formatResults(riskData)
  }
}