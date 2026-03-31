// src/components/BarcodeInput.jsx
import { useState } from 'react'
import { detectAllProfiles } from '../utils/allergenDetection'

const OFF_API_URL = 'https://world.openfoodfacts.org/api/v0/product'

const LABELS = {
  fr: {
    title: 'Scanner un produit',
    placeholder: 'Code-barres (ex. 063211311051)',
    searchBtn: 'Rechercher',
    loading: 'Chargement…',
    notFound: 'Produit introuvable.',
    networkError: 'Erreur réseau. Vérifiez votre connexion.',
    unknownProduct: 'Produit sans nom',
    ingredients: 'Ingrédients',
    declaredAllergens: 'Allergènes déclarés',
    unavailable: 'Non disponible',
    none: 'Aucun',
    safe: 'Aucun allergène détecté.',
    alertTitle: 'Allergènes détectés',
  },
  en: {
    title: 'Scan a product',
    placeholder: 'Barcode (e.g. 063211311051)',
    searchBtn: 'Search',
    loading: 'Loading…',
    notFound: 'Product not found.',
    networkError: 'Network error. Check your connection.',
    unknownProduct: 'Unknown product',
    ingredients: 'Ingredients',
    declaredAllergens: 'Declared allergens',
    unavailable: 'Not available',
    none: 'None',
    safe: 'No allergens detected.',
    alertTitle: 'Allergens detected',
  },
}

function formatAllergenTag(tag) {
  return tag.replace(/^[a-z]{2}:/, '')
}

function BarcodeInput({ profiles, lang }) {
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

  const productName = product?.product_name_fr || product?.product_name || t.unknownProduct
  const ingredientsText = product?.ingredients_text || null
  const allergenTags = product?.allergens_tags ?? []

  const profilesWithAllergens = (profiles || []).filter(p => p.allergens.length > 0)
  const detectionResults = product && profilesWithAllergens.length > 0
    ? detectAllProfiles(profilesWithAllergens, ingredientsText, allergenTags)
    : []

  const showBanner = product && profilesWithAllergens.length > 0
  const isSafe = showBanner && detectionResults.length === 0

  return (
    <div className="page">
      <h2 className="section-title">{t.title}</h2>

      <form className="barcode-form" onSubmit={handleSubmit}>
        <input
          className="barcode-input"
          type="text"
          value={barcode}
          onChange={e => setBarcode(e.target.value)}
          placeholder={t.placeholder}
          inputMode="numeric"
          aria-label={t.placeholder}
        />
        <button className="barcode-btn" type="submit" disabled={loading}>
          {t.searchBtn}
        </button>
      </form>

      {loading && <p className="status-message">{t.loading}</p>}
      {error && <p className="status-message error">{error}</p>}

      {product && (
        <div className="product-result">
          <h2 className="product-name">{productName}</h2>

          {showBanner && (
            <div className={`detection-banner ${isSafe ? 'safe' : 'alert'}`}>
              {isSafe ? (
                <span>✓ {t.safe}</span>
              ) : (
                <div className="detection-details">
                  <span className="detection-alert-title">✕ {t.alertTitle}</span>
                  <ul className="detection-list">
                    {detectionResults.map(({ profileName, detected }) => (
                      <li key={profileName}>
                        <strong>{profileName} :</strong> {detected.join(', ')}
                      </li>
                    ))}
                  </ul>
                </div>
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
                {allergenTags.map(tag => (
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
    </div>
  )
}

export default BarcodeInput
