// src/App.jsx
import { useState } from 'react'
import { useProfiles } from './hooks/useProfiles'
import ProfilesPage from './components/ProfilesPage'
import BarcodeInput from './components/BarcodeInput'
import './App.css'

const LANG_KEY = 'allergie-check-lang'

const NAV_LABELS = {
  fr: { profile: 'Profil', scan: 'Scanner' },
  en: { profile: 'Profile', scan: 'Scan' },
}

function App() {
  const { profiles, addProfile, removeProfile, addAllergen, removeAllergen } = useProfiles()
  const [lang, setLang] = useState(() => localStorage.getItem(LANG_KEY) || 'fr')
  const [page, setPage] = useState('profile')

  function handleSetLang(l) {
    setLang(l)
    localStorage.setItem(LANG_KEY, l)
  }

  const nav = NAV_LABELS[lang]

  return (
    <div className="app">
      <header className="app-header">
        <h1>Allergie Check</h1>
        <nav className="app-nav">
          <button
            className={`nav-tab ${page === 'profile' ? 'active' : ''}`}
            onClick={() => setPage('profile')}
          >
            {nav.profile}
          </button>
          <button
            className={`nav-tab ${page === 'scan' ? 'active' : ''}`}
            onClick={() => setPage('scan')}
          >
            {nav.scan}
          </button>
        </nav>
      </header>

      <main className="app-main">
        {page === 'profile' ? (
          <ProfilesPage
            profiles={profiles}
            addProfile={addProfile}
            removeProfile={removeProfile}
            addAllergen={addAllergen}
            removeAllergen={removeAllergen}
            lang={lang}
            setLang={handleSetLang}
          />
        ) : (
          <BarcodeInput profiles={profiles} lang={lang} />
        )}
      </main>
    </div>
  )
}

export default App
