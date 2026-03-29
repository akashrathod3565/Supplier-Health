function InfoItem({ label, value, isLink }) {
  const isMissing = !value || value === 'Not found' || value === 'N/A' || value === '' || value.startsWith('Unverified')

  const textStyle = {
    fontSize: '13px',
    color: isMissing ? 'var(--text3)' : isLink ? 'var(--accent)' : 'var(--text)',
    fontWeight: isMissing ? '300' : '500',
    fontStyle: isMissing ? 'italic' : 'normal',
    wordBreak: 'break-word',
    textDecoration: isLink && !isMissing ? 'underline' : 'none'
  }

  const inner = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <div style={{
        fontFamily: 'DM Mono, monospace',
        fontSize: '10px',
        color: 'var(--text3)',
        letterSpacing: '1px',
        textTransform: 'uppercase'
      }}>
        {label}
      </div>
      <div style={textStyle}>
        {value || 'Not found'}
      </div>
    </div>
  )

  if (isLink && !isMissing) {
    const href = value.startsWith('http') ? value : `https://${value}`
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
        {inner}
      </a>
    )
  }

  return inner
}

function TagList({ items, color }) {
  if (!items || items.length === 0) return <span style={{ fontSize: '13px', color: 'var(--text3)', fontStyle: 'italic' }}>Not found</span>
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
      {items.map((item, i) => (
        <span key={i} style={{
          fontFamily: 'DM Mono, monospace',
          fontSize: '11px',
          padding: '4px 10px',
          borderRadius: '20px',
          background: color ? `${color}15` : 'var(--surface2)',
          color: color || 'var(--text2)',
          border: `1px solid ${color ? `${color}30` : 'var(--border)'}`,
          fontWeight: '500'
        }}>
          {item}
        </span>
      ))}
    </div>
  )
}

function CompanyProfile({ data }) {
  const supplierTypeColor = {
    'Large Enterprise': 'var(--green)',
    'SME':              'var(--accent)',
    'MSME':             'var(--amber)',
    'Micro Enterprise': 'var(--amber)',
    'Startup':          'var(--accent2)'
  }

  // Filter out board members that have no real data
  const validBoardMembers = (data.boardMembers || []).filter(m =>
    m.name && m.name !== 'Not found' && m.name !== 'Not publicly available' && m.name.trim() !== ''
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
      </div>

      {/* Core Info Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '20px',
        marginBottom: '24px',
        paddingBottom: '24px',
        borderBottom: '1px solid var(--border)'
      }}>
        <InfoItem label="Headquarters"      value={data.headquarters}    />
        <InfoItem label="Registered Office" value={data.registeredOffice} />
        <InfoItem label="Employees"         value={data.employees}        />
        <InfoItem label="Founded"           value={data.founded}          />
        <InfoItem label="Annual Revenue"    value={data.annualRevenue}    />
        <InfoItem label="Market Cap"        value={data.marketCap}        />
        <InfoItem label="Stock Exchange"    value={data.stockExchange}    />
        <InfoItem label="Parent Company"    value={data.parentCompany}    />
      </div>

      {/* Registration Info */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '20px',
        marginBottom: '24px',
        paddingBottom: '24px',
        borderBottom: '1px solid var(--border)'
      }}>
        <InfoItem label="CIN Number"     value={data.cin}          />
        <InfoItem label="GST Number"     value={data.gstNumber}    />
        <InfoItem label="Udyam Number"   value={data.udyamNumber}  />
        <InfoItem label="Website"        value={data.website}      isLink />
        <InfoItem label="LinkedIn"       value={data.linkedin}     isLink />
        <InfoItem label="Contact Email"  value={data.contactEmail} />
        <InfoItem label="Contact Phone"  value={data.contactPhone} />
      </div>

      {/* Key Products & Services */}
      <div style={{ marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid var(--border)' }}>
        <div style={{
          fontFamily: 'DM Mono, monospace',
          fontSize: '10px',
          color: 'var(--text3)',
          letterSpacing: '1.5px',
          textTransform: 'uppercase',
          marginBottom: '12px'
        }}>
          🛠 KEY PRODUCTS & SERVICES
        </div>
        <TagList items={data.keyProducts} color="var(--accent)" />
      </div>

      {/* Certifications */}
      <div style={{ marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid var(--border)' }}>
        <div style={{
          fontFamily: 'DM Mono, monospace',
          fontSize: '10px',
          color: 'var(--text3)',
          letterSpacing: '1.5px',
          textTransform: 'uppercase',
          marginBottom: '12px'
        }}>
          🏅 CERTIFICATIONS
        </div>
        <TagList items={data.certifications} color="var(--green)" />
      </div>

      {/* Major Clients */}
      {data.majorClients && data.majorClients.length > 0 && (
        <div style={{ marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid var(--border)' }}>
          <div style={{
            fontFamily: 'DM Mono, monospace',
            fontSize: '10px',
            color: 'var(--text3)',
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
            marginBottom: '12px'
          }}>
            🤝 MAJOR CLIENTS
          </div>
          <TagList items={data.majorClients} color="var(--amber)" />
        </div>
      )}

      {/* Board of Directors */}
      <div style={{ marginBottom: validBoardMembers.length > 0 ? '20px' : '0' }}>
        <div style={{
          fontFamily: 'DM Mono, monospace',
          fontSize: '10px',
          color: 'var(--text3)',
          letterSpacing: '1.5px',
          textTransform: 'uppercase',
          marginBottom: '14px'
        }}>
          👥 BOARD OF DIRECTORS
        </div>

        {validBoardMembers.length > 0 ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: '10px'
          }}>
            {validBoardMembers.map((member, i) => (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                background: 'var(--surface2)',
                border: '1px solid var(--border)',
                borderRadius: '10px',
                padding: '12px 14px'
              }}>
                <div style={{
                  width: '36px', height: '36px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'Syne, sans-serif',
                  fontWeight: '700',
                  fontSize: '13px',
                  color: '#fff',
                  flexShrink: 0
                }}>
                  {member.name?.charAt(0)}
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
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ fontSize: '13px', color: 'var(--text3)', fontStyle: 'italic' }}>
            Board information not publicly available
          </div>
        )}
      </div>

      {/* Data Warnings — only if present */}
      {data.dataWarnings?.length > 0 && (
        <div style={{
          marginTop: '20px',
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
            ⚠ DATA NOTES
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
