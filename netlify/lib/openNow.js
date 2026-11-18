import OpeningHours from 'opening_hours'

// Whether a place is open right now, from its OpenStreetMap opening_hours string
// (e.g. "Mo-Fr 08:00-20:00; Sa 10:00-14:00"). Returns null when unknown or unparseable.
export function isOpenNow(openingHours, timeZone) {
  if (!openingHours) return null
  const now = wallClockDate(timeZone)
  try {
    return new OpeningHours(openingHours).getState(now)
  } catch {
    // The library has no holiday data for the Philippines, so any value mentioning public (PH)
    // or school (SH) holidays throws, e.g. "Mo-Su,PH 11:00-21:00". Retry without the holiday
    // parts: the hours are then right on every normal day, just not adjusted for holidays.
    const withoutHolidays = stripHolidays(openingHours)
    if (withoutHolidays === openingHours || !withoutHolidays) return null
    try {
      return new OpeningHours(withoutHolidays).getState(now)
    } catch {
      return null
    }
  }
}

// "Mo-Su,PH 11:00-21:00; PH off" -> "Mo-Su 11:00-21:00". Drops PH/SH from day lists, and
// drops rules that only apply on holidays.
function stripHolidays(value) {
  return value
    .split(';')
    .map((rule) => rule.replace(/\b[PS]H\s*,\s*/g, '').replace(/\s*,\s*[PS]H\b/g, ''))
    .filter((rule) => rule.trim() && !/^\s*[PS]H\b/.test(rule))
    .join(';')
    .trim()
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
