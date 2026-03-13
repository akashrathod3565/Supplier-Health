function SearchBar({ value, onChange, onSearch, loading }) {
  const hints = ['Tata Steel', 'Infosys Limited', 'Bosch India', 'Reliance Industries']

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') onSearch()
  }

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border2)',
      borderRadius: '16px',
      padding: '28px',
      marginBottom: '36px',
      position: 'relative'
    }}>

      {/* Top accent line */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: '1px',
        background: 'linear-gradient(90deg, transparent, var(--accent), transparent)',
        opacity: 0.4,
        borderRadius: '16px 16px 0 0'
      }} />

      <div style={{
        fontFamily: 'DM Mono, monospace',
        fontSize: '11px',
        color: 'var(--text3)',
        letterSpacing: '1.5px',
        textTransform: 'uppercase',
        marginBottom: '12px'
      }}>
        SUPPLIER LOOKUP
      </div>

      {/* Input Row */}
      <div style={{ display: 'flex', gap: '12px' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <span style={{
            position: 'absolute',
            left: '14px',
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: '15px',
            pointerEvents: 'none'
          }}>🔎</span>
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter supplier / company name..."
            disabled={loading}
            style={{
              width: '100%',
              background: 'var(--surface2)',
              border: '1px solid var(--border2)',
              borderRadius: '10px',
              padding: '13px 14px 13px 40px',
              color: 'var(--text)',
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '15px',
              outline: 'none',
              opacity: loading ? 0.6 : 1
            }}
          />
        </div>

        <button
          onClick={onSearch}
          disabled={loading || !value.trim()}
          style={{
            background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
            border: 'none',
            borderRadius: '10px',
            padding: '13px 28px',
            color: '#fff',
            fontFamily: 'Syne, sans-serif',
            fontWeight: '700',
            fontSize: '14px',
            cursor: loading || !value.trim() ? 'not-allowed' : 'pointer',
            opacity: loading || !value.trim() ? 0.5 : 1,
            whiteSpace: 'nowrap',
            boxShadow: '0 4px 20px rgba(79,142,247,0.25)'
          }}
        >
          {loading ? 'Assessing...' : 'Assess Supplier'}
        </button>
      </div>

      {/* Hint Chips */}
      <div style={{ marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {hints.map((hint) => (
          <span
            key={hint}
            onClick={() => !loading && onChange(hint)}
            style={{
              fontFamily: 'DM Mono, monospace',
              fontSize: '11px',
              color: 'var(--text3)',
              background: 'var(--surface2)',
              border: '1px solid var(--border)',
              padding: '4px 10px',
              borderRadius: '20px',
              cursor: loading ? 'default' : 'pointer'
            }}
          >
            {hint}
          </span>
        ))}
      </div>

    </div>
  )
}

export default SearchBar