import { NavLink } from 'react-router-dom'

const items = [
  { to: '/practice', label: 'Practice', icon: PracticeIcon },
  { to: '/songs', label: 'Songs', icon: SongsIcon },
  { to: '/tuner', label: 'Tuner', icon: TunerIcon },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
] as const

export function BottomNav() {
  return (
    <nav
      aria-label="Main"
      className="border-t border-line bg-surface pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="grid grid-cols-4">
        {items.map(({ to, label, icon: Icon }) => (
          <li key={to}>
            <NavLink
              to={to}
              className={({ isActive }) =>
                [
                  'flex min-h-16 flex-col items-center justify-center gap-1 px-2 text-[0.8rem] font-medium tracking-wide',
                  isActive ? 'text-amber' : 'text-off',
                ].join(' ')
              }
            >
              {({ isActive }) => (
                <>
                  <Icon active={isActive} />
                  {label}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

function PracticeIcon({ active }: { active: boolean }) {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M8 4.5 19 12 8 19.5V4.5Z"
        fill={active ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function SongsIcon({ active }: { active: boolean }) {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect
        x="5"
        y="3.5"
        width="14"
        height="17"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.75"
        fill={active ? 'currentColor' : 'none'}
        fillOpacity={active ? 0.18 : 0}
      />
      <path d="M8.5 8h7M8.5 12h7M8.5 16h4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  )
}

function TunerIcon({ active }: { active: boolean }) {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3v10.2"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <circle
        cx="12"
        cy="16.5"
        r="3.2"
        stroke="currentColor"
        strokeWidth="1.75"
        fill={active ? 'currentColor' : 'none'}
        fillOpacity={active ? 0.25 : 0}
      />
    </svg>
  )
}

function SettingsIcon({ active }: { active: boolean }) {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 8h14M5 12h14M5 16h14"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        opacity={active ? 1 : 0.85}
      />
      <circle cx="9" cy="8" r="1.6" fill="currentColor" />
      <circle cx="15" cy="12" r="1.6" fill="currentColor" />
      <circle cx="11" cy="16" r="1.6" fill="currentColor" />
    </svg>
  )
}
