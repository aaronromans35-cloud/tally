'use client'
import { useEffect, useRef } from 'react'

/**
 * Shared confirmation dialog for destructive actions.
 *
 * Why this exists: a Phase-3 audit found two places (goal deletion, practice
 * workspace deletion) where a single click fired an irreversible Supabase
 * delete with no confirmation step. This gives every future destructive
 * action a consistent, accessible "are you sure" without each page
 * reinventing a modal.
 *
 * Motion: 180ms, transform+opacity only, disabled entirely under
 * prefers-reduced-motion (handled by the `.confirm-dialog-*` rules in
 * globals.css rather than inline, so the reduced-motion override applies
 * everywhere at once).
 */

interface ConfirmDialogProps {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  /** Renders the confirm button with .btn-danger instead of .btn-primary. */
  danger?: boolean
  busy?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  danger = true,
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const confirmRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    confirmRef.current?.focus()
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onCancel])

  if (!open) return null

  return (
    <div
      className="confirm-dialog-backdrop"
      onClick={onCancel}
      role="presentation"
    >
      <div
        className="confirm-dialog-panel card"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="confirm-dialog-title" style={{ fontSize: '1.0625rem', fontWeight: 600, marginBottom: 8, color: 'var(--foreground)' }}>
          {title}
        </h2>
        <p id="confirm-dialog-description" style={{ fontSize: '0.875rem', color: 'var(--foreground-secondary)', marginBottom: 20, lineHeight: 1.5 }}>
          {description}
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button type="button" className="btn-ghost" onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            type="button"
            className={danger ? 'btn-danger' : 'btn-primary'}
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
