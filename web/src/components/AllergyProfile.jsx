// src/components/AllergyProfile.jsx
import { useState } from 'react'

const LABELS = {
  fr: {
    title: 'Mon profil',
    placeholder: 'Ex. arachides, gluten, lactose…',
    addBtn: 'Ajouter',
    empty: 'Aucun allergène configuré.',
    removeAriaPrefix: 'Supprimer',
  },
  en: {
    title: 'My profile',
    placeholder: 'E.g. peanuts, gluten, lactose…',
    addBtn: 'Add',
    empty: 'No allergens configured.',
    removeAriaPrefix: 'Remove',
  },
}

function AllergyProfile({ allergens, addAllergen, removeAllergen, lang }) {
  const [input, setInput] = useState('')
  const t = LABELS[lang]

  function handleSubmit(e) {
    e.preventDefault()
    addAllergen(input)
    setInput('')
  }

  return (
    <section className="profile-section">
      <h2 className="profile-title">{t.title}</h2>

      <form className="profile-form" onSubmit={handleSubmit}>
        <input
          className="profile-input"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t.placeholder}
          aria-label={t.title}
        />
        <button className="profile-btn" type="submit">
          {t.addBtn}
        </button>
      </form>

      {allergens.length === 0 ? (
        <p className="unavailable">{t.empty}</p>
      ) : (
        <ul className="allergen-chips">
          {allergens.map((allergen) => (
            <li key={allergen} className="allergen-chip">
              <span>{allergen}</span>
              <button
                className="chip-remove"
                onClick={() => removeAllergen(allergen)}
                aria-label={`${t.removeAriaPrefix} ${allergen}`}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default AllergyProfile
