function InfoItem({ label, value }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '4px'
    }}>
      <div style={{
        fontFamily: 'DM Mono, monospace',
        fontSize: '10px',
        color: 'var(--text3)',
        letterSpacing: '1px',
        textTransform: 'uppercase'
      }}>
        {label}
      </div>
      <div style={{
        fontSize: '13px',
        color: 'var(--text)',
        fontWeight: '500',
        wordBreak: 'break-word'
      }}>
        {value || 'N/A'}
      </div>
    </div>
  )
}

function CompanyProfile({ data }) {
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
        fontFamily: 'DM Mono, monospace',
        fontSize: '10px',
        color: 'var(--accent)',
        letterSpacing: '1.5px',
        textTransform: 'uppercase',
        marginBottom: '20px'
      }}>
        🏢 COMPANY PROFILE
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
        <InfoItem label="Headquarters"  value={data.headquarters} />
        <InfoItem label="Employees"     value={data.employees} />
        <InfoItem label="Founded"       value={data.founded} />
        <InfoItem label="CIN Number"    value={data.cin} />
        <InfoItem label="Website"       value={data.website} />
        <InfoItem label="Contact Email" value={data.contactEmail} />
        <InfoItem label="Contact Phone" value={data.contactPhone} />
        <InfoItem label="Industry"      value={data.industry} />
      </div>

      {/* Board Members */}
      <div>
        <div style={{
          fontFamily: 'DM Mono, monospace',
          fontSize: '10px',
          color: 'var(--text3)',
          letterSpacing: '1.5px',
          textTransform: 'uppercase',
          marginBottom: '14px'
        }}>
          BOARD OF DIRECTORS
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: '10px'
        }}>
          {data.boardMembers?.map((member, i) => (
            <div key={i} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              background: 'var(--surface2)',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              padding: '12px 14px'
            }}>
              {/* Avatar */}
              <div style={{
                width: '36px',
                height: '36px',
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
                {member.name?.charAt(0) || '?'}
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
      </div>

    </div>
  )
}

export default CompanyProfile