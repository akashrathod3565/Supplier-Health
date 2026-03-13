const steps = [
  'Searching web for company overview & financials',
  'Scanning latest news and market signals',
  'Checking legal, compliance & ESG data',
  'Sending intelligence to GPT-4o for analysis',
  'Building risk assessment report'
]

function LoadingPanel({ active, currentStep }) {
  if (!active) return null

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border2)',
      borderRadius: '16px',
      padding: '40px',
      textAlign: 'center',
      marginBottom: '24px'
    }}>

      {/* Spinner */}
      <div style={{
        width: '40px',
        height: '40px',
        border: '2px solid var(--border2)',
        borderTopColor: 'var(--accent)',
        borderRadius: '50%',
        margin: '0 auto 20px',
        animation: 'spin 0.8s linear infinite'
      }} />

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulseDot { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
      `}</style>

      <div style={{
        fontFamily: 'Syne, sans-serif',
        fontSize: '15px',
        fontWeight: '700',
        marginBottom: '4px'
      }}>
        Running Supplier Intelligence
      </div>
      <div style={{
        fontSize: '12px',
        color: 'var(--text3)'
      }}>
        Analysing across 6 risk dimensions...
      </div>

      {/* Steps */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        maxWidth: '320px',
        margin: '20px auto 0',
        textAlign: 'left'
      }}>
        {steps.map((step, i) => {
          const stepNum = i + 1
          const isDone = stepNum < currentStep
          const isActive = stepNum === currentStep

          return (
            <div key={step} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontFamily: 'DM Mono, monospace',
              fontSize: '12px',
              color: isDone ? 'var(--green)' : isActive ? 'var(--text)' : 'var(--text3)',
              transition: 'color 0.3s'
            }}>
              <div style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                flexShrink: 0,
                background: isDone ? 'var(--green)' : isActive ? 'var(--accent)' : 'var(--border2)',
                animation: isActive ? 'pulseDot 1s infinite' : 'none',
                transition: 'background 0.3s'
              }} />
              {step}
            </div>
          )
        })}
      </div>

    </div>
  )
}

export default LoadingPanel