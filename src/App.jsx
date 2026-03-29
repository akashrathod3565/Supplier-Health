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
import CompareView from './components/CompareView'
import { assessSupplier } from './services/openai'

function App() {
  const [compareMode, setCompareMode] = useState(false)
  const [supplierName, setSupplierName] = useState('')
  const [supplier2Name, setSupplier2Name] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingStep, setLoadingStep] = useState(1)
  const [result, setResult] = useState(null)
  const [result2, setResult2] = useState(null)
  const [error, setError] = useState('')

  const handleSearch = async () => {
    if (!supplierName.trim()) return
    if (compareMode && !supplier2Name.trim()) return

    setResult(null)
    setResult2(null)
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
      if (compareMode) {
        const [data1, data2] = await Promise.all([
          assessSupplier(supplierName),
          assessSupplier(supplier2Name)
        ])
        clearInterval(timer)
        setLoadingStep(5)
        setTimeout(() => {
          setLoading(false)
          setResult(data1)
          setResult2(data2)
        }, 600)
      } else {
        const data = await assessSupplier(supplierName)
        clearInterval(timer)
        setLoadingStep(5)
        setTimeout(() => {
          setLoading(false)
          setResult(data)
        }, 600)
      }
    } catch (err) {
      clearInterval(timer)
      setLoading(false)
      setError(err.message)
    }
  }

  const handleClear = () => {
    setResult(null)
    setResult2(null)
    setSupplierName('')
    setSupplier2Name('')
    setError('')
  }

  const handleToggleCompare = () => {
    setCompareMode(prev => !prev)
    setResult(null)
    setResult2(null)
    setError('')
    setSupplier2Name('')
  }

  return (
    <div className="shell">
      <Header />

      <SearchBar
        value={supplierName}
        onChange={setSupplierName}
        value2={supplier2Name}
        onChange2={setSupplier2Name}
        onSearch={handleSearch}
        loading={loading}
        compareMode={compareMode}
        onToggleCompare={handleToggleCompare}
      />

      <LoadingPanel
        active={loading}
        currentStep={loadingStep}
      />

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

      {/* Compare mode results */}
      {compareMode && result && result2 && (
        <>
          <div style={{
            fontFamily: 'DM Mono, monospace',
            fontSize: '10px',
            color: 'var(--accent)',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
            ⇄ SUPPLIER COMPARISON REPORT
            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
          </div>
          <CompareView result1={result} result2={result2} />
          <ActionBar
            result={result}
            onReassess={handleSearch}
            onClear={handleClear}
          />
        </>
      )}

      {/* Single mode results */}
      {!compareMode && result && (
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
            redFlags={result.redFlags || []}
            trustBonuses={result.trustBonuses || []}
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
