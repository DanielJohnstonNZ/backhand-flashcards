import { DEFAULT_REVIEW_OPTIONS, setReviewOptions, type Deck, type ReviewOptions, type ReviewOrder } from '../db'
import { CloseButton, Modal } from './Modal'

const ORDERS: { value: ReviewOrder; label: string; description: string }[] = [
  {
    value: 'spaced',
    label: 'Spaced Repetition',
    description: 'Only cards that are due, plus new ones. Cards you know come back less often.',
  },
  { value: 'random', label: 'Random', description: 'Every card, shuffled.' },
  { value: 'deck', label: 'Deck Order', description: 'Every card, in the order they were added.' },
]

/// The deck's review settings. Changes are saved as they're made, and review
/// sessions read them from the deck.
export function ReviewOptionsDialog({ deck, onClose }: { deck: Deck; onClose: () => void }) {
  const options = deck.reviewOptions ?? DEFAULT_REVIEW_OPTIONS

  function update(change: Partial<ReviewOptions>) {
    setReviewOptions(deck.id, { ...options, ...change })
  }

  return (
    <Modal title="Review Options" onClose={onClose} className="editor">
      <header className="sheet-bar">
        <h2>Review Options</h2>
        <CloseButton onClick={onClose} />
      </header>

      <div className="sheet-body">
        <fieldset className="option-group">
          <legend className="section-header">Order</legend>
          {ORDERS.map((order) => (
            <label key={order.value} className="radio-option">
              <input
                type="radio"
                name="order"
                value={order.value}
                checked={options.order === order.value}
                onChange={() => update({ order: order.value })}
                data-autofocus={options.order === order.value || undefined}
              />
              <span>
                <span className="radio-label">{order.label}</span>
                <span className="footnote">{order.description}</span>
              </span>
            </label>
          ))}
        </fieldset>

        <button type="button" className="button prominent large done-button" onClick={onClose}>
          Done
        </button>
      </div>
    </Modal>
  )
}
