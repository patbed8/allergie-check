// src/components/BarcodeInput.jsx
import { useState } from 'react'

const OFF_API_URL = 'https://world.openfoodfacts.org/api/v0/product'

function formatAllergenTag(tag) {
  // Remove language prefix (e.g. "en:gluten" → "gluten")
  return tag.replace(/^[a-z]{2}:/, '')
}

function BarcodeInput() {
  const [barcode, setBarcode] = useState('')
  const [product, setProduct] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

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
        setError('Produit introuvable. / Product not found.')
      } else {
        setProduct(data.product)
      }
    } catch {
      setError('Erreur réseau. Vérifiez votre connexion. / Network error. Check your connection.')
    } finally {
      setLoading(false)
    }
  }

  const productName =
    product?.product_name_fr || product?.product_name || '—'

  const ingredientsText = product?.ingredients_text || null

  const allergenTags = product?.allergens_tags ?? []

  return (
    <section className="barcode-section">
      <form className="barcode-form" onSubmit={handleSubmit}>
        <input
          className="barcode-input"
          type="text"
          value={barcode}
          onChange={(e) => setBarcode(e.target.value)}
          placeholder="Code-barres / Barcode (ex. 059749979452)"
          inputMode="numeric"
          aria-label="Code-barres / Barcode"
        />
        <button className="barcode-btn" type="submit" disabled={loading}>
          Rechercher / Search
        </button>
      </form>

      {loading && (
        <p className="status-message">Chargement… / Loading…</p>
      )}

      {error && (
        <p className="status-message error">{error}</p>
      )}

      {product && (
        <div className="product-result">
          <h2 className="product-name">{productName}</h2>

          <div className="product-section">
            <h3>Ingrédients / Ingredients</h3>
            {ingredientsText ? (
              <p className="ingredients-text">{ingredientsText}</p>
            ) : (
              <p className="unavailable">Non disponible / Not available</p>
            )}
          </div>

          <div className="product-section">
            <h3>Allergènes déclarés / Declared allergens</h3>
            {allergenTags.length > 0 ? (
              <ul className="allergen-list">
                {allergenTags.map((tag) => (
                  <li key={tag} className="allergen-tag">
                    {formatAllergenTag(tag)}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="unavailable">Aucun / None</p>
            )}
          </div>
        </div>
      )}
    </section>
  )
}

export default BarcodeInput
