import { useState } from 'react'

// ── Tier config ───────────────────────────────────────────
const TIER_CONFIG = {
  verified: {
    icon: '✅',
    label: 'VERIFIED',
    color: 'var(--green)',
    bg: 'rgba(34,197,94,0.07)',
    border: 'rgba(34,197,94,0.25)',
    description: 'Multiple authoritative web sources found. High confidence in key data points.'
  },
  partial: {
    icon: '🔶',
    label: 'PARTIAL DATA',
    color: 'var(--amber)',
    bg: 'rgba(245,158,11,0.07)',
    border: 'rgba(245,158,11,0.25)',
    description: 'Mix of web-sourced and training knowledge data. Verify financials independently.'
  },
  limited: {
    icon: '⚠️',
    label: 'LIMITED DATA',
    color: '#f97316',
    bg: 'rgba(249,115,22,0.07)',
    border: 'rgba(249,115,22,0.3)',
    description: 'Minimal public data found. Manual verification strongly recommended.'
  },
  unverifiable: {
    icon: '🚨',
    label: 'UNVERIFIABLE',
    color: 'var(--red)',
    bg: 'rgba(239,68,68,0.07)',
    border: 'rgba(239,68,68,0.3)',
    description: 'Insufficient public data. Do not rely on this assessment without independent verification.'
  }
}

function ConfidenceDot({ confidence, size = 7 }) {
  const color = confidence === 'high'
    ? 'var(--green)'
    : confidence === 'medium'
    ? 'var(--amber)'
    : 'var(--red)'
  const label = confidence === 'high' ? 'Web-sourced' : confidence === 'medium' ? 'Training data' : 'Estimated'
  return (
    <span title={label} style={{
      display: 'inline-block',
      width: size, height: size,
      borderRadius: '50%',
      background: color,
      marginLeft: 4,
      verticalAlign: 'middle',
      flexShrink: 0
    }} />
  )
}

function SourceChip({ sourceId, sourceMap }) {
  if (!sourceId || !sourceMap?.[sourceId]) return null
  const src = sourceMap[sourceId]
  return (
    <a
      href={src.url}
      target="_blank"
      rel="noopener noreferrer"
      title={src.title}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        fontFamily: 'DM Mono, monospace',
        fontSize: '10px',
        color: 'var(--accent)',
        background: 'rgba(79,142,247,0.08)',
        border: '1px solid rgba(79,142,247,0.2)',
        borderRadius: '4px',
        padding: '2px 7px',
        textDecoration: 'none',
        marginLeft: '6px',
        verticalAlign: 'middle'
      }}
    >
      ↗ {src.domain}
    </a>
  )
}

function StaleBadge({ field, dataYear }) {
  return (
    <span title={`Data from ${dataYear} — may be outdated`} style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      fontFamily: 'DM Mono, monospace',
      fontSize: '10px',
      color: 'var(--amber)',
      background: 'rgba(245,158,11,0.1)',
      border: '1px solid rgba(245,158,11,0.25)',
      borderRadius: '4px',
      padding: '2px 7px',
      marginLeft: '6px'
    }}>
      🕐 {dataYear} data
    </span>
  )
}

function CredibilityBanner({ data }) {
  const [showVerify, setShowVerify] = useState(false)
  const [showLegend, setShowLegend] = useState(false)

  const tier = data.reliabilityTier || 'partial'
  const cfg = TIER_CONFIG[tier] || TIER_CONFIG.partial

  const lowCount = data.lowConfidenceFieldCount || 0
  const staleFields = data.staleFields || []
  const verifyLinks = data.verifyLinks || []
  const reliabilityAlert = data.reliabilityAlert

  const hasIssues = tier !== 'verified' || staleFields.length > 0 || lowCount > 2

  return (
    <div style={{
      background: cfg.bg,
      border: `1px solid ${cfg.border}`,
      borderRadius: '12px',
      padding: '16px 20px',
      marginBottom: '24px'
    }}>

      {/* Top row — tier badge + counts */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '10px',
        marginBottom: hasIssues ? '14px' : '0'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Tier badge */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '7px',
            padding: '5px 12px',
            borderRadius: '20px',
            background: cfg.color,
            color: tier === 'unverifiable' ? '#fff' : '#000',
            fontFamily: 'Syne, sans-serif',
            fontWeight: '800',
            fontSize: '11px',
            letterSpacing: '0.5px'
          }}>
            <span>{cfg.icon}</span>
            {cfg.label}
          </div>

          <span style={{ fontSize: '12px', color: 'var(--text2)', fontWeight: '300' }}>
            {cfg.description}
          </span>
        </div>

        {/* Stats pills */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Confidence legend toggle */}
          <button
            onClick={() => setShowLegend(v => !v)}
            style={{
              fontFamily: 'DM Mono, monospace',
              fontSize: '10px',
              color: 'var(--text3)',
              background: 'var(--surface2)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              padding: '4px 9px',
              cursor: 'pointer'
            }}
          >
            ● CONFIDENCE KEY
          </button>

          {/* Stale count */}
          {staleFields.length > 0 && (
            <span style={{
              fontFamily: 'DM Mono, monospace',
              fontSize: '10px',
              color: 'var(--amber)',
              background: 'rgba(245,158,11,0.1)',
              border: '1px solid rgba(245,158,11,0.25)',
              borderRadius: '6px',
              padding: '4px 9px'
            }}>
              🕐 {staleFields.length} stale field{staleFields.length > 1 ? 's' : ''}
            </span>
          )}

          {/* Low confidence count */}
          {lowCount > 0 && (
            <span style={{
              fontFamily: 'DM Mono, monospace',
              fontSize: '10px',
              color: lowCount > 3 ? 'var(--red)' : 'var(--amber)',
              background: lowCount > 3 ? 'rgba(239,68,68,0.08)' : 'rgba(245,158,11,0.08)',
              border: `1px solid ${lowCount > 3 ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)'}`,
              borderRadius: '6px',
              padding: '4px 9px'
            }}>
              ⚡ {lowCount} estimated field{lowCount > 1 ? 's' : ''}
            </span>
          )}

          {/* Verify links toggle */}
          {verifyLinks.length > 0 && (
            <button
              onClick={() => setShowVerify(v => !v)}
              style={{
                fontFamily: 'DM Mono, monospace',
                fontSize: '10px',
                color: 'var(--accent)',
                background: 'rgba(79,142,247,0.08)',
                border: '1px solid rgba(79,142,247,0.2)',
                borderRadius: '6px',
                padding: '4px 9px',
                cursor: 'pointer'
              }}
            >
              {showVerify ? '▲' : '▼'} VERIFY SOURCES ({verifyLinks.length})
            </button>
          )}
        </div>
      </div>

      {/* Confidence legend */}
      {showLegend && (
        <div style={{
          display: 'flex',
          gap: '20px',
          flexWrap: 'wrap',
          padding: '10px 14px',
          background: 'var(--surface2)',
          borderRadius: '8px',
          marginBottom: '12px',
          border: '1px solid var(--border)'
        }}>
          <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px', color: 'var(--text3)', marginRight: '4px' }}>
            CONFIDENCE DOTS:
          </div>
          {[
            { color: 'var(--green)', label: 'High — confirmed by web source' },
            { color: 'var(--amber)', label: 'Medium — from training data (likely accurate for large companies)' },
            { color: 'var(--red)',   label: 'Low — estimated or uncertain, verify independently' }
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
              <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px', color: 'var(--text2)' }}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Alert banner for limited / unverifiable */}
      {reliabilityAlert && (
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '10px',
          padding: '10px 14px',
          background: 'rgba(239,68,68,0.06)',
          border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: '8px',
          marginBottom: '12px'
        }}>
          <span style={{ fontSize: '14px', flexShrink: 0 }}>🚨</span>
          <span style={{ fontSize: '12px', color: 'var(--text2)', lineHeight: '1.5', fontWeight: '300' }}>
            <strong style={{ color: 'var(--red)' }}>Data Reliability Warning: </strong>
            {reliabilityAlert}
          </span>
        </div>
      )}

      {/* Stale fields list */}
      {staleFields.length > 0 && (
        <div style={{
          padding: '10px 14px',
          background: 'rgba(245,158,11,0.06)',
          border: '1px solid rgba(245,158,11,0.2)',
          borderRadius: '8px',
          marginBottom: '12px'
        }}>
          <div style={{
            fontFamily: 'DM Mono, monospace',
            fontSize: '10px',
            color: 'var(--amber)',
            letterSpacing: '1px',
            marginBottom: '8px'
          }}>
            🕐 STALE DATA DETECTED
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {staleFields.map((sf, i) => (
              <span key={i} style={{
                fontFamily: 'DM Mono, monospace',
                fontSize: '11px',
                color: 'var(--amber)',
                background: 'rgba(245,158,11,0.1)',
                border: '1px solid rgba(245,158,11,0.25)',
                borderRadius: '4px',
                padding: '3px 9px'
              }}>
                {sf.field} — data from {sf.dataYear}
              </span>
            ))}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '6px', fontWeight: '300' }}>
            These figures may no longer reflect current reality. Request updated documentation from the supplier.
          </div>
        </div>
      )}

      {/* Primary source verify links */}
      {showVerify && verifyLinks.length > 0 && (
        <div style={{
          padding: '14px',
          background: 'var(--surface2)',
          border: '1px solid var(--border2)',
          borderRadius: '8px'
        }}>
          <div style={{
            fontFamily: 'DM Mono, monospace',
            fontSize: '10px',
            color: 'var(--accent)',
            letterSpacing: '1px',
            marginBottom: '12px'
          }}>
            🔗 PRIMARY SOURCE VERIFICATION — Check these official portals independently
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '10px'
          }}>
            {verifyLinks.map((link, i) => (
              <a
                key={i}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '3px',
                  padding: '10px 12px',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  transition: 'border-color 0.15s'
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <span style={{
                    fontFamily: 'Syne, sans-serif',
                    fontSize: '12px',
                    fontWeight: '700',
                    color: 'var(--accent)'
                  }}>
                    {link.label}
                  </span>
                  <span style={{ fontSize: '12px' }}>↗</span>
                </div>
                <span style={{
                  fontFamily: 'DM Mono, monospace',
                  fontSize: '10px',
                  color: 'var(--text3)',
                  lineHeight: '1.4'
                }}>
                  {link.description}
                </span>
                <span style={{
                  fontFamily: 'DM Mono, monospace',
                  fontSize: '9px',
                  color: 'var(--text3)',
                  opacity: 0.6,
                  marginTop: '2px'
                }}>
                  {(() => { try { return new URL(link.url).hostname } catch { return link.url } })()}
                </span>
              </a>
            ))}
          </div>
          <div style={{
            marginTop: '10px',
            fontSize: '11px',
            color: 'var(--text3)',
            fontWeight: '300',
            lineHeight: '1.5'
          }}>
            ⓘ These are official government and exchange portals — not AI-generated data. Always verify CIN, GST, and financial filings directly before supplier onboarding.
          </div>
        </div>
      )}

    </div>
  )
}

export { ConfidenceDot, SourceChip, StaleBadge }
export default CredibilityBanner
