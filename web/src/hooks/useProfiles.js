// src/hooks/useProfiles.js
import { useState, useEffect } from 'react'

const STORAGE_KEY = 'allergie-check-profiles'

function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

function defaultProfiles() {
  return [{ id: makeId(), name: 'Moi', allergens: [] }]
}

function load() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY))
    return Array.isArray(stored) && stored.length > 0 ? stored : defaultProfiles()
  } catch {
    return defaultProfiles()
  }
}

export function useProfiles() {
  const [profiles, setProfiles] = useState(load)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles))
  }, [profiles])

  function addProfile(name) {
    const trimmed = name.trim()
    if (!trimmed) return
    setProfiles(prev => [...prev, { id: makeId(), name: trimmed, allergens: [] }])
  }

  function removeProfile(id) {
    setProfiles(prev => prev.length > 1 ? prev.filter(p => p.id !== id) : prev)
  }

  function addAllergen(profileId, allergen) {
    const trimmed = allergen.trim().toLowerCase()
    if (!trimmed) return
    setProfiles(prev => prev.map(p =>
      p.id === profileId && !p.allergens.includes(trimmed)
        ? { ...p, allergens: [...p.allergens, trimmed] }
        : p
    ))
  }

  function removeAllergen(profileId, allergen) {
    setProfiles(prev => prev.map(p =>
      p.id === profileId
        ? { ...p, allergens: p.allergens.filter(a => a !== allergen) }
        : p
    ))
  }

  return { profiles, addProfile, removeProfile, addAllergen, removeAllergen }
}
