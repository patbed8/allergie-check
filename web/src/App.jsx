// src/App.jsx
import { useState } from 'react'
import { useAllergyProfile } from './hooks/useAllergyProfile'
import AllergyProfile from './components/AllergyProfile'
import BarcodeInput from './components/BarcodeInput'
import './App.css'

const LANG_KEY = 'allergie-check-lang'

function App() {
  const { allergens, addAllergen, removeAllergen } = useAllergyProfile()
  const [lang, setLang] = useState(() => localStorage.getItem(LANG_KEY) || 'fr')

  function toggleLang() {
    const next = lang === 'fr' ? 'en' : 'fr'
    setLang(next)
    localStorage.setItem(LANG_KEY, next)
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Allergie Check</h1>
        <button className="lang-toggle" onClick={toggleLang} aria-label="Toggle language">
          {lang === 'fr' ? 'EN' : 'FR'}
        </button>
      </header>
      <main className="app-main">
        <AllergyProfile
          allergens={allergens}
          addAllergen={addAllergen}
          removeAllergen={removeAllergen}
          lang={lang}
        />
        <BarcodeInput allergens={allergens} lang={lang} />
      </main>
    </div>
  )
}

export default App
