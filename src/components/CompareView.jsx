function CompareView({ result1, result2 }) {
  const getScoreColor = (score) =>
    score >= 65 ? 'var(--green)' : score >= 40 ? 'var(--amber)' : 'var(--red)'

  const getVerdictColor = (verdict) =>
    verdict === 'APPROVED' ? 'var(--green)' : verdict === 'CONDITIONAL' ? 'var(--amber)' : 'var(--red)'

  const isResult1Winner = result1.overallScore >= result2.overallScore

  const comparisonRows = [
    { label: 'Industry',        key: 'industry'      },
    { label: 'Founded',         key: 'founded'       },
    { label: 'Employees',       key: 'employees'     },
    { label: 'Headquarters',    key: 'headquarters'  },
    { label: 'Annual Revenue',  key: 'annualRevenue' },
    { label: 'Market Cap',      key: 'marketCap'     },
    { label: 'Stock Exchange',  key: 'stockExchange' },
    { label: 'Parent Company',  key: 'parentCompany' },
    { label: 'Supplier Type',   key: 'supplierType'  },
    { label: 'Country',         key: 'country'       },
  ]

  const renderCell = (value) => {
    const isMissing = !value || value === 'Not found' || value === 'N/A' || value === ''
    return (
      <div style={{
        fontSize: '13px',
        color: isMissing ? 'var(--text3)' : 'var(--text)',
        fontWeight: isMissing ? '300' : '400',
        fontStyle: isMissing ? 'italic' : 'normal',
        lineHeight: '1.4'
      }}>
        {value || 'Not found'}
      </div>
    )
  }

  return (
    <div>

      {/* Verdict header cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr',
        gap: '12px',
        marginBottom: '24px',
        alignItems: 'stretch'
      }}>
        {/* Supplier 1 */}
        <div style={{
          background: 'var(--surface)',
          border: `2px solid ${isResult1Winner ? getScoreColor(result1.overallScore) : 'var(--border)'}`,
          borderRadius: '14px',
          padding: '22px',
          position: 'relative'
        }}>
          {isResult1Winner && (
            <div style={{
              position: 'absolute',
              top: '-11px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'var(--green)',
              color: '#000',
              fontFamily: 'Syne, sans-serif',
              fontSize: '10px',
              fontWeight: '800',
              padding: '3px 14px',
              borderRadius: '20px',
              letterSpacing: '1px',
              whiteSpace: 'nowrap'
            }}>
              ★ RECOMMENDED
            </div>
          )}
          <div style={{
            fontFamily: 'Syne, sans-serif',
            fontSize: '15px',
            fontWeight: '800',
            marginBottom: '4px',
            lineHeight: '1.3'
          }}>
            {result1.supplierName}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text3)', marginBottom: '16px' }}>
            {result1.industry}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              fontFamily: 'Syne, sans-serif',
              fontSize: '42px',
              fontWeight: '800',
              letterSpacing: '-2px',
              color: getScoreColor(result1.overallScore),
              lineHeight: 1
            }}>
              {result1.overallScore}
            </div>
            <div>
              <div style={{
                fontFamily: 'DM Mono, monospace',
                fontSize: '9px',
                color: 'var(--text3)',
                marginBottom: '6px',
                letterSpacing: '0.5px'
              }}>
                RISK SCORE /100
              </div>
              <div style={{
                padding: '5px 12px',
                borderRadius: '6px',
                background: getVerdictColor(result1.verdict),
                color: result1.verdict === 'REJECTED' ? '#fff' : '#000',
                fontFamily: 'Syne, sans-serif',
                fontWeight: '800',
                fontSize: '11px',
                letterSpacing: '0.5px',
                display: 'inline-block'
              }}>
                {result1.verdict}
              </div>
            </div>
          </div>
        </div>

        {/* VS divider */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '44px'
        }}>
          <div style={{
            fontFamily: 'Syne, sans-serif',
            fontSize: '14px',
            fontWeight: '800',
            color: 'var(--text3)',
            background: 'var(--surface2)',
            border: '1px solid var(--border)',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            VS
          </div>
        </div>

        {/* Supplier 2 */}
        <div style={{
          background: 'var(--surface)',
          border: `2px solid ${!isResult1Winner ? getScoreColor(result2.overallScore) : 'var(--border)'}`,
          borderRadius: '14px',
          padding: '22px',
          position: 'relative'
        }}>
          {!isResult1Winner && (
            <div style={{
              position: 'absolute',
              top: '-11px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'var(--green)',
              color: '#000',
              fontFamily: 'Syne, sans-serif',
              fontSize: '10px',
              fontWeight: '800',
              padding: '3px 14px',
              borderRadius: '20px',
              letterSpacing: '1px',
              whiteSpace: 'nowrap'
            }}>
              ★ RECOMMENDED
            </div>
          )}
          <div style={{
            fontFamily: 'Syne, sans-serif',
            fontSize: '15px',
            fontWeight: '800',
            marginBottom: '4px',
            lineHeight: '1.3'
          }}>
            {result2.supplierName}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text3)', marginBottom: '16px' }}>
            {result2.industry}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              fontFamily: 'Syne, sans-serif',
              fontSize: '42px',
              fontWeight: '800',
              letterSpacing: '-2px',
              color: getScoreColor(result2.overallScore),
              lineHeight: 1
            }}>
              {result2.overallScore}
            </div>
            <div>
              <div style={{
                fontFamily: 'DM Mono, monospace',
                fontSize: '9px',
                color: 'var(--text3)',
                marginBottom: '6px',
                letterSpacing: '0.5px'
              }}>
                RISK SCORE /100
              </div>
              <div style={{
                padding: '5px 12px',
                borderRadius: '6px',
                background: getVerdictColor(result2.verdict),
                color: result2.verdict === 'REJECTED' ? '#fff' : '#000',
                fontFamily: 'Syne, sans-serif',
                fontWeight: '800',
                fontSize: '11px',
                letterSpacing: '0.5px',
                display: 'inline-block'
              }}>
                {result2.verdict}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Score bar comparison */}
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '24px'
      }}>
        <div style={{
          fontFamily: 'DM Mono, monospace',
          fontSize: '10px',
          color: 'var(--accent)',
          letterSpacing: '1.5px',
          textTransform: 'uppercase',
          marginBottom: '16px'
        }}>
          ⚖️ FACTOR-BY-FACTOR COMPARISON
        </div>

        {/* Column headers */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 120px 1fr',
          gap: '8px',
          marginBottom: '14px',
          paddingBottom: '10px',
          borderBottom: '1px solid var(--border2)'
        }}>
          <div style={{
            fontFamily: 'DM Mono, monospace',
            fontSize: '10px',
            color: 'var(--text3)',
            textAlign: 'right'
          }}>
            {result1.supplierName.split(' ').slice(0, 2).join(' ')}
          </div>
          <div style={{
            fontFamily: 'DM Mono, monospace',
            fontSize: '10px',
            color: 'var(--text3)',
            textAlign: 'center'
          }}>
            FACTOR
          </div>
          <div style={{
            fontFamily: 'DM Mono, monospace',
            fontSize: '10px',
            color: 'var(--text3)',
            textAlign: 'left'
          }}>
            {result2.supplierName.split(' ').slice(0, 2).join(' ')}
          </div>
        </div>

        {/* Factor rows */}
        {result1.factors.map((f1, i) => {
          const f2 = result2.factors.find(f => f.name === f1.name) || {}
          const score1 = f1.score || 0
          const score2 = f2.score || 0
          const color1 = f1.status === 'green' ? 'var(--green)' : f1.status === 'amber' ? 'var(--amber)' : 'var(--red)'
          const color2 = f2.status === 'green' ? 'var(--green)' : f2.status === 'amber' ? 'var(--amber)' : 'var(--red)'
          const winner1 = score1 >= score2

          return (
            <div key={i} style={{
              marginBottom: '18px',
              paddingBottom: '18px',
              borderBottom: i < result1.factors.length - 1 ? '1px solid var(--border)' : 'none'
            }}>
              {/* Factor name */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                marginBottom: '10px'
              }}>
                <span style={{ fontSize: '14px' }}>{f1.icon}</span>
                <span style={{
                  fontFamily: 'Syne, sans-serif',
                  fontSize: '12px',
                  fontWeight: '700',
                  color: 'var(--text2)'
                }}>
                  {f1.name}
                </span>
              </div>

              {/* Bar comparison */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 56px 1fr',
                gap: '8px',
                alignItems: 'center'
              }}>
                {/* Left bar (supplier 1, grows left from center) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end' }}>
                  <span style={{
                    fontFamily: 'Syne, sans-serif',
                    fontSize: '16px',
                    fontWeight: '800',
                    color: color1,
                    minWidth: '28px',
                    textAlign: 'right'
                  }}>
                    {score1}
                  </span>
                  <div style={{
                    flex: 1,
                    height: '8px',
                    background: 'var(--border)',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    maxWidth: '140px'
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${score1}%`,
                      background: color1,
                      borderRadius: '4px',
                      marginLeft: 'auto'
                    }} />
                  </div>
                  {winner1 && score1 !== score2 && (
                    <span style={{ fontSize: '10px', color: 'var(--green)' }}>▲</span>
                  )}
                </div>

                {/* VS */}
                <div style={{
                  fontFamily: 'DM Mono, monospace',
                  fontSize: '9px',
                  color: 'var(--text3)',
                  textAlign: 'center'
                }}>
                  VS
                </div>

                {/* Right bar (supplier 2) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {!winner1 && score1 !== score2 && (
                    <span style={{ fontSize: '10px', color: 'var(--green)' }}>▲</span>
                  )}
                  <div style={{
                    flex: 1,
                    height: '8px',
                    background: 'var(--border)',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    maxWidth: '140px'
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${score2}%`,
                      background: color2,
                      borderRadius: '4px'
                    }} />
                  </div>
                  <span style={{
                    fontFamily: 'Syne, sans-serif',
                    fontSize: '16px',
                    fontWeight: '800',
                    color: color2,
                    minWidth: '28px'
                  }}>
                    {score2}
                  </span>
                </div>
              </div>

              {/* Value labels */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 56px 1fr',
                gap: '8px',
                marginTop: '6px'
              }}>
                <div style={{ fontSize: '11px', color: 'var(--text3)', textAlign: 'right' }}>{f1.value}</div>
                <div />
                <div style={{ fontSize: '11px', color: 'var(--text3)' }}>{f2.value}</div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Key metrics table */}
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '24px'
      }}>
        <div style={{
          fontFamily: 'DM Mono, monospace',
          fontSize: '10px',
          color: 'var(--accent)',
          letterSpacing: '1.5px',
          textTransform: 'uppercase',
          marginBottom: '16px'
        }}>
          📋 KEY METRICS COMPARISON
        </div>

        {/* Table header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '140px 1fr 1fr',
          gap: '12px',
          padding: '8px 0',
          borderBottom: '1px solid var(--border2)',
          marginBottom: '4px'
        }}>
          <div />
          <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px', color: 'var(--text3)', fontWeight: '600' }}>
            {result1.supplierName.split(' ').slice(0, 2).join(' ')}
          </div>
          <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px', color: 'var(--text3)', fontWeight: '600' }}>
            {result2.supplierName.split(' ').slice(0, 2).join(' ')}
          </div>
        </div>

        {comparisonRows.map(({ label, key }) => (
          <div key={key} style={{
            display: 'grid',
            gridTemplateColumns: '140px 1fr 1fr',
            gap: '12px',
            padding: '10px 0',
            borderBottom: '1px solid var(--border)',
            alignItems: 'start'
          }}>
            <div style={{
              fontFamily: 'DM Mono, monospace',
              fontSize: '10px',
              color: 'var(--text3)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              paddingTop: '2px'
            }}>
              {label}
            </div>
            {renderCell(result1[key])}
            {renderCell(result2[key])}
          </div>
        ))}

        {/* Certifications row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '140px 1fr 1fr',
          gap: '12px',
          padding: '12px 0',
          borderBottom: '1px solid var(--border)',
          alignItems: 'start'
        }}>
          <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px', color: 'var(--text3)', textTransform: 'uppercase', paddingTop: '2px' }}>
            Certifications
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {(result1.certifications || []).map((c, i) => (
              <span key={i} style={{
                fontFamily: 'DM Mono, monospace',
                fontSize: '10px',
                padding: '2px 7px',
                borderRadius: '4px',
                background: 'rgba(34,197,94,0.1)',
                color: 'var(--green)',
                border: '1px solid rgba(34,197,94,0.25)'
              }}>{c}</span>
            ))}
            {(!result1.certifications || result1.certifications.length === 0) && (
              <span style={{ fontSize: '13px', color: 'var(--text3)', fontStyle: 'italic' }}>Not found</span>
            )}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {(result2.certifications || []).map((c, i) => (
              <span key={i} style={{
                fontFamily: 'DM Mono, monospace',
                fontSize: '10px',
                padding: '2px 7px',
                borderRadius: '4px',
                background: 'rgba(34,197,94,0.1)',
                color: 'var(--green)',
                border: '1px solid rgba(34,197,94,0.25)'
              }}>{c}</span>
            ))}
            {(!result2.certifications || result2.certifications.length === 0) && (
              <span style={{ fontSize: '13px', color: 'var(--text3)', fontStyle: 'italic' }}>Not found</span>
            )}
          </div>
        </div>

        {/* Key Products row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '140px 1fr 1fr',
          gap: '12px',
          padding: '12px 0',
          alignItems: 'start'
        }}>
          <div style={{ fontFamily: 'DM Mono, monospace', fontSize: '10px', color: 'var(--text3)', textTransform: 'uppercase', paddingTop: '2px' }}>
            Key Products
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text2)', lineHeight: '1.6' }}>
            {(result1.keyProducts || []).join(', ') || 'Not found'}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text2)', lineHeight: '1.6' }}>
            {(result2.keyProducts || []).join(', ') || 'Not found'}
          </div>
        </div>
      </div>

      {/* Recommendation banner */}
      <div style={{
        background: `linear-gradient(135deg, rgba(34,197,94,0.1), rgba(34,197,94,0.04))`,
        border: '1px solid rgba(34,197,94,0.3)',
        borderRadius: '12px',
        padding: '22px',
        marginBottom: '24px'
      }}>
        <div style={{
          fontFamily: 'DM Mono, monospace',
          fontSize: '10px',
          color: 'var(--green)',
          letterSpacing: '1.5px',
          textTransform: 'uppercase',
          marginBottom: '10px'
        }}>
          🏆 PROCUREMENT RECOMMENDATION
        </div>
        <div style={{
          fontFamily: 'Syne, sans-serif',
          fontSize: '17px',
          fontWeight: '800',
          marginBottom: '8px'
        }}>
          {isResult1Winner ? result1.supplierName : result2.supplierName} is recommended
        </div>
        <div style={{ fontSize: '13px', color: 'var(--text2)', fontWeight: '300', lineHeight: '1.7' }}>
          {isResult1Winner ? result1.verdictReason : result2.verdictReason} With a risk score of{' '}
          <strong style={{ color: 'var(--green)' }}>
            {isResult1Winner ? result1.overallScore : result2.overallScore}/100
          </strong>{' '}
          compared to{' '}
          <strong style={{ color: 'var(--text2)' }}>
            {isResult1Winner ? result2.overallScore : result1.overallScore}/100
          </strong>
          , this supplier presents the lower procurement risk for onboarding.
        </div>
      </div>

    </div>
  )
}

export default CompareView
