import AsyncStorage from '@react-native-async-storage/async-storage'
import { useState, useEffect } from 'react'

const LANG_KEY = 'allergie-check-lang'

export function useLanguage() {
  const [lang, setLangState] = useState('fr')

  useEffect(() => {
    AsyncStorage.getItem(LANG_KEY).then(stored => {
      if (stored === 'fr' || stored === 'en') setLangState(stored)
    })
  }, [])

  async function setLang(l) {
    setLangState(l)
    await AsyncStorage.setItem(LANG_KEY, l)
  }

  return { lang, setLang }
}
