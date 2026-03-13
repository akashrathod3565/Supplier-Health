export async function assessSupplier(supplierName) {
  const response = await fetch('/api/assess', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ supplierName })
  })

  if (!response.ok) {
    const err = await response.json()
    throw new Error(err.error || 'Assessment failed')
  }

  return response.json()
}