import OpeningHours from 'opening_hours'

// Whether a place is open right now, from its OpenStreetMap opening_hours string
// (e.g. "Mo-Fr 08:00-20:00; Sa 10:00-14:00"). Returns null when unknown or unparseable.
export function isOpenNow(openingHours, timeZone) {
  if (!openingHours) return null
  try {
    return new OpeningHours(openingHours).getState(wallClockDate(timeZone))
  } catch {
    return null
  }
}

// opening_hours reads a Date's local fields, but functions run in UTC. Build a Date whose
// local fields match the wall-clock time in the user's timezone.
function wallClockDate(timeZone) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hourCycle: 'h23',
    })
      .formatToParts(new Date())
      .map((p) => [p.type, Number(p.value)]),
  )
  return new Date(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute)
}

export function isValidTimeZone(timeZone) {
  if (!timeZone) return false
  try {
    new Intl.DateTimeFormat('en-US', { timeZone })
    return true
  } catch {
    return false
  }
}
