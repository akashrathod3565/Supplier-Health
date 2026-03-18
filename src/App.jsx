import { useState } from 'react'
import Header from './components/Header'
import SearchBar from './components/SearchBar'
import LoadingPanel from './components/LoadingPanel'
import VerdictBanner from './components/VerdictBanner'
import CompanyProfile from './components/CompanyProfile'
import ScoreBreakdown from './components/ScoreBreakdown'
import FactorsGrid from './components/FactorsGrid'
import NewsSection from './components/NewsSection'
import SummaryBox from './components/SummaryBox'
import ActionBar from './components/ActionBar'
import { assessSupplier } from './services/openai'

function App() {
  const [supplierName, setSupplierName] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingStep, setLoadingStep] = useState(1)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const handleSearch = async () => {
    if (!supplierName.trim()) return
    setResult(null)
    setError('')
    setLoading(true)
    setLoadingStep(1)

    let step = 1
    const timer = setInterval(() => {
      step++
      setLoadingStep(step)
      if (step >= 4) clearInterval(timer)
    }, 1000)

    try {
      const data = await assessSupplier(supplierName)
      clearInterval(timer)
      setLoadingStep(5)
      setTimeout(() => {
        setLoading(false)
        setResult(data)
      }, 600)
    } catch (err) {
      clearInterval(timer)
      setLoading(false)
      setError(err.message)
    }
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
          <CompanyProfile data={result} />
          <SummaryBox summary={result.summary} />
          <ScoreBreakdown
            factors={result.factors}
            overallScore={result.overallScore}
          />
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