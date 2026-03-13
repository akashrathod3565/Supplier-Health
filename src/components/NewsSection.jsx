function NewsSection({ news }) {
  const sentimentColor = (sentiment) => {
    if (sentiment === 'positive') return 'var(--green)'
    if (sentiment === 'negative') return 'var(--red)'
    return 'var(--text3)'
  }

  const sentimentGlow = (sentiment) => {
    if (sentiment === 'positive') return '0 0 6px var(--green)'
    if (sentiment === 'negative') return '0 0 6px var(--red)'
    return 'none'
  }

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: '12px',
      padding: '20px',
      marginBottom: '24px'
    }}>

      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '16px'
      }}>
        <div style={{
          fontFamily: 'Syne, sans-serif',
          fontSize: '14px',
          fontWeight: '700',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          📰 Latest News & Signals
        </div>
        <div style={{
          fontFamily: 'DM Mono, monospace',
          fontSize: '10px',
          color: 'var(--text3)',
          background: 'var(--surface2)',
          border: '1px solid var(--border)',
          padding: '2px 8px',
          borderRadius: '10px'
        }}>
          {news.length} signals
        </div>
      </div>

      {/* News Items */}
      {news.map((item, i) => (
        <div key={i} style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
          padding: '12px 0',
          borderBottom: i < news.length - 1 ? '1px solid var(--border)' : 'none'
        }}>

          {/* Sentiment dot */}
          <div style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            marginTop: '6px',
            flexShrink: 0,
            background: sentimentColor(item.sentiment),
            boxShadow: sentimentGlow(item.sentiment)
          }} />

          {/* Content */}
          <div>
            <div style={{
              fontSize: '13px',
              fontWeight: '500',
              lineHeight: '1.4',
              marginBottom: '3px'
            }}>
              {item.headline}
            </div>
            <div style={{
              fontFamily: 'DM Mono, monospace',
              fontSize: '10px',
              color: 'var(--text3)'
            }}>
              {item.source}
            </div>
          </div>

        </div>
      ))}

    </div>
  )
}

export default NewsSection