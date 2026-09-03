import { create } from 'zustand'
import {
  liveSession,
  sendMagicLink,
  signOut as remoteSignOut,
  supabaseConfigured,
  type Session,
} from './client'
import { drainAndPull } from './worker'

type AuthState = {
  configured: boolean
  session: Session | null
  status: 'local' | 'signed-out' | 'syncing' | 'synced' | 'waiting'
  waiting: number
  message: string
  hydrate: () => Promise<void>
  requestLink: (email: string) => Promise<void>
  signOut: () => Promise<void>
  setWaiting: (n: number) => void
  setStatus: (status: AuthState['status']) => void
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  configured: supabaseConfigured(),
  session: null,
  status: supabaseConfigured() ? 'signed-out' : 'local',
  waiting: 0,
  message: '',
  hydrate: async () => {
    if (!supabaseConfigured()) {
      set({ configured: false, status: 'local' })
      return
    }
    const session = await liveSession()
    set({ configured: true, session, status: session ? 'syncing' : 'signed-out' })
    if (session) {
      await drainAndPull(session, get().setWaiting, get().setStatus)
    }
  },
  requestLink: async (email) => {
    await sendMagicLink(email.trim())
    set({ message: `Link sent to ${email.trim()}. Open it on this phone.` })
  },
  signOut: async () => {
    await remoteSignOut()
    set({ session: null, status: 'signed-out', message: '' })
  },
  setWaiting: (waiting) => set({ waiting, status: waiting > 0 ? 'waiting' : get().status }),
  setStatus: (status) => set({ status }),
}))
