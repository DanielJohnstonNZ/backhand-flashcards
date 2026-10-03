import { useState } from 'react'
import { cardsInDeck, deleteCard, useStore, type Card, type Deck } from '../db'
import { navigate } from '../route'
import { CardEditor } from './CardEditor'
import { Menu, MoreIcon, PlusIcon } from './DeckList'
import { Confirm } from './Modal'

type Editing = { card: Card | null } | null

export function DeckDetail({ deck }: { deck: Deck }) {
  const snap = useStore()
  const cards = cardsInDeck(snap, deck.id)
  const [editing, setEditing] = useState<Editing>(null)
  const [menuFor, setMenuFor] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<Card | null>(null)

  return (
    <main className="detail">
      <header className="bar">
        <a href="#/" className="back-link" aria-label="Decks">
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
            <path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>Decks</span>
        </a>
      </header>

      <div className="detail-content">
        <div className="deck-header">
          <div className="deck-heading">
            <h1 className="large-title">{deck.name}</h1>
            <p className="secondary">
              {cards.length} {cards.length === 1 ? 'card' : 'cards'}
            </p>
          </div>
          <div className="deck-actions">
            <button className="button large" onClick={() => setEditing({ card: null })}>
              <PlusIcon />
              New Card
            </button>
            <button
              className="button prominent large"
              disabled={cards.length === 0}
              onClick={() => navigate({ deckId: deck.id, reviewing: true })}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="currentColor">
                <path d="M7 4.5v15l12-7.5z" />
              </svg>
              Review
            </button>
          </div>
        </div>

        <ul className="tile-grid">
          {cards.map((card) => (
            <li key={card.id} className="tile card-tile">
              <button
                className="tile-main"
                onClick={() => setEditing({ card })}
                onContextMenu={(e) => {
                  e.preventDefault()
                  setMenuFor(card.id)
                }}
              >
                <span className="card-front">{card.frontText}</span>
                <span className="card-back">{card.backText}</span>
              </button>
              <button
                className="icon-button more"
                aria-label={`More actions for ${card.frontText}`}
                aria-haspopup="menu"
                aria-expanded={menuFor === card.id}
                onClick={() => setMenuFor(menuFor === card.id ? null : card.id)}
              >
                <MoreIcon />
              </button>
              {menuFor === card.id && (
                <Menu onClose={() => setMenuFor(null)}>
                  <button role="menuitem" onClick={() => setEditing({ card })}>
                    Edit
                  </button>
                  <hr />
                  <button role="menuitem" className="destructive" onClick={() => setDeleting(card)}>
                    Delete
                  </button>
                </Menu>
              )}
            </li>
          ))}
          <li>
            <button className="add-tile" onClick={() => setEditing({ card: null })}>
              <PlusIcon />
              New Card
            </button>
          </li>
        </ul>
      </div>

      {editing && <CardEditor deck={deck} card={editing.card} onClose={() => setEditing(null)} />}
      {deleting && (
        <Confirm
          title="Delete this card?"
          message="It can't be undone."
          confirmLabel="Delete"
          onConfirm={() => deleteCard(deleting.id)}
          onClose={() => setDeleting(null)}
        />
      )}
    </main>
  )
}
