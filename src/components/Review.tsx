import { useEffect, useRef, useState } from 'react'
import { recordReview, type Card, type Deck } from '../db'

function shuffled<T>(items: T[]): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

/// Simple review session: shuffle the deck, show each front, flip to reveal
/// the back, and mark it as got-it or missed. At the end, offer to run the
/// missed cards again.
///
/// Keys: Space flips, Left = Missed, Right = Got It, Escape ends,
/// Enter picks the highlighted action on the summary.
export function Review({ deck, cards, onExit }: { deck: Deck; cards: Card[]; onExit: () => void }) {
  const [queue, setQueue] = useState(() => shuffled(cards))
  const [position, setPosition] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [missed, setMissed] = useState<Card[]>([])
  const [correctCount, setCorrectCount] = useState(0)

  const isFinished = position >= queue.length
  const current = queue[position]

  function flip() {
    setIsFlipped((f) => !f)
  }

  function answer(correct: boolean) {
    recordReview(current.id, correct)
    if (correct) setCorrectCount((n) => n + 1)
    else setMissed((m) => [...m, current])
    // The next card mounts fresh (keyed by position), so it starts unflipped
    // without animating the flip back.
    setIsFlipped(false)
    setPosition((p) => p + 1)
  }

  function restart(with_: Card[]) {
    setQueue(shuffled(with_))
    setPosition(0)
    setIsFlipped(false)
    setMissed([])
    setCorrectCount(0)
  }

  // Keep the latest handlers reachable from the one window listener.
  const keyHandler = useRef<(e: KeyboardEvent) => void>(() => {})
  keyHandler.current = (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return
    if (e.key === 'Escape') {
      e.preventDefault()
      onExit()
    } else if (isFinished) {
      return
    } else if (e.key === ' ') {
      e.preventDefault()
      flip()
    } else if (isFlipped && e.key === 'ArrowLeft') {
      answer(false)
    } else if (isFlipped && e.key === 'ArrowRight') {
      answer(true)
    }
  }
  useEffect(() => {
    const listener = (e: KeyboardEvent) => keyHandler.current(e)
    window.addEventListener('keydown', listener)
    return () => window.removeEventListener('keydown', listener)
  }, [])

  return (
    <div className="review" role="dialog" aria-modal="true" aria-label={`Review ${deck.name}`}>
      <header className="sheet-bar">
        <button className="text-button" onClick={onExit}>
          {isFinished ? 'Done' : 'End'}
        </button>
        <h2>{deck.name}</h2>
        <span />
      </header>

      {isFinished ? (
        <Summary
          total={queue.length}
          correctCount={correctCount}
          missed={missed}
          onReviewMissed={() => restart(missed)}
          onReviewAll={() => restart(cards)}
          onDone={onExit}
        />
      ) : (
        <div className="session">
          <progress value={position} max={queue.length} />
          <p className="position secondary">
            {position + 1} of {queue.length}
          </p>

          <button
            key={position}
            className={`flip-card ${isFlipped ? 'flipped' : ''}`}
            onClick={flip}
            aria-label={isFlipped ? `Back: ${current.backText}` : `Front: ${current.frontText}. Activate to reveal the answer.`}
          >
            <span className="face front" aria-hidden="true">
              <span className="face-label">Front</span>
              <span className="face-text">{current.frontText}</span>
            </span>
            <span className="face back" aria-hidden="true">
              <span className="face-label">Back</span>
              <span className="face-text">{current.backText}</span>
            </span>
          </button>

          {isFlipped ? (
            <div className="answer-buttons">
              <button className="button prominent large missed" onClick={() => answer(false)}>
                <span aria-hidden="true">✕</span> Missed
              </button>
              <button className="button prominent large got-it" onClick={() => answer(true)}>
                <span aria-hidden="true">✓</span> Got It
              </button>
            </div>
          ) : (
            <button className="button large show-answer" onClick={flip}>
              Show Answer
            </button>
          )}
          <p className="key-hint secondary" aria-hidden="true">
            {isFlipped ? '← Missed · Got It →' : 'Space to flip'}
          </p>
        </div>
      )}
    </div>
  )
}

function Summary({
  total,
  correctCount,
  missed,
  onReviewMissed,
  onReviewAll,
  onDone,
}: {
  total: number
  correctCount: number
  missed: Card[]
  onReviewMissed: () => void
  onReviewAll: () => void
  onDone: () => void
}) {
  const perfect = missed.length === 0
  return (
    <div className="summary">
      <div className={`summary-icon ${perfect ? 'perfect' : ''}`} aria-hidden="true">
        {perfect ? '✓' : '⚑'}
      </div>
      <h1>{perfect ? 'Perfect!' : 'Session Complete'}</h1>
      <p className="score secondary">
        {correctCount} of {total} correct
      </p>
      <div className="summary-actions">
        {/* autoFocus puts Enter on the primary action. */}
        {!perfect && (
          <button className="button prominent large" onClick={onReviewMissed} autoFocus>
            Review {missed.length} Missed
          </button>
        )}
        <button className={`button large ${perfect ? 'prominent' : ''}`} onClick={onReviewAll} autoFocus={perfect}>
          Review All Again
        </button>
        <button className="button large" onClick={onDone}>
          Done
        </button>
      </div>
    </div>
  )
}
