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

export function DeckList({ selectedId }: { selectedId: string | null }) {
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
    <nav className="sidebar" aria-label="Decks">
      <header className="bar">
        <h1>Decks</h1>
        <button className="icon-button" aria-label="Import CSV" title="Import CSV" onClick={() => startImport()}>
          <ImportIcon />
        </button>
        <button className="icon-button" aria-label="New Deck" title="New Deck" onClick={() => setDialog({ kind: 'new' })}>
          <PlusIcon />
        </button>
      </header>

      {snap.decks.length === 0 ? (
        <div className="empty">
          <h2>No Decks</h2>
          <p>Create a deck to start adding cards, or import cards from a CSV file.</p>
          <button className="button prominent" onClick={() => setDialog({ kind: 'new' })}>
            New Deck
          </button>
          <button className="button" onClick={() => startImport()}>
            Import CSV
          </button>
        </div>
      ) : (
        <ul className="list">
          {snap.decks.map((deck) => {
            const cards = cardsInDeck(snap, deck.id)
            return (
              <li key={deck.id} className={`deck-row ${deck.id === selectedId ? 'selected' : ''}`}>
                <a
                  href={`#/deck/${deck.id}`}
                  aria-current={deck.id === selectedId ? 'page' : undefined}
                  onContextMenu={(e) => {
                    e.preventDefault()
                    setMenuFor(deck.id)
                  }}
                >
                  <span className="deck-name">{deck.name}</span>
                  <span className="count">{cards.length}</span>
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
        </ul>
      )}

      {dialog?.kind === 'new' && (
        <NamePrompt title="New Deck" confirmLabel="Create" onSubmit={create} onClose={() => setDialog(null)} />
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
            if (dialog.deck.id === selectedId) navigate({})
            deleteDeck(dialog.deck.id)
          }}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog?.kind === 'import' && <ImportDialog pending={dialog.pending} onClose={() => setDialog(null)} />}
    </nav>
  )
}

/// Popup menu that closes on any click outside it or on Escape.
function Menu({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
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

function MoreIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="currentColor">
      <circle cx="5" cy="12" r="1.8" />
      <circle cx="12" cy="12" r="1.8" />
      <circle cx="19" cy="12" r="1.8" />
    </svg>
  )
}
