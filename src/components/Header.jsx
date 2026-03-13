function Header() {
  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '56px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          width: '36px', height: '36px',
          background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
          borderRadius: '8px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '16px',
          boxShadow: '0 0 20px rgba(79,142,247,0.3)'
        }}>🔍</div>
        <div style={{
          fontFamily: 'Syne, sans-serif',
          fontSize: '20px',
          fontWeight: '800',
          letterSpacing: '-0.5px'
        }}>
          Supplier<span style={{ color: 'var(--accent)' }}>IQ</span>
        </div>
      </div>
      <div style={{
        fontFamily: 'DM Mono, monospace',
        fontSize: '11px',
        color: 'var(--text3)',
        border: '1px solid var(--border)',
        padding: '4px 10px',
        borderRadius: '20px',
        letterSpacing: '0.5px'
      }}>
        PROCUREMENT INTELLIGENCE
      </div>
    </header>
  )
}

export default Header