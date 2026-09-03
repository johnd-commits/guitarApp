import { useState } from 'react'
import { useAuthStore } from '../sync/authStore'

export function AccountPanel() {
  const configured = useAuthStore((s) => s.configured)
  const session = useAuthStore((s) => s.session)
  const status = useAuthStore((s) => s.status)
  const waiting = useAuthStore((s) => s.waiting)
  const message = useAuthStore((s) => s.message)
  const requestLink = useAuthStore((s) => s.requestLink)
  const signOut = useAuthStore((s) => s.signOut)
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)

  const label =
    status === 'syncing'
      ? 'syncing'
      : status === 'waiting'
        ? `${waiting} waiting`
        : status === 'synced'
          ? 'synced'
          : status === 'local'
            ? 'local only'
            : 'signed out'

  return (
    <div className="space-y-3 rounded-2xl bg-surface px-4 py-4">
      <div className="flex items-baseline justify-between">
        <p className="text-muted">Account — magic link, no password</p>
        <p className="text-sm text-off">{label}</p>
      </div>
      {!configured ? (
        <p className="text-sm text-muted">
          Sync is wired to this project but the anon key is not in the build yet.
        </p>
      ) : session ? (
        <>
          <p className="text-sm">{session.user.email ?? session.user.id}</p>
          <button
            type="button"
            className="min-h-12 w-full rounded-2xl bg-raised"
            onClick={() => void signOut()}
          >
            Sign out
          </button>
        </>
      ) : (
        <>
          <p className="text-sm text-muted">
            Signed out, practice stays on this phone. Sign in to pull the same
            lesson onto another device.
          </p>
          <label className="block space-y-2">
            <span className="text-muted">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-2xl bg-raised px-3 py-3 text-ink"
              placeholder="you@example.com"
            />
          </label>
          <button
            type="button"
            disabled={busy || !email.includes('@')}
            className="min-h-12 w-full rounded-2xl bg-amber font-medium text-bg disabled:opacity-50"
            onClick={() => {
              setBusy(true)
              void requestLink(email).finally(() => setBusy(false))
            }}
          >
            Email me a link
          </button>
        </>
      )}
      {message ? <p className="text-sm text-off">{message}</p> : null}
    </div>
  )
}
