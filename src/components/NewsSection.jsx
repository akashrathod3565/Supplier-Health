function NewsSection({ news }) {
  const sentimentColor = (s) =>
    s === 'positive' ? 'var(--green)' : s === 'negative' ? 'var(--red)' : 'var(--text3)'
  const sentimentGlow = (s) =>
    s === 'positive' ? '0 0 6px var(--green)' : s === 'negative' ? '0 0 6px var(--red)' : 'none'

  // Resolve article URL: prefer item.url, fall back to resolvedSource.url
  const getUrl = (item) => item.url || item.resolvedSource?.url || null
  const getDomain = (item) => {
    const url = getUrl(item)
    if (!url) return null
    try { return new URL(url).hostname.replace('www.', '') } catch { return null }
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
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', marginBottom: '16px'
      }}>
        <div style={{
          fontFamily: 'Syne, sans-serif', fontSize: '14px', fontWeight: '700',
          display: 'flex', alignItems: 'center', gap: '8px'
        }}>
          📰 Latest News & Signals
        </div>
        <div style={{
          fontFamily: 'DM Mono, monospace', fontSize: '10px', color: 'var(--text3)',
          background: 'var(--surface2)', border: '1px solid var(--border)',
          padding: '2px 8px', borderRadius: '10px'
        }}>
          {news.length} signals
        </div>
      </div>

      {/* News Items */}
      {news.map((item, i) => {
        const articleUrl = getUrl(item)
        const domain = getDomain(item)
        const hasRealUrl = !!articleUrl

        return (
          <div key={i} style={{
            display: 'flex', alignItems: 'flex-start', gap: '12px',
            padding: '12px 0',
            borderBottom: i < news.length - 1 ? '1px solid var(--border)' : 'none'
          }}>

            {/* Sentiment dot */}
            <div style={{
              width: '6px', height: '6px', borderRadius: '50%',
              marginTop: '6px', flexShrink: 0,
              background: sentimentColor(item.sentiment),
              boxShadow: sentimentGlow(item.sentiment)
            }} />

            <div style={{ flex: 1, minWidth: 0 }}>
              {/* Headline — clickable if URL exists */}
              {articleUrl ? (
                <a
                  href={articleUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'block',
                    fontSize: '13px', fontWeight: '500', lineHeight: '1.4',
                    marginBottom: '4px', color: 'var(--text)',
                    textDecoration: 'none'
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text)'}
                >
                  {item.headline}
                </a>
              ) : (
                <div style={{
                  fontSize: '13px', fontWeight: '500',
                  lineHeight: '1.4', marginBottom: '4px'
                }}>
                  {item.headline}
                </div>
              )}

              {/* Source + domain chip */}
              <div style={{
                fontFamily: 'DM Mono, monospace', fontSize: '10px',
                color: 'var(--text3)', display: 'flex',
                alignItems: 'center', gap: '8px', flexWrap: 'wrap'
              }}>
                <span>{item.source}</span>

                {/* Real URL chip */}
                {hasRealUrl && domain && (
                  <a
                    href={articleUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '3px',
                      color: 'var(--accent)', textDecoration: 'none',
                      background: 'rgba(79,142,247,0.08)',
                      border: '1px solid rgba(79,142,247,0.2)',
                      borderRadius: '4px', padding: '1px 6px', fontSize: '10px'
                    }}
                  >
                    ↗ {domain}
                  </a>
                )}

                {/* Training knowledge badge (no real URL) */}
                {!hasRealUrl && (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: '3px',
                    color: 'var(--amber)', fontSize: '10px',
                    background: 'rgba(245,158,11,0.08)',
                    border: '1px solid rgba(245,158,11,0.2)',
                    borderRadius: '4px', padding: '1px 6px'
                  }}>
                    ⚡ training data
                  </span>
                )}
              </div>
            </div>

          </div>
        )
      })}

    </div>
  )
}

export default NewsSection
