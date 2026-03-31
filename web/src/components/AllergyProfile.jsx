// src/components/AllergyProfile.jsx
import { useState } from 'react'

function AllergyProfile({ allergens, addAllergen, removeAllergen }) {
  const [input, setInput] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    addAllergen(input)
    setInput('')
  }

  return (
    <section className="profile-section">
      <h2 className="profile-title">Mon profil / My profile</h2>

      <form className="profile-form" onSubmit={handleSubmit}>
        <input
          className="profile-input"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ex. arachides, gluten, lactose…"
          aria-label="Ajouter un allergène / Add an allergen"
        />
        <button className="profile-btn" type="submit">
          Ajouter / Add
        </button>
      </form>

      {allergens.length === 0 ? (
        <p className="unavailable">
          Aucun allergène configuré. / No allergens configured.
        </p>
      ) : (
        <ul className="allergen-chips">
          {allergens.map((allergen) => (
            <li key={allergen} className="allergen-chip">
              <span>{allergen}</span>
              <button
                className="chip-remove"
                onClick={() => removeAllergen(allergen)}
                aria-label={`Supprimer ${allergen} / Remove ${allergen}`}
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
