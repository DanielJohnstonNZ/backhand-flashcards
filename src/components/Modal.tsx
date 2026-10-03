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

/// The ✕ in a dialog's header.
export function CloseButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className="icon-button" aria-label="Close" title="Close" onClick={onClick}>
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M6 6l12 12M18 6L6 18" />
      </svg>
    </button>
  )
}

/// Single-field prompt, used for creating and renaming decks.
export function NamePrompt({
  title,
  initialValue = '',
  confirmLabel,
  onSubmit,
  onClose,
  children,
}: {
  title: string
  initialValue?: string
  confirmLabel: string
  onSubmit: (name: string) => void
  onClose: () => void
  /// Extra options shown below the buttons.
  children?: ReactNode
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
      {children}
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
