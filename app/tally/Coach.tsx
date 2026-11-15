'use client'
/**
 * Tally's AI coach — a drawer available from every tab.
 *
 * Deliberately NOT a seventh tab: the useful question is always about the
 * screen you're already on ("why did Food run out?"), so the coach should
 * open over that screen rather than replace it.
 *
 * It sends aggregate budget figures only — see `coachContext` in model.ts.
 */
import { useEffect, useRef, useState } from 'react'
import { MONO, css as c, sx } from './lib'
import type { TallyModel } from './model'
import { UpgradeNote } from './components'

const mono = (x: string) => sx(c(x), { fontFamily: MONO })

const INK = '#14140f'
const GREEN = '#1c6a48'
const LIME = '#cdf06a'
const MUTED = '#6b6a60'
const LINE = '#e0ded4'

interface Msg {
  role: 'user' | 'assistant'
  content: string
}

/** Openers that are answerable from the data we actually send. */
const STARTERS = [
  'Where is my money actually going?',
  'What should I cut first?',
  'Can I afford to go out this weekend?',
  'How do I hit my goal on time?',
]

export default function Coach({ m }: { m: TallyModel }) {
  const [open, setOpen] = useState(false)
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const scroller = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const locked = m.ent.aiMessagesPerMonth === 0

  useEffect(() => {
    if (scroller.current) scroller.current.scrollTop = scroller.current.scrollHeight
  }, [msgs, busy])

  // Escape closes the drawer, like every other overlay on the web.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  async function send(text: string, base: Msg[] = msgs) {
    const content = text.trim()
    if (!content || busy) return
    setError('')
    const next: Msg[] = [...base, { role: 'user', content }]
    setMsgs(next)
    setInput('')
    setBusy(true)
    try {
      const res = await fetch('/api/tally/coach', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ messages: next, context: m.coachContext }),
      })
      // A gateway timeout comes back as HTML, not JSON — don't let that
      // masquerade as "no connection".
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        setError(
          data?.error ??
            (res.status >= 500
              ? 'The coach took too long to answer. Try again.'
              : 'The coach could not answer just now.'),
        )
        return
      }
      if (typeof data?.reply !== 'string') {
        setError('The coach could not answer just now.')
        return
      }
      setMsgs([...next, { role: 'assistant', content: data.reply }])
    } catch {
      setError('Could not reach the coach. Check your connection.')
    } finally {
      setBusy(false)
      window.setTimeout(() => inputRef.current?.focus(), 30)
    }
  }

  /** Resend the last question after a failure, without retyping it. */
  const retry = () => {
    const last = msgs[msgs.length - 1]
    if (!last || last.role !== 'user') return
    // Resend from the history before the unanswered question.
    send(last.content, msgs.slice(0, -1))
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => {
          setOpen(true)
          window.setTimeout(() => inputRef.current?.focus(), 60)
        }}
        aria-label="Ask Tally's coach"
        style={c(
          `position:fixed;right:20px;bottom:20px;z-index:60;display:flex;align-items:center;gap:9px;font-family:'IBM Plex Sans',sans-serif;font-size:14px;font-weight:600;min-height:48px;padding:0 20px;border-radius:999px;border:none;background:${INK};color:#f5f4ef;cursor:pointer;box-shadow:0 6px 24px rgba(20,20,15,0.22)`,
        )}
      >
        <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: 99, background: LIME }} />
        Ask Tally
      </button>
    )
  }

  return (
    <>
      {/* scrim */}
      <div
        onClick={() => setOpen(false)}
        style={c('position:fixed;inset:0;background:rgba(20,20,15,0.32);z-index:70')}
      />
      <aside
        role="dialog"
        aria-label="Tally coach"
        style={c(
          `position:fixed;right:0;top:0;bottom:0;width:min(420px,100vw);z-index:71;background:#f5f4ef;border-left:1px solid ${LINE};display:flex;flex-direction:column`,
        )}
      >
        <header
          style={c(
            `padding:16px 18px;border-bottom:1px solid ${LINE};display:flex;align-items:center;gap:10px;flex:none`,
          )}
        >
          <span style={{ width: 8, height: 8, borderRadius: 99, background: GREEN }} aria-hidden="true" />
          <strong style={c('font-size:15px')}>Coach</strong>
          <span style={mono(`font-size:10px;letter-spacing:0.08em;text-transform:uppercase;color:${MUTED}`)}>
            {m.planName}
          </span>
          {msgs.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setMsgs([])
                setError('')
              }}
              style={c(
                `margin-left:auto;font-family:'IBM Plex Sans',sans-serif;font-size:12px;font-weight:600;color:${MUTED};background:none;border:none;cursor:pointer;padding:6px 8px`,
              )}
            >
              New chat
            </button>
          )}
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close coach"
            style={c(
              `margin-left:${msgs.length > 0 ? '0' : 'auto'};width:32px;height:32px;border-radius:9px;border:1px solid ${LINE};background:transparent;color:${MUTED};cursor:pointer;font-size:16px;line-height:1`,
            )}
          >
            ×
          </button>
        </header>

        <div ref={scroller} style={c('flex:1;overflow-y:auto;padding:18px')}>
          {locked ? (
            <UpgradeNote
              m={m}
              need="starter"
              text="The coach reads your actual buckets and goals, then tells you what to do about them. Included from Starter."
            />
          ) : msgs.length === 0 ? (
            <div>
              <p style={c('font-size:15px;line-height:1.6;color:#4a4941;margin:0 0 16px')}>
                I can see your buckets, goals and subscriptions — not your name or your bank
                details. Ask me anything about them.
              </p>
              <div style={c('display:flex;flex-direction:column;gap:8px')}>
                {STARTERS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => send(s)}
                    style={c(
                      `text-align:left;font-family:'IBM Plex Sans',sans-serif;font-size:14px;padding:12px 14px;border-radius:12px;border:1px solid ${LINE};background:#ffffff;color:${INK};cursor:pointer`,
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div style={c('display:flex;flex-direction:column;gap:14px')}>
              {msgs.map((msg, i) => (
                <div
                  key={i}
                  style={c(
                    msg.role === 'user'
                      ? `align-self:flex-end;max-width:85%;background:${INK};color:#f5f4ef;border-radius:16px 16px 4px 16px;padding:11px 14px;font-size:14px;line-height:1.55;white-space:pre-wrap`
                      : `align-self:flex-start;max-width:90%;background:#ffffff;border:1px solid ${LINE};border-radius:16px 16px 16px 4px;padding:12px 14px;font-size:14px;line-height:1.6;white-space:pre-wrap`,
                  )}
                >
                  {msg.content}
                </div>
              ))}
              {busy && (
                <div style={mono(`font-size:11px;color:${MUTED};align-self:flex-start;padding:4px 2px`)}>
                  thinking…
                </div>
              )}
            </div>
          )}

          {error && (
            <div
              role="alert"
              style={c('font-size:13px;line-height:1.5;color:#b8422a;background:#fbeae6;border:1px solid #e7c3ba;border-radius:10px;padding:10px 12px;margin-top:14px')}
            >
              {error}
              {msgs.length > 0 && msgs[msgs.length - 1].role === 'user' && !busy && (
                <button
                  type="button"
                  onClick={retry}
                  style={c("display:block;margin-top:8px;font-family:'IBM Plex Sans',sans-serif;font-size:13px;font-weight:600;color:#14140f;background:none;border:none;padding:0;cursor:pointer;text-decoration:underline")}
                >
                  Try again
                </button>
              )}
            </div>
          )}
        </div>

        {!locked && (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              send(input)
            }}
            style={c(`padding:14px;border-top:1px solid ${LINE};flex:none;background:#f5f4ef`)}
          >
            <div style={c('display:flex;gap:9px;align-items:flex-end')}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  // Enter sends; Shift+Enter makes a newline.
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    send(input)
                  }
                }}
                rows={1}
                maxLength={1200}
                placeholder="Ask about your budget…"
                style={sx(
                  c(
                    `flex:1;font-family:'IBM Plex Sans',sans-serif;font-size:15px;padding:11px 13px;border:1px solid #d6d3c8;border-radius:12px;background:#ffffff;color:${INK};outline:none;resize:none;max-height:120px`,
                  ),
                  {},
                )}
              />
              <button
                type="submit"
                disabled={busy || !input.trim()}
                style={c(
                  `font-family:'IBM Plex Sans',sans-serif;font-size:14px;font-weight:600;min-height:44px;padding:0 17px;border-radius:12px;border:none;background:${GREEN};color:#f7fbf6;cursor:${busy || !input.trim() ? 'default' : 'pointer'};opacity:${busy || !input.trim() ? 0.5 : 1};flex:none`,
                )}
              >
                Send
              </button>
            </div>
            <p style={mono(`font-size:10px;color:${MUTED};margin:8px 2px 0;line-height:1.5`)}>
              Guidance only — not financial advice. Tally can‘t move money.
            </p>
          </form>
        )}
      </aside>
    </>
  )
}
