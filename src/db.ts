import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import { useSyncExternalStore } from 'react'

/// Everything lives in IndexedDB in this browser. There is no server.
///
/// The whole dataset is small (text-only cards), so it is loaded into memory
/// once at startup and every write goes to both. Components read the
/// in-memory snapshot through `useStore`.

export interface Deck {
  id: string
  name: string
  createdAt: number
}

export interface Card {
  id: string
  deckId: string
  /// Text content for each side. Kept as separate `*Text` fields so that
  /// image / audio attachments can be added alongside them later.
  frontText: string
  backText: string
  createdAt: number
  // Lightweight review history, for "hardest cards" style features or a
  // spaced-repetition scheduler later.
  reviewCount: number
  correctCount: number
  lastReviewedAt: number | null
}

interface BackhandDB extends DBSchema {
  decks: { key: string; value: Deck }
  cards: { key: string; value: Card; indexes: { deckId: string } }
}

export interface Snapshot {
  decks: Deck[]
  cards: Card[]
}

let db: IDBPDatabase<BackhandDB>
let snapshot: Snapshot = { decks: [], cards: [] }
const listeners = new Set<() => void>()

// Tells other open tabs to reload after a write.
const channel = 'BroadcastChannel' in window ? new BroadcastChannel('backhand') : null

export async function initStore() {
  db = await openDB<BackhandDB>('backhand', 1, {
    upgrade(db) {
      db.createObjectStore('decks', { keyPath: 'id' })
      const cards = db.createObjectStore('cards', { keyPath: 'id' })
      cards.createIndex('deckId', 'deckId')
    },
  })
  await reload()
  if (channel) channel.onmessage = () => void reload()
}

async function reload() {
  const [decks, cards] = await Promise.all([db.getAll('decks'), db.getAll('cards')])
  setSnapshot({ decks: decks.sort(byCreatedAt), cards: cards.sort(byCreatedAt) })
}

function setSnapshot(next: Snapshot) {
  snapshot = next
  listeners.forEach((l) => l())
}

function changed() {
  channel?.postMessage('changed')
  requestPersistence()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useStore(): Snapshot {
  return useSyncExternalStore(subscribe, () => snapshot)
}

/// Browser storage can be evicted under storage pressure unless the site is
/// granted persistent storage. Ask once the user has saved something.
let persistenceRequested = false
function requestPersistence() {
  if (persistenceRequested) return
  persistenceRequested = true
  navigator.storage?.persist?.().catch(() => {})
}

const byCreatedAt = (a: { createdAt: number }, b: { createdAt: number }) => a.createdAt - b.createdAt

/// Timestamps that never repeat, so cards added in quick succession keep a
/// stable order.
let lastTimestamp = 0
function timestamp() {
  lastTimestamp = Math.max(Date.now(), lastTimestamp + 1)
  return lastTimestamp
}

// MARK: - Queries

export function cardsInDeck(snap: Snapshot, deckId: string) {
  return snap.cards.filter((c) => c.deckId === deckId)
}

// MARK: - Decks

export async function addDeck(name: string): Promise<Deck> {
  const deck: Deck = { id: crypto.randomUUID(), name, createdAt: timestamp() }
  await db.put('decks', deck)
  setSnapshot({ ...snapshot, decks: [...snapshot.decks, deck] })
  changed()
  return deck
}

export async function renameDeck(id: string, name: string) {
  const deck = snapshot.decks.find((d) => d.id === id)
  if (!deck) return
  const updated = { ...deck, name }
  await db.put('decks', updated)
  setSnapshot({ ...snapshot, decks: snapshot.decks.map((d) => (d.id === id ? updated : d)) })
  changed()
}

/// Deletes the deck and all of its cards.
export async function deleteDeck(id: string) {
  const tx = db.transaction(['decks', 'cards'], 'readwrite')
  const cardKeys = await tx.objectStore('cards').index('deckId').getAllKeys(id)
  await Promise.all([
    tx.objectStore('decks').delete(id),
    ...cardKeys.map((key) => tx.objectStore('cards').delete(key)),
    tx.done,
  ])
  setSnapshot({
    decks: snapshot.decks.filter((d) => d.id !== id),
    cards: snapshot.cards.filter((c) => c.deckId !== id),
  })
  changed()
}

// MARK: - Cards

export function addCard(deckId: string, front: string, back: string) {
  return addCards(deckId, [{ front, back }])
}

/// Adds many cards in one transaction, keeping their order.
export async function addCards(deckId: string, sides: { front: string; back: string }[]) {
  const cards: Card[] = sides.map(({ front, back }) => ({
    id: crypto.randomUUID(),
    deckId,
    frontText: front,
    backText: back,
    createdAt: timestamp(),
    reviewCount: 0,
    correctCount: 0,
    lastReviewedAt: null,
  }))
  const tx = db.transaction('cards', 'readwrite')
  await Promise.all([...cards.map((card) => tx.store.put(card)), tx.done])
  setSnapshot({ ...snapshot, cards: [...snapshot.cards, ...cards] })
  changed()
}

async function updateCard(id: string, change: (card: Card) => Card) {
  const card = snapshot.cards.find((c) => c.id === id)
  if (!card) return
  const updated = change(card)
  await db.put('cards', updated)
  setSnapshot({ ...snapshot, cards: snapshot.cards.map((c) => (c.id === id ? updated : c)) })
  changed()
}

export function editCard(id: string, frontText: string, backText: string) {
  return updateCard(id, (card) => ({ ...card, frontText, backText }))
}

export function recordReview(id: string, correct: boolean) {
  return updateCard(id, (card) => ({
    ...card,
    reviewCount: card.reviewCount + 1,
    correctCount: card.correctCount + (correct ? 1 : 0),
    lastReviewedAt: Date.now(),
  }))
}

export async function deleteCard(id: string) {
  await db.delete('cards', id)
  setSnapshot({ ...snapshot, cards: snapshot.cards.filter((c) => c.id !== id) })
  changed()
}
