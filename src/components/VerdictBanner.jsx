function VerdictBanner({ supplierName, score, verdict, verdictReason }) {
  const isGreen = score >= 65
  const isAmber = score >= 40 && score < 65
  const isRed = score < 40

  const color = isGreen ? 'var(--green)' : isAmber ? 'var(--amber)' : 'var(--red)'
  const dimColor = isGreen ? 'var(--green-dim)' : isAmber ? 'var(--amber-dim)' : 'var(--red-dim)'
  const borderColor = isGreen
    ? 'rgba(34,197,94,0.25)'
    : isAmber
    ? 'rgba(245,158,11,0.25)'
    : 'rgba(239,68,68,0.25)'
  const icon = isGreen ? '✅' : isAmber ? '⚠️' : '🚫'
  const badgeBg = isGreen ? 'var(--green)' : isAmber ? 'var(--amber)' : 'var(--red)'
  const badgeColor = isRed ? '#fff' : '#000'

  return (
    <div style={{
      borderRadius: '14px',
      padding: '24px 28px',
      marginBottom: '24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '16px',
      flexWrap: 'wrap',
      background: dimColor,
      border: `1px solid ${borderColor}`
    }}>

      {/* Left — icon + name + reason */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{
          width: '48px', height: '48px',
          borderRadius: '12px',
          background: dimColor,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '22px',
          flexShrink: 0
        }}>
          {icon}
        </div>
        <div>
          <div style={{
            fontFamily: 'Syne, sans-serif',
            fontSize: '20px',
            fontWeight: '800',
            letterSpacing: '-0.3px',
            marginBottom: '3px'
          }}>
            {supplierName}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text2)', fontWeight: '300' }}>
            {verdictReason}
          </div>
        </div>
      </div>

      {/* Right — score + badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontFamily: 'Syne, sans-serif',
            fontSize: '42px',
            fontWeight: '800',
            lineHeight: 1,
            letterSpacing: '-2px',
            color: color
          }}>
            {score}
          </div>
          <div style={{
            fontFamily: 'DM Mono, monospace',
            fontSize: '10px',
            color: 'var(--text3)',
            letterSpacing: '1px',
            textTransform: 'uppercase'
          }}>
            RISK SCORE /100
          </div>
        </div>

        <div style={{
          padding: '8px 18px',
          borderRadius: '8px',
          fontFamily: 'Syne, sans-serif',
          fontWeight: '700',
          fontSize: '13px',
          letterSpacing: '0.5px',
          textTransform: 'uppercase',
          background: badgeBg,
          color: badgeColor
        }}>
          {verdict}
        </div>
      </div>

    </div>
  )
}

export default VerdictBanner