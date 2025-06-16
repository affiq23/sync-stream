// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})

export type SyncMessage = {
  action: 'play' | 'pause' | 'seek'
  time: number
  userId?: string
  timestamp: number
}

export type RoomState = {
  isPlaying: boolean
  currentTime: number
  lastAction: string
  participants: number
}