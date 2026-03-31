// src/hooks/useAllergyProfile.js
import { useState, useEffect } from 'react'

const STORAGE_KEY = 'allergie-check-profile'

export function useAllergyProfile() {
  const [allergens, setAllergens] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? []
    } catch {
      return []
    }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allergens))
  }, [allergens])

  function addAllergen(name) {
    const trimmed = name.trim().toLowerCase()
    if (!trimmed || allergens.includes(trimmed)) return
    setAllergens(prev => [...prev, trimmed])
  }

  function removeAllergen(name) {
    setAllergens(prev => prev.filter(a => a !== name))
  }

  return { allergens, addAllergen, removeAllergen }
}
