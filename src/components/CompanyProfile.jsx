function ConfidenceBadge({ level }) {
  const config = {
    high:   { color: 'var(--green)', bg: 'var(--green-dim)',  label: '● High Confidence'   },
    medium: { color: 'var(--amber)', bg: 'var(--amber-dim)',  label: '◐ Medium Confidence' },
    low:    { color: 'var(--red)',   bg: 'var(--red-dim)',    label: '○ Low Confidence'    }
  }
  const c = config[level] || config.low
  return (
    <span style={{
      fontFamily: 'DM Mono, monospace',
      fontSize: '10px',
      color: c.color,
      background: c.bg,
      padding: '2px 8px',
      borderRadius: '4px',
      letterSpacing: '0.3px'
    }}>
      {c.label}
    </span>
  )
}

function InfoItem({ label, value, confidence }) {
  const isMissing = !value ||
    value === 'Not found' ||
    value === 'N/A' ||
    value.startsWith('Unverified')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <div style={{
        fontFamily: 'DM Mono, monospace',
        fontSize: '10px',
        color: 'var(--text3)',
        letterSpacing: '1px',
        textTransform: 'uppercase',
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
      }}>
        {label}
        {confidence && <ConfidenceBadge level={confidence} />}
      </div>
      <div style={{
        fontSize: '13px',
        color: isMissing ? 'var(--text3)' : 'var(--text)',
        fontWeight: isMissing ? '300' : '500',
        fontStyle: isMissing ? 'italic' : 'normal',
        wordBreak: 'break-word'
      }}>
        {value || 'Not found'}
      </div>
    </div>
  )
}

function CompanyProfile({ data }) {
  const dc = data.dataConfidence || {}

  const supplierTypeColor = {
    'Large Enterprise': 'var(--green)',
    'SME':              'var(--accent)',
    'MSME':             'var(--amber)',
    'Micro Enterprise': 'var(--amber)',
    'Startup':          'var(--accent2)'
  }

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: '12px',
      padding: '20px',
      marginBottom: '24px'
    }}>

      {/* Header row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <div style={{
          fontFamily: 'DM Mono, monospace',
          fontSize: '10px',
          color: 'var(--accent)',
          letterSpacing: '1.5px',
          textTransform: 'uppercase'
        }}>
          🏢 COMPANY PROFILE
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Supplier type badge */}
          {data.supplierType && (
            <span style={{
              fontFamily: 'DM Mono, monospace',
              fontSize: '10px',
              color: supplierTypeColor[data.supplierType] || 'var(--text2)',
              background: 'var(--surface2)',
              border: `1px solid ${supplierTypeColor[data.supplierType] || 'var(--border)'}`,
              padding: '3px 10px',
              borderRadius: '20px'
            }}>
              {data.supplierType}
            </span>
          )}
          {/* Overall data confidence */}
          {dc.overall && <ConfidenceBadge level={dc.overall} />}
        </div>
      </div>

      {/* Info Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '20px',
        marginBottom: '24px',
        paddingBottom: '24px',
        borderBottom: '1px solid var(--border)'
      }}>
        <InfoItem label="Headquarters"     value={data.headquarters}  confidence={null} />
        <InfoItem label="Employees"        value={data.employees}     confidence={dc.employees} />
        <InfoItem label="Founded"          value={data.founded}       confidence={null} />
        <InfoItem label="CIN Number"       value={data.cin}           confidence={dc.cin} />
        <InfoItem label="GST Number"       value={data.gstNumber}     confidence={null} />
        <InfoItem label="Udyam Number"     value={data.udyamNumber}   confidence={null} />
        <InfoItem label="Website"          value={data.website}       confidence={null} />
        <InfoItem label="Contact Email"    value={data.contactEmail}  confidence={null} />
        <InfoItem label="Contact Phone"    value={data.contactPhone}  confidence={null} />
      </div>

      {/* Board Members */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '14px'
        }}>
          <div style={{
            fontFamily: 'DM Mono, monospace',
            fontSize: '10px',
            color: 'var(--text3)',
            letterSpacing: '1.5px',
            textTransform: 'uppercase'
          }}>
            BOARD OF DIRECTORS
          </div>
          {dc.boardMembers && <ConfidenceBadge level={dc.boardMembers} />}
        </div>

        {data.boardMembers?.length > 0 ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: '10px'
          }}>
            {data.boardMembers.map((member, i) => {
              const isUnknown = !member.name ||
                member.name === 'Not found' ||
                member.name === 'Not publicly available'
              return (
                <div key={i} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  background: 'var(--surface2)',
                  border: '1px solid var(--border)',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  opacity: isUnknown ? 0.5 : 1
                }}>
                  <div style={{
                    width: '36px', height: '36px',
                    borderRadius: '50%',
                    background: isUnknown
                      ? 'var(--border2)'
                      : 'linear-gradient(135deg, var(--accent), var(--accent2))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'Syne, sans-serif',
                    fontWeight: '700',
                    fontSize: '13px',
                    color: '#fff',
                    flexShrink: 0
                  }}>
                    {isUnknown ? '?' : member.name?.charAt(0)}
                  </div>
                  <div>
                    <div style={{
                      fontFamily: 'Syne, sans-serif',
                      fontSize: '13px',
                      fontWeight: '700',
                      marginBottom: '2px'
                    }}>
                      {member.name}
                    </div>
                    <div style={{
                      fontSize: '11px',
                      color: 'var(--text3)',
                      fontWeight: '300'
                    }}>
                      {member.designation}
                    </div>
                    {member.confidence === 'low' && (
                      <div style={{
                        fontSize: '10px',
                        color: 'var(--amber)',
                        marginTop: '2px',
                        fontFamily: 'DM Mono, monospace'
                      }}>
                        ⚠ unverified
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div style={{
            fontSize: '13px',
            color: 'var(--text3)',
            fontStyle: 'italic'
          }}>
            Board information not publicly available
          </div>
        )}
      </div>

      {/* Data Warnings */}
      {data.dataWarnings?.length > 0 && (
        <div style={{
          background: 'rgba(245,158,11,0.06)',
          border: '1px solid rgba(245,158,11,0.2)',
          borderRadius: '8px',
          padding: '14px 16px'
        }}>
          <div style={{
            fontFamily: 'DM Mono, monospace',
            fontSize: '10px',
            color: 'var(--amber)',
            letterSpacing: '1px',
            marginBottom: '8px'
          }}>
            ⚠ DATA VERIFICATION WARNINGS
          </div>
          {data.dataWarnings.map((w, i) => (
            <div key={i} style={{
              fontSize: '12px',
              color: 'var(--text2)',
              marginBottom: '4px',
              display: 'flex',
              gap: '8px',
              fontWeight: '300'
            }}>
              <span style={{ color: 'var(--amber)', flexShrink: 0 }}>—</span>
              {w}
            </div>
          ))}
        </div>
      )}

    </div>
  )
}

export default CompanyProfile