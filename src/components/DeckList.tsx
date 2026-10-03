import { useEffect, useRef, useState } from 'react'
import { addDeck, cardsInDeck, deleteDeck, renameDeck, useStore, type Deck } from '../db'
import { downloadDeck } from '../csv'
import { Confirm, NamePrompt } from './Modal'
import { navigate } from '../route'
import { chooseImportFile, ImportDialog, type PendingImport } from './ImportDialog'

type Dialog =
  | { kind: 'new' }
  | { kind: 'rename'; deck: Deck }
  | { kind: 'delete'; deck: Deck }
  | { kind: 'import'; pending: PendingImport }

export function DeckList() {
  const snap = useStore()
  const [dialog, setDialog] = useState<Dialog | null>(null)
  const [menuFor, setMenuFor] = useState<string | null>(null)

  async function create(name: string) {
    const deck = await addDeck(name)
    navigate({ deckId: deck.id })
  }

  function startImport(deckId?: string) {
    chooseImportFile((pending) => setDialog({ kind: 'import', pending: { ...pending, deckId } }))
  }

  return (
    <main className="home">
      <header className="bar">
        <h1>Decks</h1>
      </header>

      <div className="home-content">
        {snap.decks.length === 0 && (
          <p className="secondary home-hint">Create a deck to start adding cards, or import cards from a CSV file.</p>
        )}
        <ul className="tile-grid">
          {snap.decks.map((deck) => {
            const cards = cardsInDeck(snap, deck.id)
            return (
              <li key={deck.id} className="tile deck-tile">
                <a
                  href={`#/deck/${deck.id}`}
                  onContextMenu={(e) => {
                    e.preventDefault()
                    setMenuFor(deck.id)
                  }}
                >
                  <span className="tile-title">{deck.name}</span>
                  <span className="tile-meta">
                    {cards.length} {cards.length === 1 ? 'card' : 'cards'}
                  </span>
                </a>
                <button
                  className="icon-button more"
                  aria-label={`More actions for ${deck.name}`}
                  aria-haspopup="menu"
                  aria-expanded={menuFor === deck.id}
                  onClick={() => setMenuFor(menuFor === deck.id ? null : deck.id)}
                >
                  <MoreIcon />
                </button>
                {menuFor === deck.id && (
                  <Menu onClose={() => setMenuFor(null)}>
                    <button role="menuitem" onClick={() => setDialog({ kind: 'rename', deck })}>
                      Rename
                    </button>
                    <button role="menuitem" onClick={() => startImport(deck.id)}>
                      Import CSV…
                    </button>
                    <button role="menuitem" disabled={cards.length === 0} onClick={() => downloadDeck(deck, cards)}>
                      Export to CSV
                    </button>
                    <hr />
                    <button role="menuitem" className="destructive" onClick={() => setDialog({ kind: 'delete', deck })}>
                      Delete
                    </button>
                  </Menu>
                )}
              </li>
            )
          })}
          <li>
            <button className="add-tile" onClick={() => setDialog({ kind: 'new' })}>
              <PlusIcon />
              New Deck
            </button>
          </li>
        </ul>
      </div>

      {dialog?.kind === 'new' && (
        <NamePrompt title="New Deck" confirmLabel="Create" onSubmit={create} onClose={() => setDialog(null)}>
          <div className="divider">or</div>
          <button type="button" className="button import-option" onClick={() => startImport()}>
            <ImportIcon />
            Import from CSV…
          </button>
        </NamePrompt>
      )}
      {dialog?.kind === 'rename' && (
        <NamePrompt
          title="Rename Deck"
          confirmLabel="Save"
          initialValue={dialog.deck.name}
          onSubmit={(name) => renameDeck(dialog.deck.id, name)}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog?.kind === 'delete' && (
        <Confirm
          title={`Delete “${dialog.deck.name}”?`}
          message={`This deletes the deck and its ${cardsInDeck(snap, dialog.deck.id).length} cards from this browser. It can't be undone.`}
          confirmLabel="Delete"
          onConfirm={() => {
            deleteDeck(dialog.deck.id)
          }}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog?.kind === 'import' && <ImportDialog pending={dialog.pending} onClose={() => setDialog(null)} />}
    </main>
  )
}

/// Popup menu that closes on any click outside it or on Escape.
export function Menu({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    ref.current?.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus()
  }, [])

  return (
    <>
      <div className="menu-scrim" onClick={onClose} />
      <div
        className="menu"
        role="menu"
        onClick={onClose}
        onKeyDown={(e) => e.key === 'Escape' && onClose()}
        ref={ref}
      >
        {children}
      </div>
    </>
  )
}

export function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
    </svg>
  )
}

function ImportIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 4v11M7.5 10.5 12 15l4.5-4.5M5 19h14" />
    </svg>
  )
}

export function MoreIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="currentColor">
      <circle cx="5" cy="12" r="1.8" />
      <circle cx="12" cy="12" r="1.8" />
      <circle cx="19" cy="12" r="1.8" />
    </svg>
  )
}
