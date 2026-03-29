import { ConfidenceDot, SourceChip, StaleBadge } from './CredibilityBanner'

function InfoItem({ label, value, isLink, confidence, sourceId, sourceMap, stale, dataYear }) {
  const isMissing = !value || value === 'Not found' || value === 'N/A' || value === ''

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
        fontFamily: 'DM Mono, monospace', fontSize: '10px',
        color: 'var(--text3)', letterSpacing: '1px', textTransform: 'uppercase'
      }}>
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '2px' }}>
        <span style={textStyle}>{value || 'Not found'}</span>
        {!isMissing && confidence && <ConfidenceDot confidence={confidence} />}
        {!isMissing && sourceId && sourceMap && <SourceChip sourceId={sourceId} sourceMap={sourceMap} />}
        {stale && dataYear && <StaleBadge field={label} dataYear={dataYear} />}
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
  if (!items || items.length === 0)
    return <span style={{ fontSize: '13px', color: 'var(--text3)', fontStyle: 'italic' }}>Not found</span>
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
      {items.map((item, i) => (
        <span key={i} style={{
          fontFamily: 'DM Mono, monospace', fontSize: '11px',
          padding: '4px 10px', borderRadius: '20px',
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
  const sourceMap = data.sourceMap || {}
  const staleSet = new Set((data.staleFields || []).map(s => s.field))
  const staleYearMap = {}
  ;(data.staleFields || []).forEach(s => { staleYearMap[s.field] = s.dataYear })

  const supplierTypeColor = {
    'Large Enterprise': 'var(--green)',
    'SME': 'var(--accent)',
    'MSME': 'var(--amber)',
    'Micro Enterprise': 'var(--amber)',
    'Startup': 'var(--accent2)'
  }

  const validBoardMembers = (data.boardMembers || []).filter(m =>
    m.name && m.name !== 'Not found' && m.name !== 'Not publicly available' && m.name.trim() !== ''
  )

  const hasCharges = data.charges && data.charges !== 'None found' && data.charges !== 'Not found'

  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: '12px', padding: '20px', marginBottom: '24px'
    }}>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: '20px', flexWrap: 'wrap', gap: '10px'
      }}>
        <div style={{
          fontFamily: 'DM Mono, monospace', fontSize: '10px',
          color: 'var(--accent)', letterSpacing: '1.5px', textTransform: 'uppercase'
        }}>
          🏢 COMPANY PROFILE
        </div>
        {data.supplierType && (
          <span style={{
            fontFamily: 'DM Mono, monospace', fontSize: '10px',
            color: supplierTypeColor[data.supplierType] || 'var(--text2)',
            background: 'var(--surface2)',
            border: `1px solid ${supplierTypeColor[data.supplierType] || 'var(--border)'}`,
            padding: '3px 10px', borderRadius: '20px'
          }}>
            {data.supplierType}
          </span>
        )}
      </div>

      {/* Active charges alert */}
      {hasCharges && (
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: '10px',
          background: 'rgba(239,68,68,0.06)',
          border: '1px solid rgba(239,68,68,0.25)',
          borderRadius: '8px', padding: '10px 14px', marginBottom: '20px'
        }}>
          <span style={{ fontSize: '14px', flexShrink: 0 }}>⚠️</span>
          <div>
            <div style={{
              fontFamily: 'DM Mono, monospace', fontSize: '10px',
              color: 'var(--red)', letterSpacing: '1px', marginBottom: '4px'
            }}>
              ACTIVE CHARGES / LIENS DETECTED
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text2)', fontWeight: '300', lineHeight: '1.5' }}>
              {data.charges} — Verify directly on MCA21 before onboarding.
            </div>
          </div>
        </div>
      )}

      {/* Core Info Grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '20px', marginBottom: '24px', paddingBottom: '24px',
        borderBottom: '1px solid var(--border)'
      }}>
        <InfoItem label="Headquarters" value={data.headquarters} />
        <InfoItem label="Registered Office" value={data.registeredOffice} />
        <InfoItem label="Employees" value={data.employees}
          stale={staleSet.has('Employees')} dataYear={staleYearMap['Employees']} />
        <InfoItem label="Founded" value={data.founded} />
        <InfoItem label="Annual Revenue" value={data.annualRevenue}
          confidence={data.annualRevenueConfidence}
          sourceId={data.annualRevenueSourceId} sourceMap={sourceMap}
          stale={staleSet.has('Annual Revenue')} dataYear={staleYearMap['Annual Revenue']} />
        <InfoItem label="Market Cap" value={data.marketCap}
          stale={staleSet.has('Market Cap')} dataYear={staleYearMap['Market Cap']} />
        <InfoItem label="Stock Exchange" value={data.stockExchange} />
        <InfoItem label="Parent Company" value={data.parentCompany} />
      </div>

      {/* Registration Info — now includes charges & last filing */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '20px', marginBottom: '24px', paddingBottom: '24px',
        borderBottom: '1px solid var(--border)'
      }}>
        <InfoItem label="CIN Number" value={data.cin}
          confidence={data.cinConfidence} sourceId={data.cinSourceId} sourceMap={sourceMap} />
        <InfoItem label="GST Number" value={data.gstNumber}
          confidence={data.gstConfidence} sourceId={data.gstSourceId} sourceMap={sourceMap} />
        <InfoItem label="Udyam Number" value={data.udyamNumber} />
        <InfoItem label="Active Charges" value={data.charges}
          sourceId={data.chargesSourceId} sourceMap={sourceMap} />
        <InfoItem label="Last MCA Filing" value={data.lastFilingDate}
          sourceId={data.lastFilingSourceId} sourceMap={sourceMap} />
        <InfoItem label="Website" value={data.website} isLink />
        <InfoItem label="LinkedIn" value={data.linkedin} isLink />
        <InfoItem label="Contact Email" value={data.contactEmail} />
        <InfoItem label="Contact Phone" value={data.contactPhone} />
      </div>

      {/* Key Products */}
      <div style={{ marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid var(--border)' }}>
        <div style={{
          fontFamily: 'DM Mono, monospace', fontSize: '10px', color: 'var(--text3)',
          letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '12px'
        }}>🛠 KEY PRODUCTS & SERVICES</div>
        <TagList items={data.keyProducts} color="var(--accent)" />
      </div>

      {/* Certifications */}
      <div style={{ marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid var(--border)' }}>
        <div style={{
          fontFamily: 'DM Mono, monospace', fontSize: '10px', color: 'var(--text3)',
          letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '12px'
        }}>🏅 CERTIFICATIONS</div>
        <TagList items={data.certifications} color="var(--green)" />
      </div>

      {/* Major Clients */}
      {data.majorClients && data.majorClients.length > 0 && (
        <div style={{ marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid var(--border)' }}>
          <div style={{
            fontFamily: 'DM Mono, monospace', fontSize: '10px', color: 'var(--text3)',
            letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '12px'
          }}>🤝 MAJOR CLIENTS</div>
          <TagList items={data.majorClients} color="var(--amber)" />
        </div>
      )}

      {/* Board of Directors */}
      <div>
        <div style={{
          fontFamily: 'DM Mono, monospace', fontSize: '10px', color: 'var(--text3)',
          letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '14px'
        }}>👥 BOARD OF DIRECTORS</div>
        {validBoardMembers.length > 0 ? (
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '10px'
          }}>
            {validBoardMembers.map((member, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                background: 'var(--surface2)', border: '1px solid var(--border)',
                borderRadius: '10px', padding: '12px 14px'
              }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'Syne, sans-serif', fontWeight: '700', fontSize: '13px',
                  color: '#fff', flexShrink: 0
                }}>
                  {member.name?.charAt(0)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '4px',
                    fontFamily: 'Syne, sans-serif', fontSize: '13px',
                    fontWeight: '700', marginBottom: '2px'
                  }}>
                    {member.name}
                    {member.confidence && <ConfidenceDot confidence={member.confidence} />}
                    {member.sourceId && <SourceChip sourceId={member.sourceId} sourceMap={sourceMap} />}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text3)', fontWeight: '300' }}>
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

      {/* Data Warnings */}
      {data.dataWarnings?.length > 0 && (
        <div style={{
          marginTop: '20px', background: 'rgba(245,158,11,0.06)',
          border: '1px solid rgba(245,158,11,0.2)', borderRadius: '8px', padding: '14px 16px'
        }}>
          <div style={{
            fontFamily: 'DM Mono, monospace', fontSize: '10px',
            color: 'var(--amber)', letterSpacing: '1px', marginBottom: '8px'
          }}>⚠ DATA NOTES</div>
          {data.dataWarnings.map((w, i) => (
            <div key={i} style={{
              fontSize: '12px', color: 'var(--text2)', marginBottom: '4px',
              display: 'flex', gap: '8px', fontWeight: '300'
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
