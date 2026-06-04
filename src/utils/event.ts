export function getEffectiveStatus(event: { status: string; start_date: string; end_date: string }): string {
  if (event.status === 'ended') return 'ended'

  const today = new Date().toISOString().slice(0, 10)
  if (today < event.start_date) return 'not_started'
  if (today > event.end_date) return 'ended'
  return 'active'
}
