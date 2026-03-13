function FactorCard({ name, icon, value, detail, status, score }) {
  const color = status === 'green'
    ? 'var(--green)'
    : status === 'amber'
    ? 'var(--amber)'
    : 'var(--red)'

  const dimColor = status === 'green'
    ? 'var(--green-dim)'
    : status === 'amber'
    ? 'var(--amber-dim)'
    : 'var(--red-dim)'

  const borderColor = status === 'green'
    ? 'rgba(34,197,94,0.25)'
    : status === 'amber'
    ? 'rgba(245,158,11,0.25)'
    : 'rgba(239,68,68,0.25)'

  const label = status === 'green' ? 'PASS' : status === 'amber' ? 'REVIEW' : 'FAIL'

  return (
    <div style={{
      background: 'var(--surface)',
      border: `1px solid ${borderColor}`,
      borderRadius: '12px',
      padding: '18px 20px',
      position: 'relative',
      overflow: 'hidden'
    }}>

      {/* Left colour bar */}
      <div style={{
        position: 'absolute',
        left: 0, top: 0, bottom: 0,
        width: '3px',
        background: color,
        borderRadius: '12px 0 0 12px'
      }} />

      {/* Top row — name + flag */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '10px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '16px' }}>{icon}</span>
          <span style={{
            fontFamily: 'Syne, sans-serif',
            fontSize: '13px',
            fontWeight: '700'
          }}>
            {name}
          </span>
        </div>

        {/* Flag pill */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          padding: '3px 10px',
          borderRadius: '20px',
          background: dimColor,
          fontFamily: 'DM Mono, monospace',
          fontSize: '10px',
          fontWeight: '500',
          letterSpacing: '0.5px',
          textTransform: 'uppercase',
          color: color
        }}>
          <div style={{
            width: '5px', height: '5px',
            borderRadius: '50%',
            background: color
          }} />
          {label}
        </div>
      </div>

      {/* Value */}
      <div style={{
        fontFamily: 'Syne, sans-serif',
        fontSize: '19px',
        fontWeight: '700',
        letterSpacing: '-0.5px',
        marginBottom: '4px'
      }}>
        {value}
      </div>

      {/* Detail */}
      <div style={{
        fontSize: '12px',
        color: 'var(--text2)',
        lineHeight: '1.5',
        fontWeight: '300'
      }}>
        {detail}
      </div>

      {/* Score bar */}
      <div style={{
        marginTop: '12px',
        height: '3px',
        background: 'var(--border)',
        borderRadius: '2px',
        overflow: 'hidden'
      }}>
        <div style={{
          height: '100%',
          width: `${score}%`,
          background: color,
          borderRadius: '2px'
        }} />
      </div>

    </div>
  )
}

export default FactorCard