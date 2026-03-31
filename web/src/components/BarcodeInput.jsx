// src/components/BarcodeInput.jsx
import { useState } from 'react'
import { detectAllergens } from '../utils/allergenDetection'

const OFF_API_URL = 'https://world.openfoodfacts.org/api/v0/product'

const LABELS = {
  fr: {
    placeholder: 'Code-barres (ex. 063211311051)',
    searchBtn: 'Rechercher',
    loading: 'Chargement…',
    notFound: 'Produit introuvable.',
    networkError: 'Erreur réseau. Vérifiez votre connexion.',
    ingredients: 'Ingrédients',
    declaredAllergens: 'Allergènes déclarés',
    unavailable: 'Non disponible',
    none: 'Aucun',
    safe: 'Aucun allergène détecté.',
    alertPrefix: 'Allergènes détectés :',
  },
  en: {
    placeholder: 'Barcode (e.g. 063211311051)',
    searchBtn: 'Search',
    loading: 'Loading…',
    notFound: 'Product not found.',
    networkError: 'Network error. Check your connection.',
    ingredients: 'Ingredients',
    declaredAllergens: 'Declared allergens',
    unavailable: 'Not available',
    none: 'None',
    safe: 'No allergens detected.',
    alertPrefix: 'Allergens detected:',
  },
}

function formatAllergenTag(tag) {
  // Remove language prefix (e.g. "en:gluten" → "gluten")
  return tag.replace(/^[a-z]{2}:/, '')
}

function BarcodeInput({ allergens, lang }) {
  const [barcode, setBarcode] = useState('')
  const [product, setProduct] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const t = LABELS[lang]

  async function handleSubmit(e) {
    e.preventDefault()
    const trimmed = barcode.trim()
    if (!trimmed) return

    // Normalize UPC-A (12 digits) to EAN-13 (13 digits) by padding with a leading zero
    const normalized = trimmed.length === 12 ? '0' + trimmed : trimmed

    setProduct(null)
    setError(null)
    setLoading(true)

    try {
      const res = await fetch(`${OFF_API_URL}/${normalized}.json`)
      const data = await res.json()

      if (data.status === 0) {
        setError(t.notFound)
      } else {
        setProduct(data.product)
      }
    } catch {
      setError(t.networkError)
    } finally {
      setLoading(false)
    }
  }

  const productName = product?.product_name_fr || product?.product_name || '—'
  const ingredientsText = product?.ingredients_text || null
  const allergenTags = product?.allergens_tags ?? []

  const detectedAllergens = product && allergens?.length > 0
    ? detectAllergens(allergens, ingredientsText, allergenTags)
    : []

  const showResult = product && allergens?.length > 0
  const isSafe = showResult && detectedAllergens.length === 0

  return (
    <section className="barcode-section">
      <form className="barcode-form" onSubmit={handleSubmit}>
        <input
          className="barcode-input"
          type="text"
          value={barcode}
          onChange={(e) => setBarcode(e.target.value)}
          placeholder={t.placeholder}
          inputMode="numeric"
          aria-label={t.placeholder}
        />
        <button className="barcode-btn" type="submit" disabled={loading}>
          {t.searchBtn}
        </button>
      </form>

      {loading && (
        <p className="status-message">{t.loading}</p>
      )}

      {error && (
        <p className="status-message error">{error}</p>
      )}

      {product && (
        <div className="product-result">
          <h2 className="product-name">{productName}</h2>

          {showResult && (
            <div className={`detection-banner ${isSafe ? 'safe' : 'alert'}`}>
              {isSafe ? (
                <span>✓ {t.safe}</span>
              ) : (
                <span>
                  ✕ {t.alertPrefix} <strong>{detectedAllergens.join(', ')}</strong>
                </span>
              )}
            </div>
          )}

          <div className="product-section">
            <h3>{t.ingredients}</h3>
            {ingredientsText ? (
              <p className="ingredients-text">{ingredientsText}</p>
            ) : (
              <p className="unavailable">{t.unavailable}</p>
            )}
          </div>

          <div className="product-section">
            <h3>{t.declaredAllergens}</h3>
            {allergenTags.length > 0 ? (
              <ul className="allergen-list">
                {allergenTags.map((tag) => (
                  <li key={tag} className="allergen-tag">
                    {formatAllergenTag(tag)}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="unavailable">{t.none}</p>
            )}
          </div>
        </div>
      )}
    </section>
  )
}

export default BarcodeInput
