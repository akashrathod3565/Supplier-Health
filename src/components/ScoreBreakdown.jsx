import { WEIGHTS } from '../utils/scoring'

function ScoreBreakdown({ factors, overallScore }) {
  const scoreColor = overallScore >= 65
    ? 'var(--green)'
    : overallScore >= 40
    ? 'var(--amber)'
    : 'var(--red)'

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
        <div style={{
          fontFamily: 'DM Mono, monospace',
          fontSize: '10px',
          color: 'var(--accent)',
          letterSpacing: '1.5px',
          textTransform: 'uppercase'
        }}>
          ⚖️ SCORE BREAKDOWN — HOW WE CALCULATED YOUR RESULT
        </div>
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

      {/* Formula rows */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
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

          return (
            <div key={i}>
              {/* Row top — name, weight, score, contribution */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '5px',
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

                {/* Equals */}
                <span style={{
                  fontFamily: 'DM Mono, monospace',
                  fontSize: '11px',
                  color: 'var(--text3)'
                }}>
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
        <div style={{
          fontFamily: 'DM Mono, monospace',
          fontSize: '11px',
          color: 'var(--text3)',
          letterSpacing: '1px'
        }}>
          WEIGHTED TOTAL SCORE
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
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