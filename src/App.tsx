import { useEffect } from 'react'
import { cardsInDeck, useStore } from './db'
import { goBack, navigate, useRoute } from './route'
import { DeckList } from './components/DeckList'
import { DeckDetail } from './components/DeckDetail'
import { Review } from './components/Review'

/// The deck grid is the home page; opening a deck replaces it with the deck's
/// page.
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
    <div className="app">
      <div className="page" inert={reviewing || undefined}>
        {deck ? <DeckDetail key={deck.id} deck={deck} /> : <DeckList />}
      </div>
      {reviewing && <Review key={deck.id} deck={deck} cards={cards} onExit={() => goBack({ deckId: deck.id })} />}
    </div>
  )
}
