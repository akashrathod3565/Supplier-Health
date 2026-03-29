function SearchBar({ value, onChange, value2, onChange2, onSearch, loading, compareMode, onToggleCompare }) {
  const hints = ['Tata Steel', 'Infosys Limited', 'Bosch India', 'Reliance Industries']

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') onSearch()
  }

  const inputStyle = {
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

      {/* Header row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '14px',
        flexWrap: 'wrap',
        gap: '8px'
      }}>
        <div style={{
          fontFamily: 'DM Mono, monospace',
          fontSize: '11px',
          color: 'var(--text3)',
          letterSpacing: '1.5px',
          textTransform: 'uppercase'
        }}>
          {compareMode ? 'COMPARE SUPPLIERS' : 'SUPPLIER LOOKUP'}
        </div>

        {/* Compare toggle button */}
        <button
          onClick={onToggleCompare}
          disabled={loading}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 14px',
            borderRadius: '20px',
            fontFamily: 'Syne, sans-serif',
            fontWeight: '700',
            fontSize: '12px',
            cursor: loading ? 'not-allowed' : 'pointer',
            border: `1px solid ${compareMode ? 'var(--accent)' : 'var(--border2)'}`,
            background: compareMode
              ? 'rgba(79,142,247,0.12)'
              : 'var(--surface2)',
            color: compareMode ? 'var(--accent)' : 'var(--text3)',
            transition: 'all 0.2s ease',
            opacity: loading ? 0.5 : 1
          }}
        >
          <span style={{ fontSize: '14px' }}>{compareMode ? '✕' : '⇄'}</span>
          {compareMode ? 'Exit Compare' : 'Compare Mode'}
        </button>
      </div>

      {/* Inputs */}
      {compareMode ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr auto',
          gap: '10px',
          alignItems: 'center'
        }}>
          {/* Supplier 1 */}
          <div style={{ position: 'relative' }}>
            <div style={{
              position: 'absolute',
              top: '-8px',
              left: '12px',
              fontFamily: 'DM Mono, monospace',
              fontSize: '9px',
              color: 'var(--accent)',
              background: 'var(--surface)',
              padding: '0 4px',
              letterSpacing: '1px'
            }}>
              SUPPLIER A
            </div>
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
              placeholder="First supplier name..."
              disabled={loading}
              style={inputStyle}
            />
          </div>

          {/* VS badge */}
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'var(--surface2)',
            border: '1px solid var(--border2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'Syne, sans-serif',
            fontSize: '11px',
            fontWeight: '800',
            color: 'var(--text3)',
            flexShrink: 0
          }}>
            VS
          </div>

          {/* Supplier 2 */}
          <div style={{ position: 'relative' }}>
            <div style={{
              position: 'absolute',
              top: '-8px',
              left: '12px',
              fontFamily: 'DM Mono, monospace',
              fontSize: '9px',
              color: 'var(--accent2)',
              background: 'var(--surface)',
              padding: '0 4px',
              letterSpacing: '1px'
            }}>
              SUPPLIER B
            </div>
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
              value={value2}
              onChange={(e) => onChange2(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Second supplier name..."
              disabled={loading}
              style={inputStyle}
            />
          </div>

          {/* Compare button */}
          <button
            onClick={onSearch}
            disabled={loading || !value.trim() || !value2.trim()}
            style={{
              background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
              border: 'none',
              borderRadius: '10px',
              padding: '13px 20px',
              color: '#fff',
              fontFamily: 'Syne, sans-serif',
              fontWeight: '700',
              fontSize: '13px',
              cursor: loading || !value.trim() || !value2.trim() ? 'not-allowed' : 'pointer',
              opacity: loading || !value.trim() || !value2.trim() ? 0.5 : 1,
              whiteSpace: 'nowrap',
              boxShadow: '0 4px 20px rgba(79,142,247,0.25)',
              flexShrink: 0
            }}
          >
            {loading ? 'Comparing...' : '⇄ Compare'}
          </button>
        </div>
      ) : (
        /* Single mode */
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
              style={inputStyle}
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
      )}

      {/* Hint Chips — only in single mode */}
      {!compareMode && (
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
      )}
    </div>
  )
}

export default SearchBar
