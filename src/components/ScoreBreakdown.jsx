import { useState } from 'react'
import { WEIGHTS, RUBRIC_BANDS, RED_FLAG_PENALTIES, TRUST_BONUSES } from '../utils/scoring'

function ScoreBreakdown({ factors, overallScore, redFlags = [], trustBonuses = [] }) {
  const [showRubric, setShowRubric] = useState(false)

  const scoreColor = overallScore >= 65
    ? 'var(--green)'
    : overallScore >= 40
    ? 'var(--amber)'
    : 'var(--red)'

  // Detect which factors have penalties or bonuses applied
  const hasAdjustments = factors.some(
    f => (f.penalties && f.penalties.length > 0) || (f.bonuses && f.bonuses.length > 0)
  )

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
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <div style={{
            fontFamily: 'DM Mono, monospace',
            fontSize: '10px',
            color: 'var(--accent)',
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
            marginBottom: '4px'
          }}>
            ⚖️ SCORE BREAKDOWN — MULTI-LAYER RUBRIC SYSTEM
          </div>
          <div style={{
            fontFamily: 'DM Mono, monospace',
            fontSize: '10px',
            color: 'var(--text3)',
            letterSpacing: '0.5px'
          }}>
            Layer 1: Rubric bands · Layer 2: Red flag penalties · Layer 3: Trust bonuses
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => setShowRubric(v => !v)}
            style={{
              fontFamily: 'DM Mono, monospace',
              fontSize: '10px',
              color: 'var(--accent)',
              background: 'rgba(79,142,247,0.08)',
              border: '1px solid rgba(79,142,247,0.2)',
              borderRadius: '6px',
              padding: '4px 10px',
              cursor: 'pointer',
              letterSpacing: '0.5px'
            }}
          >
            {showRubric ? '▲ HIDE' : '▼ VIEW'} RUBRIC
          </button>
          <div style={{
            fontFamily: 'Syne, sans-serif',
            fontSize: '22px',
            fontWeight: '800',
            color: scoreColor,
            letterSpacing: '-1px'
          }}>
            {overallScore}<span style={{
              fontSize: '12px',
              color: 'var(--text3)',
              fontWeight: '400',
              letterSpacing: '0px'
            }}>/100</span>
          </div>
        </div>
      </div>

      {/* Rubric Reference Table (expandable) */}
      {showRubric && (
        <div style={{
          marginBottom: '24px',
          padding: '16px',
          background: 'var(--surface2)',
          borderRadius: '10px',
          border: '1px solid var(--border2)'
        }}>
          <div style={{
            fontFamily: 'DM Mono, monospace',
            fontSize: '10px',
            color: 'var(--text3)',
            letterSpacing: '1px',
            marginBottom: '14px'
          }}>
            SCORING RUBRIC — BAND THRESHOLDS (INDIA-CONTEXT)
          </div>

          {/* Band legend */}
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '16px' }}>
            {[
              { range: '80–100', label: 'Strong/Clean',  color: 'var(--green)' },
              { range: '60–79',  label: 'Good/Stable',   color: 'var(--green)', dim: true },
              { range: '40–59',  label: 'Moderate/Risk', color: 'var(--amber)' },
              { range: '0–39',   label: 'Weak/Serious',  color: 'var(--red)'   }
            ].map(item => (
              <div key={item.range} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontFamily: 'DM Mono, monospace',
                fontSize: '10px',
                color: 'var(--text3)'
              }}>
                <div style={{
                  width: '10px', height: '10px',
                  borderRadius: '2px',
                  background: item.color,
                  opacity: item.dim ? 0.5 : 1
                }} />
                {item.range} = {item.label}
              </div>
            ))}
          </div>

          {/* Per-factor rubric rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {factors.map((factor) => {
              const bands = RUBRIC_BANDS[factor.name]
              if (!bands) return null
              return (
                <div key={factor.name} style={{ marginBottom: '4px' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginBottom: '6px'
                  }}>
                    <span style={{ fontSize: '13px' }}>{factor.icon}</span>
                    <span style={{
                      fontFamily: 'Syne, sans-serif',
                      fontSize: '12px',
                      fontWeight: '700',
                      color: 'var(--text2)'
                    }}>{factor.name}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {bands.map((b) => {
                      const isActive = factor.band === b.band
                      return (
                        <div key={b.band} style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontFamily: 'DM Mono, monospace',
                          fontSize: '10px',
                          border: `1px solid ${isActive ? b.color : 'var(--border)'}`,
                          background: isActive ? `${b.color}18` : 'transparent',
                          color: isActive ? b.color : 'var(--text3)',
                          fontWeight: isActive ? '600' : '400'
                        }}>
                          {b.band} · {b.threshold}
                          {isActive && ' ✓'}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Red flags + Bonuses reference */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
            marginTop: '16px',
            paddingTop: '12px',
            borderTop: '1px solid var(--border)'
          }}>
            <div>
              <div style={{
                fontFamily: 'DM Mono, monospace',
                fontSize: '10px',
                color: 'var(--red)',
                letterSpacing: '1px',
                marginBottom: '8px'
              }}>
                LAYER 2 · RED FLAG PENALTIES
              </div>
              {RED_FLAG_PENALTIES.map((p, i) => (
                <div key={i} style={{
                  fontSize: '11px',
                  color: 'var(--text3)',
                  marginBottom: '3px',
                  fontFamily: 'DM Mono, monospace',
                  display: 'flex',
                  gap: '6px'
                }}>
                  <span style={{ color: 'var(--red)', flexShrink: 0 }}>{p.penalty}</span>
                  <span>{p.trigger}</span>
                </div>
              ))}
            </div>
            <div>
              <div style={{
                fontFamily: 'DM Mono, monospace',
                fontSize: '10px',
                color: 'var(--green)',
                letterSpacing: '1px',
                marginBottom: '8px'
              }}>
                LAYER 3 · TRUST BONUSES
              </div>
              {TRUST_BONUSES.map((b, i) => (
                <div key={i} style={{
                  fontSize: '11px',
                  color: 'var(--text3)',
                  marginBottom: '3px',
                  fontFamily: 'DM Mono, monospace',
                  display: 'flex',
                  gap: '6px'
                }}>
                  <span style={{ color: 'var(--green)', flexShrink: 0 }}>+{b.bonus}</span>
                  <span>{b.trigger}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Red Flags & Bonuses Applied (if any) */}
      {(redFlags.length > 0 || trustBonuses.length > 0) && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: redFlags.length > 0 && trustBonuses.length > 0 ? '1fr 1fr' : '1fr',
          gap: '12px',
          marginBottom: '20px',
          paddingBottom: '20px',
          borderBottom: '1px solid var(--border)'
        }}>
          {redFlags.length > 0 && (
            <div style={{
              background: 'rgba(239,68,68,0.06)',
              border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: '8px',
              padding: '12px 14px'
            }}>
              <div style={{
                fontFamily: 'DM Mono, monospace',
                fontSize: '10px',
                color: 'var(--red)',
                letterSpacing: '1px',
                marginBottom: '8px'
              }}>
                🚩 RED FLAGS DETECTED
              </div>
              {redFlags.map((flag, i) => (
                <div key={i} style={{
                  fontSize: '12px',
                  color: 'var(--text2)',
                  marginBottom: '4px',
                  display: 'flex',
                  gap: '8px',
                  fontWeight: '300'
                }}>
                  <span style={{ color: 'var(--red)', flexShrink: 0 }}>—</span>
                  {flag}
                </div>
              ))}
            </div>
          )}
          {trustBonuses.length > 0 && (
            <div style={{
              background: 'rgba(34,197,94,0.06)',
              border: '1px solid rgba(34,197,94,0.2)',
              borderRadius: '8px',
              padding: '12px 14px'
            }}>
              <div style={{
                fontFamily: 'DM Mono, monospace',
                fontSize: '10px',
                color: 'var(--green)',
                letterSpacing: '1px',
                marginBottom: '8px'
              }}>
                ✦ TRUST BONUSES APPLIED
              </div>
              {trustBonuses.map((bonus, i) => (
                <div key={i} style={{
                  fontSize: '12px',
                  color: 'var(--text2)',
                  marginBottom: '4px',
                  display: 'flex',
                  gap: '8px',
                  fontWeight: '300'
                }}>
                  <span style={{ color: 'var(--green)', flexShrink: 0 }}>+</span>
                  {bonus}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Formula rows */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        marginBottom: '20px'
      }}>
        {factors.map((factor, i) => {
          const config = WEIGHTS[factor.name]
          if (!config) return null

          const contribution = Math.round(factor.score * config.weight)
          const barColor = factor.status === 'green'
            ? 'var(--green)'
            : factor.status === 'amber'
            ? 'var(--amber)'
            : 'var(--red)'

          const hasPenalties = factor.penalties && factor.penalties.length > 0
          const hasBonuses = factor.bonuses && factor.bonuses.length > 0

          return (
            <div key={i}>
              {/* Row top */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '4px',
                flexWrap: 'wrap'
              }}>
                <span style={{ fontSize: '14px' }}>{factor.icon}</span>

                <span style={{
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: '13px',
                  fontWeight: '500',
                  flex: 1,
                  minWidth: '120px'
                }}>
                  {factor.name}
                </span>

                {/* Band pill */}
                {factor.band && (
                  <span style={{
                    fontFamily: 'DM Mono, monospace',
                    fontSize: '9px',
                    color: barColor,
                    background: `${barColor}15`,
                    border: `1px solid ${barColor}40`,
                    padding: '2px 7px',
                    borderRadius: '4px'
                  }}>
                    BAND {factor.band}
                  </span>
                )}

                {/* Weight badge */}
                <span style={{
                  fontFamily: 'DM Mono, monospace',
                  fontSize: '10px',
                  color: 'var(--text3)',
                  background: 'var(--surface2)',
                  border: '1px solid var(--border)',
                  padding: '2px 7px',
                  borderRadius: '4px'
                }}>
                  ×{config.label}
                </span>

                {/* Score */}
                <span style={{
                  fontFamily: 'DM Mono, monospace',
                  fontSize: '12px',
                  color: 'var(--text2)',
                  minWidth: '42px',
                  textAlign: 'right'
                }}>
                  {factor.score}/100
                </span>

                <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '11px', color: 'var(--text3)' }}>
                  =
                </span>

                {/* Contribution */}
                <span style={{
                  fontFamily: 'Syne, sans-serif',
                  fontSize: '13px',
                  fontWeight: '700',
                  color: barColor,
                  minWidth: '28px',
                  textAlign: 'right'
                }}>
                  {contribution}
                </span>
              </div>

              {/* Penalties / bonuses chips */}
              {(hasPenalties || hasBonuses) && (
                <div style={{
                  display: 'flex',
                  gap: '6px',
                  flexWrap: 'wrap',
                  marginBottom: '5px',
                  marginLeft: '22px'
                }}>
                  {(factor.penalties || []).map((p, pi) => (
                    <span key={pi} style={{
                      fontFamily: 'DM Mono, monospace',
                      fontSize: '10px',
                      color: 'var(--red)',
                      background: 'rgba(239,68,68,0.08)',
                      border: '1px solid rgba(239,68,68,0.2)',
                      padding: '2px 7px',
                      borderRadius: '4px'
                    }}>
                      {p}
                    </span>
                  ))}
                  {(factor.bonuses || []).map((b, bi) => (
                    <span key={bi} style={{
                      fontFamily: 'DM Mono, monospace',
                      fontSize: '10px',
                      color: 'var(--green)',
                      background: 'rgba(34,197,94,0.08)',
                      border: '1px solid rgba(34,197,94,0.2)',
                      padding: '2px 7px',
                      borderRadius: '4px'
                    }}>
                      {b}
                    </span>
                  ))}
                </div>
              )}

              {/* Band reason */}
              {factor.bandReason && (
                <div style={{
                  fontFamily: 'DM Mono, monospace',
                  fontSize: '10px',
                  color: 'var(--text3)',
                  marginBottom: '5px',
                  marginLeft: '22px',
                  lineHeight: '1.5'
                }}>
                  {factor.bandReason}
                </div>
              )}

              {/* Progress bar */}
              <div style={{
                height: '4px',
                background: 'var(--border)',
                borderRadius: '2px',
                overflow: 'hidden'
              }}>
                <div style={{
                  height: '100%',
                  width: `${factor.score}%`,
                  background: barColor,
                  borderRadius: '2px',
                  transition: 'width 0.8s ease'
                }} />
              </div>
            </div>
          )
        })}
      </div>

      {/* Total row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: '14px',
        borderTop: '1px solid var(--border2)'
      }}>
        <div>
          <div style={{
            fontFamily: 'DM Mono, monospace',
            fontSize: '11px',
            color: 'var(--text3)',
            letterSpacing: '1px',
            marginBottom: '2px'
          }}>
            WEIGHTED TOTAL SCORE
          </div>
          <div style={{
            fontFamily: 'DM Mono, monospace',
            fontSize: '10px',
            color: 'var(--text3)',
            opacity: 0.6
          }}>
            Rubric + penalties + bonuses applied
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            fontFamily: 'Syne, sans-serif',
            fontSize: '28px',
            fontWeight: '800',
            color: scoreColor,
            letterSpacing: '-1px'
          }}>
            {overallScore}
          </div>
          <div style={{
            padding: '4px 12px',
            borderRadius: '6px',
            fontFamily: 'Syne, sans-serif',
            fontWeight: '700',
            fontSize: '11px',
            letterSpacing: '0.5px',
            background: scoreColor,
            color: overallScore >= 40 ? '#000' : '#fff'
          }}>
            {overallScore >= 65
              ? 'APPROVED'
              : overallScore >= 40
              ? 'CONDITIONAL'
              : 'REJECTED'}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div style={{
        marginTop: '14px',
        display: 'flex',
        gap: '16px',
        flexWrap: 'wrap'
      }}>
        {[
          { range: '65–100', label: 'Approved',    color: 'var(--green)' },
          { range: '40–64',  label: 'Conditional', color: 'var(--amber)' },
          { range: '0–39',   label: 'Rejected',    color: 'var(--red)'   }
        ].map(item => (
          <div key={item.label} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontFamily: 'DM Mono, monospace',
            fontSize: '10px',
            color: 'var(--text3)'
          }}>
            <div style={{
              width: '8px', height: '8px',
              borderRadius: '50%',
              background: item.color
            }} />
            {item.range} = {item.label}
          </div>
        ))}
      </div>

    </div>
  )
}

export default ScoreBreakdown
