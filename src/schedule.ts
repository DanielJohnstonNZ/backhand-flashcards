import type { Card } from './db'

/// Spaced repetition scheduling: a simplified SM-2 (the algorithm behind
/// Anki's classic scheduler) adapted to pass / fail answers.
///
/// Each card has an interval in days and an ease multiplier. Getting a card
/// right multiplies its interval by its ease; missing it resets the interval
/// and makes the card a little harder, so it comes back sooner from then on.

const DAY = 24 * 60 * 60 * 1000
export const DEFAULT_EASE = 2.5
const MIN_EASE = 1.3
const EASE_PENALTY = 0.2

export type SchedulingFields = Pick<Card, 'intervalDays' | 'ease' | 'dueAt'>

export function schedule(card: Card, correct: boolean, now = Date.now()): SchedulingFields {
  if (!correct) {
    // Due again straight away, then relearned from a one-day interval.
    return { intervalDays: 0, ease: Math.max(MIN_EASE, card.ease - EASE_PENALTY), dueAt: now }
  }
  let intervalDays: number
  if (card.intervalDays === 0 || card.lastReviewedAt === null) {
    intervalDays = 1
  } else {
    // Reviewing early only earns credit for the time actually waited, so
    // extra practice doesn't push a card out further than it should.
    const elapsedDays = (now - card.lastReviewedAt) / DAY
    const base = Math.min(card.intervalDays, Math.max(1, elapsedDays))
    intervalDays = Math.max(card.intervalDays, Math.round(base * card.ease))
  }
  return { intervalDays, ease: card.ease, dueAt: now + intervalDays * DAY }
}

/// Cards count as due for the whole of the day they fall due on, so a card
/// scheduled for tomorrow evening can be reviewed tomorrow morning.
function endOfToday(now: number) {
  const date = new Date(now)
  date.setHours(24, 0, 0, 0)
  return date.getTime()
}

export function isDue(card: Card, now = Date.now()) {
  return card.dueAt === null || card.dueAt < endOfToday(now)
}

/// Due cards for a spaced repetition session: reviews first, most overdue
/// first, then new cards in the order they were added.
export function dueCards(cards: Card[], now = Date.now()): Card[] {
  const due = cards.filter((c) => isDue(c, now))
  const reviews = due.filter((c) => c.dueAt !== null).sort((a, b) => a.dueAt! - b.dueAt!)
  const fresh = due.filter((c) => c.dueAt === null)
  return [...reviews, ...fresh]
}

/// When the next card falls due, for when nothing is due today.
export function nextDueAt(cards: Card[]): number | null {
  const times = cards.map((c) => c.dueAt).filter((t): t is number => t !== null)
  return times.length ? Math.min(...times) : null
}

/// "tomorrow", "in 3 days".
export function describeDue(dueAt: number, now = Date.now()) {
  const days = Math.max(1, Math.ceil((dueAt - endOfToday(now)) / DAY))
  return days === 1 ? 'tomorrow' : `in ${days} days`
}
