import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'

/// A native modal <dialog>: focus trapping, Escape to close and the backdrop
/// come from the browser.
///
/// Mark the element to focus on open with `data-autofocus`. React's
/// `autoFocus` runs before `showModal()`, which then moves focus to the
/// dialog's first focusable element, so it can't be used here.
export function Modal({
  title,
  onClose,
  children,
  className,
}: {
  title: string
  onClose: () => void
  children: ReactNode
  className?: string
}) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current!
    dialog.showModal()
    dialog.querySelector<HTMLElement>('[data-autofocus]')?.focus()
    return () => dialog.close()
  }, [])

  return (
    <dialog
      ref={ref}
      className={`modal ${className ?? ''}`}
      aria-label={title}
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      onClick={(e) => {
        // Clicking the backdrop (the dialog element itself) dismisses.
        if (e.target === e.currentTarget) onClose()
      }}
    >
      {children}
    </dialog>
  )
}

/// Single-field prompt, used for creating and renaming decks.
export function NamePrompt({
  title,
  initialValue = '',
  confirmLabel,
  onSubmit,
  onClose,
}: {
  title: string
  initialValue?: string
  confirmLabel: string
  onSubmit: (name: string) => void
  onClose: () => void
}) {
  const [value, setValue] = useState(initialValue)
  const name = value.trim()

  function submit(e: FormEvent) {
    e.preventDefault()
    if (!name) return
    onSubmit(name)
    onClose()
  }

  return (
    <Modal title={title} onClose={onClose} className="modal-small">
      <form onSubmit={submit}>
        <h2>{title}</h2>
        <input
          data-autofocus
          type="text"
          placeholder="Deck name"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={(e) => e.target.select()}
        />
        <div className="modal-actions">
          <button type="button" className="button" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="button prominent" disabled={!name}>
            {confirmLabel}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export function Confirm({
  title,
  message,
  confirmLabel,
  onConfirm,
  onClose,
}: {
  title: string
  message: string
  confirmLabel: string
  onConfirm: () => void
  onClose: () => void
}) {
  return (
    <Modal title={title} onClose={onClose} className="modal-small">
      <h2>{title}</h2>
      <p className="secondary">{message}</p>
      <div className="modal-actions">
        <button type="button" className="button" onClick={onClose} data-autofocus>
          Cancel
        </button>
        <button
          type="button"
          className="button prominent destructive"
          onClick={() => {
            onConfirm()
            onClose()
          }}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
