import { useState, type FormEvent } from 'react'
import { addCards, addDeck, cardsInDeck, useStore } from '../db'
import { deckNameFromFile, parseCards, removeDuplicates, type ParseResult } from '../csv'
import { navigate } from '../route'
import { Modal } from './Modal'

const NEW_DECK = ''

export interface PendingImport {
  fileName: string
  result: ParseResult
  /// Deck to preselect as the destination; a new deck when absent.
  deckId?: string
}

/// Opens the system file picker and parses the chosen file.
export function chooseImportFile(onParsed: (pending: Omit<PendingImport, 'deckId'>) => void) {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.csv,.tsv,.txt,text/csv,text/tab-separated-values,text/plain'
  input.onchange = async () => {
    const file = input.files?.[0]
    if (file) onParsed({ fileName: file.name, result: parseCards(await readText(file)) })
  }
  input.click()
}

/// UTF-8, falling back to Windows-1252 for older spreadsheet exports, which
/// otherwise turn accented letters into replacement characters.
async function readText(file: File) {
  const bytes = await file.arrayBuffer()
  const utf8 = new TextDecoder('utf-8').decode(bytes)
  return utf8.includes('�') ? new TextDecoder('windows-1252').decode(bytes) : utf8
}

export function ImportDialog({ pending, onClose }: { pending: PendingImport; onClose: () => void }) {
  const snap = useStore()
  const { decks } = snap
  const { cards, skipped } = pending.result
  const [deckId, setDeckId] = useState(pending.deckId ?? NEW_DECK)
  const [newName, setNewName] = useState(deckNameFromFile(pending.fileName))
  const [skipDuplicates, setSkipDuplicates] = useState(true)
  const [isImporting, setIsImporting] = useState(false)

  const isNewDeck = deckId === NEW_DECK
  const { cards: toImport, duplicates } = skipDuplicates
    ? removeDuplicates(cards, isNewDeck ? [] : cardsInDeck(snap, deckId))
    : { cards, duplicates: 0 }
  const canImport = toImport.length > 0 && (!isNewDeck || newName.trim() !== '') && !isImporting

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!canImport) return
    setIsImporting(true)
    const targetId = isNewDeck ? (await addDeck(newName.trim())).id : deckId
    await addCards(targetId, toImport)
    navigate({ deckId: targetId })
    onClose()
  }

  const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`

  return (
    <Modal title="Import Cards" onClose={onClose} className="editor">
      <form onSubmit={submit}>
        <header className="sheet-bar">
          <button type="button" className="text-button" onClick={onClose}>
            Cancel
          </button>
          <h2>Import Cards</h2>
          <button type="submit" className="text-button strong" disabled={!canImport}>
            Import
          </button>
        </header>

        <div className="sheet-body">
          <p className="import-summary">
            {cards.length ? (
              <>
                <strong>{plural(cards.length, 'card')}</strong> found in {pending.fileName}
              </>
            ) : (
              <>No cards found in {pending.fileName}.</>
            )}
          </p>
          {skipped > 0 && (
            <p className="footnote">{plural(skipped, 'row')} skipped because the front or back was empty.</p>
          )}
          {cards.length === 0 && (
            <p className="footnote">
              Expected two columns, front then back, separated by commas or tabs. A “Front,Back” header row is
              optional.
            </p>
          )}

          {cards.length > 0 && (
            <>
              <h3 className="section-header">Preview</h3>
              <ul className="list grouped">
                {cards.slice(0, 3).map((card, i) => (
                  <li key={i}>
                    <div className="card-row">
                      <span className="card-front">{card.front}</span>
                      <span className="card-back">{card.back}</span>
                    </div>
                  </li>
                ))}
              </ul>
              {cards.length > 3 && <p className="footnote">and {plural(cards.length - 3, 'more card')}</p>}

              <label className="section-header" htmlFor="import-deck">
                Add To
              </label>
              <select
                id="import-deck"
                className="field"
                value={deckId}
                onChange={(e) => setDeckId(e.target.value)}
                data-autofocus
              >
                <option value={NEW_DECK}>New Deck</option>
                {decks.map((deck) => (
                  <option key={deck.id} value={deck.id}>
                    {deck.name}
                  </option>
                ))}
              </select>
              {isNewDeck && (
                <>
                  <label className="section-header" htmlFor="import-deck-name">
                    Deck Name
                  </label>
                  <input
                    id="import-deck-name"
                    className="field"
                    type="text"
                    placeholder="Deck name"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                  />
                </>
              )}

              <label className="field checkbox-field">
                <input type="checkbox" checked={skipDuplicates} onChange={(e) => setSkipDuplicates(e.target.checked)} />
                Skip duplicates
              </label>
              <p className="footnote" role="status">
                {!skipDuplicates
                  ? 'Every card in the file will be added.'
                  : `${
                      duplicates > 0
                        ? `${plural(duplicates, 'duplicate')} will be skipped${isNewDeck ? '' : ' (already in this deck or repeated in the file)'}.`
                        : 'No duplicates found.'
                    } Cards match when the front and back are the same, ignoring case and spacing.`}
              </p>

              <button type="submit" className="button prominent large import-button" disabled={!canImport}>
                {toImport.length ? `Import ${plural(toImport.length, 'Card')}` : 'Nothing New to Import'}
              </button>
            </>
          )}
        </div>
      </form>
    </Modal>
  )
}
