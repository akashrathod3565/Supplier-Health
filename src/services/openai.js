export async function assessSupplier(supplierName) {
  const response = await fetch('/api/assess', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ supplierName })
  })

  const text = await response.text()

  if (!text || text.trim() === '') {
    throw new Error('Server returned empty response — likely a timeout. Please try again.')
  }

  let data
  try {
    data = JSON.parse(text)
  } catch (e) {
    throw new Error('Invalid response from server. Please try again.')
  }

  if (!response.ok) {
    throw new Error(data.error || 'Assessment failed')
  }

  return data
}