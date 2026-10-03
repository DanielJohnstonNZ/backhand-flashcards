import { useState } from 'react'
import { cardsInDeck, useStore, type Card, type Deck } from '../db'
import { navigate } from '../route'
import { CardEditor } from './CardEditor'
import { PlusIcon } from './DeckList'

type Editing = { card: Card | null } | null

export function DeckDetail({ deck }: { deck: Deck }) {
  const snap = useStore()
  const cards = cardsInDeck(snap, deck.id)
  const [editing, setEditing] = useState<Editing>(null)

  return (
    <main className="detail">
      <header className="bar">
        <a href="#/" className="back-link" aria-label="Decks">
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
            <path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>Decks</span>
        </a>
        <span className="spacer" />
        <button className="icon-button" aria-label="Add Card" title="Add Card" onClick={() => setEditing({ card: null })}>
          <PlusIcon />
        </button>
      </header>

      <div className="detail-content">
        <h1 className="large-title">{deck.name}</h1>

        <button
          className="button prominent large review-button"
          disabled={cards.length === 0}
          onClick={() => navigate({ deckId: deck.id, reviewing: true })}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="currentColor">
            <path d="M7 4.5v15l12-7.5z" />
          </svg>
          Review {cards.length} {cards.length === 1 ? 'Card' : 'Cards'}
        </button>

        {cards.length === 0 ? (
          <div className="empty">
            <h2>No Cards</h2>
            <p>Add a card with a front and a back to get started.</p>
            <button className="button" onClick={() => setEditing({ card: null })}>
              Add Card
            </button>
          </div>
        ) : (
          <section>
            <h2 className="section-header">Cards</h2>
            <ul className="list grouped">
              {cards.map((card) => (
                <li key={card.id}>
                  <button className="card-row" onClick={() => setEditing({ card })}>
                    <span className="card-front">{card.frontText}</span>
                    <span className="card-back">{card.backText}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      {editing && <CardEditor deck={deck} card={editing.card} onClose={() => setEditing(null)} />}
    </main>
  )
}
