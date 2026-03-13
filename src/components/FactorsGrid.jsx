import FactorCard from './FactorCard'

function FactorsGrid({ factors }) {
  return (
    <div>
      <div style={{
        fontFamily: 'DM Mono, monospace',
        fontSize: '10px',
        color: 'var(--text3)',
        letterSpacing: '2px',
        textTransform: 'uppercase',
        marginBottom: '14px'
      }}>
        RISK FACTOR BREAKDOWN
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '14px',
        marginBottom: '24px'
      }}>
        {factors.map((factor) => (
          <FactorCard key={factor.name} {...factor} />
        ))}
      </div>
    </div>
  )
}

export default FactorsGrid