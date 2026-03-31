import AsyncStorage from '@react-native-async-storage/async-storage'
import { useState, useEffect } from 'react'

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
    AsyncStorage.getItem(STORAGE_KEY).then(json => {
      try {
        const stored = json !== null ? JSON.parse(json) : null
        if (Array.isArray(stored) && stored.length > 0) {
          setProfiles(stored.map(normalizeProfile))
        } else {
          setProfiles(defaultProfiles())
        }
      } catch {
        setProfiles(defaultProfiles())
      } finally {
        setLoaded(true)
      }
    })
  }, [])

  useEffect(() => {
    if (!loaded) return
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(profiles))
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
    setProfiles(prev => prev.map(p =>
      p.id === profileId && !p.allergies.includes(trimmed)
        ? { ...p, allergies: [...p.allergies, trimmed] }
        : p
    ))
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
    setProfiles(prev => prev.map(p =>
      p.id === profileId && !p.intolerances.includes(trimmed)
        ? { ...p, intolerances: [...p.intolerances, trimmed] }
        : p
    ))
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
