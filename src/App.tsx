import { useEffect } from 'react'
import { cardsInDeck, useStore } from './db'
import { goBack, navigate, useRoute } from './route'
import { DeckList } from './components/DeckList'
import { DeckDetail } from './components/DeckDetail'
import { Review } from './components/Review'

/// Sidebar + detail on wide screens; one pane at a time on phones, where the
/// deck list is the "root" and a deck pushes over it.
export function App() {
  const snap = useStore()
  const route = useRoute()
  const deck = snap.decks.find((d) => d.id === route.deckId) ?? null

  // A stale link (deleted deck, or one from another browser) goes home.
  useEffect(() => {
    if (route.deckId && !deck) navigate({}, { replace: true })
  }, [route.deckId, deck])

  const cards = deck ? cardsInDeck(snap, deck.id) : []
  const reviewing = deck && route.reviewing && cards.length > 0

  return (
    <div className={`app ${deck ? 'has-selection' : ''}`}>
      <div className="split" inert={reviewing || undefined}>
        <DeckList selectedId={deck?.id ?? null} />
        {deck ? (
          <DeckDetail key={deck.id} deck={deck} />
        ) : (
          <main className="detail placeholder">
            <p className="secondary">{snap.decks.length ? 'Select a deck' : ''}</p>
          </main>
        )}
      </div>
      {reviewing && <Review key={deck.id} deck={deck} cards={cards} onExit={() => goBack({ deckId: deck.id })} />}
    </div>
  )
}
