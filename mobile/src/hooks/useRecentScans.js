import AsyncStorage from '@react-native-async-storage/async-storage'
import { useState, useEffect } from 'react'

const STORAGE_KEY = 'allergie-check-recent-scans'
const MAX_SCANS = 10

export function useRecentScans() {
  const [recentScans, setRecentScans] = useState([])

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(json => {
      try {
        const stored = json !== null ? JSON.parse(json) : []
        setRecentScans(Array.isArray(stored) ? stored : [])
      } catch {
        setRecentScans([])
      }
    })
  }, [])

  function addScan(barcode, product) {
    const entry = {
      id: Date.now().toString(36),
      barcode,
      productName: product.product_name_fr || product.product_name || '',
      scannedAt: Date.now(),
      // Store only what the result view needs
      productData: {
        product_name: product.product_name,
        product_name_fr: product.product_name_fr,
        ingredients_text: product.ingredients_text,
        allergens_tags: product.allergens_tags,
      },
    }
    setRecentScans(prev => {
      const updated = [entry, ...prev.filter(s => s.barcode !== barcode)].slice(0, MAX_SCANS)
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      return updated
    })
  }

  return { recentScans, addScan }
}
