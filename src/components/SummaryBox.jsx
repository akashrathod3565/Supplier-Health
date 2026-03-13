function SummaryBox({ summary }) {
  return (
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
        marginBottom: '12px'
      }}>
        ✦ AI ASSESSMENT SUMMARY
      </div>
      <p style={{
        fontSize: '14px',
        color: 'var(--text2)',
        lineHeight: '1.8',
        fontWeight: '300'
      }}>
        {summary}
      </p>
    </div>
  )
}

export default SummaryBox