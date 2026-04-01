import AsyncStorage from '@react-native-async-storage/async-storage'
import { useState, useEffect } from 'react'
import { fetchProfilesFromSupabase, saveProfilesToSupabase } from '../utils/supabase'

const STORAGE_KEY = 'allergie-check-profiles'

function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

// Normalize profile to new { allergies, intolerances } structure,
// migrating from old { allergens } format if needed.
function normalizeProfile(p) {
  return {
    id: p.id,
    name: p.name,
    allergies: p.allergies || p.allergens || [],
    intolerances: p.intolerances || [],
  }
}

function defaultProfiles() {
  return [{ id: makeId(), name: 'Moi', allergies: [], intolerances: [] }]
}

export function useProfiles() {
  const [profiles, setProfiles] = useState([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    async function loadProfiles() {
      // 1. Load from local cache first (instant)
      let local = null
      try {
        const json = await AsyncStorage.getItem(STORAGE_KEY)
        local = json !== null ? JSON.parse(json) : null
      } catch {}

      if (Array.isArray(local) && local.length > 0) {
        setProfiles(local.map(normalizeProfile))
      } else {
        setProfiles(defaultProfiles())
      }
      setLoaded(true)

      // 2. Pull from Supabase in background and refresh if data exists (last-write-wins)
      const remote = await fetchProfilesFromSupabase()
      if (Array.isArray(remote) && remote.length > 0) {
        const normalized = remote.map(normalizeProfile)
        setProfiles(normalized)
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(normalized))
      }
    }
    loadProfiles()
  }, [])

  useEffect(() => {
    if (!loaded) return
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(profiles))
    // Sync to Supabase on every change (fire-and-forget)
    saveProfilesToSupabase(profiles)
  }, [profiles, loaded])

  function addProfile(name) {
    const trimmed = name.trim()
    if (!trimmed) return
    setProfiles(prev => [...prev, { id: makeId(), name: trimmed, allergies: [], intolerances: [] }])
  }

  function removeProfile(id) {
    setProfiles(prev => prev.length > 1 ? prev.filter(p => p.id !== id) : prev)
  }

  function updateProfileName(id, name) {
    const trimmed = name.trim()
    if (!trimmed) return
    setProfiles(prev => prev.map(p => p.id === id ? { ...p, name: trimmed } : p))
  }

  function addAllergy(profileId, allergen) {
    const trimmed = allergen.trim().toLowerCase()
    if (!trimmed) return
    setProfiles(prev => prev.map(p => {
      if (p.id !== profileId) return p
      if (p.allergies.some(a => a.toLowerCase() === trimmed)) return p
      return { ...p, allergies: [...p.allergies, trimmed] }
    }))
  }

  function removeAllergy(profileId, allergen) {
    setProfiles(prev => prev.map(p =>
      p.id === profileId
        ? { ...p, allergies: p.allergies.filter(a => a !== allergen) }
        : p
    ))
  }

  function addIntolerance(profileId, allergen) {
    const trimmed = allergen.trim().toLowerCase()
    if (!trimmed) return
    setProfiles(prev => prev.map(p => {
      if (p.id !== profileId) return p
      if (p.intolerances.some(a => a.toLowerCase() === trimmed)) return p
      return { ...p, intolerances: [...p.intolerances, trimmed] }
    }))
  }

  function removeIntolerance(profileId, allergen) {
    setProfiles(prev => prev.map(p =>
      p.id === profileId
        ? { ...p, intolerances: p.intolerances.filter(a => a !== allergen) }
        : p
    ))
  }

  return {
    profiles,
    addProfile,
    removeProfile,
    updateProfileName,
    addAllergy,
    removeAllergy,
    addIntolerance,
    removeIntolerance,
    loaded,
  }
}
