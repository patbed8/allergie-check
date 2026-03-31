// src/components/ProfilesPage.jsx
import { useState } from 'react'

const LABELS = {
  fr: {
    language: 'Langue / Language',
    addProfile: 'Nouveau profil',
    addProfilePlaceholder: 'Nom du profil (ex. Ma femme)',
    addBtn: 'Ajouter',
    deleteProfile: 'Supprimer ce profil',
    allergenPlaceholder: 'Ex. arachides, gluten…',
    noAllergens: 'Aucun allergène configuré.',
    removeAllergenPrefix: 'Supprimer',
  },
  en: {
    language: 'Language / Langue',
    addProfile: 'New profile',
    addProfilePlaceholder: 'Profile name (e.g. My wife)',
    addBtn: 'Add',
    deleteProfile: 'Delete this profile',
    allergenPlaceholder: 'E.g. peanuts, gluten…',
    noAllergens: 'No allergens configured.',
    removeAllergenPrefix: 'Remove',
  },
}

function ProfileCard({ profile, lang, onRemoveProfile, onAddAllergen, onRemoveAllergen, canDelete }) {
  const [input, setInput] = useState('')
  const t = LABELS[lang]

  function handleSubmit(e) {
    e.preventDefault()
    onAddAllergen(profile.id, input)
    setInput('')
  }

  return (
    <div className="profile-card">
      <div className="profile-card-header">
        <h3 className="profile-card-name">{profile.name}</h3>
        {canDelete && (
          <button
            className="profile-delete-btn"
            onClick={() => onRemoveProfile(profile.id)}
            aria-label={t.deleteProfile}
          >
            ×
          </button>
        )}
      </div>

      <form className="profile-form" onSubmit={handleSubmit}>
        <input
          className="profile-input"
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={t.allergenPlaceholder}
          aria-label={t.allergenPlaceholder}
        />
        <button className="profile-btn" type="submit">{t.addBtn}</button>
      </form>

      {profile.allergens.length === 0 ? (
        <p className="unavailable">{t.noAllergens}</p>
      ) : (
        <ul className="allergen-chips">
          {profile.allergens.map(allergen => (
            <li key={allergen} className="allergen-chip">
              <span>{allergen}</span>
              <button
                className="chip-remove"
                onClick={() => onRemoveAllergen(profile.id, allergen)}
                aria-label={`${t.removeAllergenPrefix} ${allergen}`}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function ProfilesPage({ profiles, addProfile, removeProfile, addAllergen, removeAllergen, lang, setLang }) {
  const [newProfileInput, setNewProfileInput] = useState('')
  const [showNewProfileForm, setShowNewProfileForm] = useState(false)
  const t = LABELS[lang]

  function handleAddProfile(e) {
    e.preventDefault()
    addProfile(newProfileInput)
    setNewProfileInput('')
    setShowNewProfileForm(false)
  }

  return (
    <div className="page">
      <div className="lang-row">
        <span className="lang-label">{t.language}</span>
        <div className="lang-pills">
          <button
            className={`lang-pill ${lang === 'fr' ? 'active' : ''}`}
            onClick={() => setLang('fr')}
          >
            Français
          </button>
          <button
            className={`lang-pill ${lang === 'en' ? 'active' : ''}`}
            onClick={() => setLang('en')}
          >
            English
          </button>
        </div>
      </div>

      <div className="profiles-list">
        {profiles.map(profile => (
          <ProfileCard
            key={profile.id}
            profile={profile}
            lang={lang}
            onRemoveProfile={removeProfile}
            onAddAllergen={addAllergen}
            onRemoveAllergen={removeAllergen}
            canDelete={profiles.length > 1}
          />
        ))}
      </div>

      {showNewProfileForm ? (
        <form className="new-profile-form" onSubmit={handleAddProfile}>
          <input
            className="profile-input"
            type="text"
            value={newProfileInput}
            onChange={e => setNewProfileInput(e.target.value)}
            placeholder={t.addProfilePlaceholder}
            autoFocus
          />
          <button className="profile-btn" type="submit">{t.addBtn}</button>
        </form>
      ) : (
        <button className="add-profile-btn" onClick={() => setShowNewProfileForm(true)}>
          + {t.addProfile}
        </button>
      )}
    </div>
  )
}

export default ProfilesPage
