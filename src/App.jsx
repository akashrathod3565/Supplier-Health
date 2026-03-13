import { useState } from 'react'
import Header from './components/Header'
import SearchBar from './components/SearchBar'
import LoadingPanel from './components/LoadingPanel'
import VerdictBanner from './components/VerdictBanner'
import FactorsGrid from './components/FactorsGrid'
import NewsSection from './components/NewsSection'
import SummaryBox from './components/SummaryBox'
import ActionBar from './components/ActionBar'

const DUMMY = {
  supplierName: 'Tata Steel Limited',
  country: 'India',
  industry: 'Steel & Mining',
  overallScore: 78,
  verdict: 'APPROVED',
  verdictReason: 'Strong financials with minor ESG concerns',
  summary: 'Tata Steel is one of the largest steel producers globally with a strong balance sheet and consistent revenue growth. Credit risk is low with investment-grade ratings. Minor ESG concerns exist around carbon emissions but improvement roadmaps are in place. Overall recommended for onboarding with standard contract terms.',
  factors: [
    { name: 'Annual Turnover',    icon: '💰', value: '₹2.43L Cr',     detail: 'Consistent revenue growth over 5 years',              status: 'green', score: 88 },
    { name: 'Financial Health',   icon: '📊', value: 'Strong',         detail: 'Healthy EBITDA margins and positive cash flow',       status: 'green', score: 82 },
    { name: 'Credit Risk',        icon: '🏦', value: 'BBB+ Rated',     detail: 'Investment grade with stable outlook',                status: 'green', score: 79 },
    { name: 'Legal & Compliance', icon: '⚖️', value: 'Minor Issues',   detail: 'A few pending regulatory matters, none critical',     status: 'amber', score: 55 },
    { name: 'ESG Score',          icon: '🌱', value: 'Medium',         detail: 'Carbon reduction targets set, progress ongoing',      status: 'amber', score: 60 },
    { name: 'Market Reputation',  icon: '⭐', value: 'Market Leader',  detail: 'Top 3 global steel brand, strong client trust',       status: 'green', score: 91 },
  ],
  news: [
    { headline: 'Tata Steel reports record quarterly profit driven by European operations', source: 'Economic Times · Jan 2025',  sentiment: 'positive' },
    { headline: 'Tata Steel commits to net-zero carbon emissions by 2045',                 source: 'Business Standard · Dec 2024', sentiment: 'positive' },
    { headline: 'Minor regulatory notice issued to Jamshedpur plant over emissions',       source: 'Reuters · Nov 2024',           sentiment: 'negative' },
    { headline: 'Tata Steel wins supplier excellence award from JLR',                      source: 'Hindu BusinessLine · Oct 2024',sentiment: 'positive' },
    { headline: 'Steel sector faces headwinds from global demand slowdown',                source: 'Mint · Oct 2024',              sentiment: 'neutral'  },
  ]
}

function App() {
  const [supplierName, setSupplierName] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingStep, setLoadingStep] = useState(1)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const handleSearch = () => {
    if (!supplierName.trim()) return
    setResult(null)
    setError('')
    setLoading(true)
    setLoadingStep(1)

    let step = 1
    const timer = setInterval(() => {
      step++
      setLoadingStep(step)
      if (step >= 5) {
        clearInterval(timer)
        setTimeout(() => {
          setLoading(false)
          setResult(DUMMY)
        }, 800)
      }
    }, 700)
  }

  const handleClear = () => {
    setResult(null)
    setSupplierName('')
    setError('')
  }

  return (
    <div className="shell">
      <Header />
      <SearchBar
        value={supplierName}
        onChange={setSupplierName}
        onSearch={handleSearch}
        loading={loading}
      />
      <LoadingPanel active={loading} currentStep={loadingStep} />

      {error && (
        <div style={{
          background: 'rgba(239,68,68,0.08)',
          border: '1px solid rgba(239,68,68,0.25)',
          borderRadius: '12px',
          padding: '16px 20px',
          marginBottom: '24px',
          fontSize: '13px',
          color: 'var(--red)'
        }}>
          ⚠️ {error}
        </div>
      )}

      {result && (
        <>
          <VerdictBanner
            supplierName={result.supplierName}
            score={result.overallScore}
            verdict={result.verdict}
            verdictReason={result.verdictReason}
          />
          <SummaryBox summary={result.summary} />
          <FactorsGrid factors={result.factors} />
          <NewsSection news={result.news} />
          <ActionBar
            result={result}
            onReassess={handleSearch}
            onClear={handleClear}
          />
        </>
      )}
    </div>
  )
}

export default App