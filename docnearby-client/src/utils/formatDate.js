export function formatDate(d) {
  const date = d instanceof Date ? d : new Date(d)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: '2-digit' })
}

