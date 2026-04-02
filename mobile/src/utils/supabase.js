import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'

const DEVICE_ID_KEY = 'allergie-check-device-id'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY

// Export null when env vars are not configured — callers must guard with isSupabaseConfigured().
export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null

export function isSupabaseConfigured() {
  return supabase !== null
}

// Returns a stable UUID for this device, generated once and persisted in AsyncStorage.
export async function getDeviceId() {
  let id = await AsyncStorage.getItem(DEVICE_ID_KEY)
  if (!id) {
    // Simple UUID v4 generation without external dependencies
    id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = (Math.random() * 16) | 0
      return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
    })
    await AsyncStorage.setItem(DEVICE_ID_KEY, id)
  }
  return id
}

// Fetch profiles from Supabase for this device.
// Returns the profiles array, or null if unavailable / not configured.
export async function fetchProfilesFromSupabase() {
  if (!isSupabaseConfigured()) return null
  try {
    const deviceId = await getDeviceId()
    const { data, error } = await supabase
      .from('profiles')
      .select('data')
      .eq('device_id', deviceId)
      .single()
    if (error || !data) return null
    return Array.isArray(data.data) ? data.data : null
  } catch {
    return null
  }
}

// Upsert profiles to Supabase for this device. Fire-and-forget — errors are swallowed.
export async function saveProfilesToSupabase(profiles) {
  if (!isSupabaseConfigured()) return
  try {
    const deviceId = await getDeviceId()
    await supabase.from('profiles').upsert(
      { device_id: deviceId, data: profiles, updated_at: new Date().toISOString() },
      { onConflict: 'device_id' }
    )
  } catch {
    // Supabase sync failure is non-fatal
  }
}
