import { useRef, useState, type KeyboardEvent } from 'react'
import { addCard, deleteCard, editCard, type Card, type Deck } from '../db'
import { CloseButton, Confirm, Modal } from './Modal'

/// Creates a new card (when `card` is null) or edits an existing one.
///
/// Keyboard flow, designed for entering lots of cards quickly:
///   Front  --Enter-->  Back  --Enter / Tab-->  save and start the next card
/// Use Shift-Enter (or Option-Enter) to insert a line break inside a side.
/// Cmd/Ctrl-Enter saves and closes.
export function CardEditor({ deck, card, onClose }: { deck: Deck; card: Card | null; onClose: () => void }) {
  const [frontText, setFrontText] = useState(card?.frontText ?? '')
  const [backText, setBackText] = useState(card?.backText ?? '')
  const [savedCount, setSavedCount] = useState(0)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const frontRef = useRef<HTMLTextAreaElement>(null)
  const backRef = useRef<HTMLTextAreaElement>(null)

  const isNew = card === null
  const front = frontText.trim()
  const back = backText.trim()
  const canSave = front !== '' && back !== ''

  async function save() {
    if (card) await editCard(card.id, front, back)
    else await addCard(deck.id, front, back)
  }

  async function saveAndDismiss() {
    if (!canSave) return
    await save()
    onClose()
  }

  async function saveAndContinue() {
    if (!canSave) return
    await save()
    setSavedCount((n) => n + 1)
    setFrontText('')
    setBackText('')
    frontRef.current?.focus()
  }

  /// What Enter / Tab on the back field does: next card when adding, finish
  /// when editing.
  function commit() {
    if (isNew) saveAndContinue()
    else saveAndDismiss()
  }

  function isPlainEnter(e: KeyboardEvent) {
    return e.key === 'Enter' && !e.shiftKey && !e.altKey && !e.metaKey && !e.ctrlKey && !e.nativeEvent.isComposing
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>, field: 'front' | 'back') {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      saveAndDismiss()
    } else if (field === 'front' && isPlainEnter(e)) {
      e.preventDefault()
      backRef.current?.focus()
    } else if (field === 'back' && isPlainEnter(e)) {
      e.preventDefault()
      commit()
    } else if (field === 'back' && e.key === 'Tab' && !e.shiftKey) {
      // Tab out of the last field means "next card".
      e.preventDefault()
      if (canSave) commit()
      else frontRef.current?.focus()
    }
  }

  return (
    <Modal title={isNew ? 'New Card' : 'Edit Card'} onClose={onClose} className="editor">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          saveAndDismiss()
        }}
      >
        <header className="sheet-bar">
          <h2>{isNew ? 'New Card' : 'Edit Card'}</h2>
          <CloseButton onClick={onClose} />
        </header>

        <div className="sheet-body">
          <label className="section-header" htmlFor="card-front">
            Front
          </label>
          <textarea
            id="card-front"
            ref={frontRef}
            data-autofocus
            rows={3}
            placeholder="Question or prompt"
            enterKeyHint="next"
            value={frontText}
            onChange={(e) => setFrontText(e.target.value)}
            onKeyDown={(e) => onKeyDown(e, 'front')}
          />

          <label className="section-header" htmlFor="card-back">
            Back
          </label>
          <textarea
            id="card-back"
            ref={backRef}
            rows={3}
            placeholder="Answer"
            enterKeyHint={isNew ? 'next' : 'done'}
            value={backText}
            onChange={(e) => setBackText(e.target.value)}
            onKeyDown={(e) => onKeyDown(e, 'back')}
          />

          <div className="editor-actions">
            {isNew ? (
              <button type="button" className="button" disabled={!canSave} onClick={saveAndContinue}>
                Add Another
              </button>
            ) : (
              <button type="button" className="button destructive" onClick={() => setConfirmingDelete(true)}>
                Delete
              </button>
            )}
            <button type="submit" className="button prominent" disabled={!canSave}>
              {isNew ? 'Add Card' : 'Save'}
            </button>
          </div>

          {isNew && (
            <>
              <p className="footnote">
                Press Enter or Tab after the back to save and start the next card. Shift-Enter adds a line break.
              </p>
              {savedCount > 0 && (
                <p className="footnote" role="status">
                  {savedCount} card{savedCount === 1 ? '' : 's'} added this session.
                </p>
              )}
            </>
          )}
        </div>
      </form>

      {confirmingDelete && card && (
        <Confirm
          title="Delete this card?"
          message="It can't be undone."
          confirmLabel="Delete"
          onConfirm={() => {
            deleteCard(card.id)
            onClose()
          }}
          onClose={() => setConfirmingDelete(false)}
        />
      )}
    </Modal>
  )
}
