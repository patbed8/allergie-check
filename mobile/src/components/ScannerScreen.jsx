import { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { CameraView, useCameraPermissions } from 'expo-camera'
import { detectAllProfiles } from '../utils/allergenDetection'

const COLORS = {
  safe: '#22c55e',
  danger: '#ef4444',
  bg: '#f8fafc',
  card: '#ffffff',
  primary: '#3b82f6',
  border: '#e2e8f0',
  text: '#1e293b',
  muted: '#94a3b8',
}

const OFF_API_URL = 'https://world.openfoodfacts.org/api/v0/product'

const LABELS = {
  fr: {
    title: 'Scannez un produit',
    loading: 'Analyse en cours…',
    notFound: 'Produit introuvable.',
    networkError: 'Erreur réseau. Vérifiez votre connexion.',
    unknownProduct: 'Produit sans nom',
    ingredients: 'Ingrédients',
    declaredAllergens: 'Allergènes déclarés',
    unavailable: 'Non disponible',
    none: 'Aucun',
    safe: 'Aucun allergène détecté.',
    alertTitle: 'Allergènes détectés',
    scanAgain: 'Scanner à nouveau',
    permissionTitle: 'Permission caméra requise',
    permissionMessage: 'Allergie Check a besoin d\'accès à votre caméra pour scanner les codes-barres.',
    permissionBtn: 'Autoriser la caméra',
    noProfiles: 'Aucun profil avec allergènes configuré.',
  },
  en: {
    title: 'Scan a product',
    loading: 'Scanning...',
    notFound: 'Product not found.',
    networkError: 'Network error. Check your connection.',
    unknownProduct: 'Unknown product',
    ingredients: 'Ingredients',
    declaredAllergens: 'Declared allergens',
    unavailable: 'Not available',
    none: 'None',
    safe: 'No allergens detected.',
    alertTitle: 'Allergens detected',
    scanAgain: 'Scan again',
    permissionTitle: 'Camera permission required',
    permissionMessage: 'Allergie Check needs camera access to scan barcodes.',
    permissionBtn: 'Allow camera',
    noProfiles: 'No profile with allergens configured.',
  },
}

function formatAllergenTag(tag) {
  return tag.replace(/^[a-z]{2}:/, '')
}

export default function ScannerScreen({ profiles, lang }) {
  const [permission, requestPermission] = useCameraPermissions()
  const [scanned, setScanned] = useState(false)
  const [loading, setLoading] = useState(false)
  const [product, setProduct] = useState(null)
  const [error, setError] = useState(null)

  const t = LABELS[lang]

  async function handleBarcodeScanned({ data }) {
    setScanned(true)
    const normalized = data.length === 12 ? '0' + data : data
    setLoading(true)
    setError(null)
    setProduct(null)

    try {
      const res = await fetch(`${OFF_API_URL}/${normalized}.json`)
      const json = await res.json()
      if (json.status === 0) {
        setError(t.notFound)
      } else {
        setProduct(json.product)
      }
    } catch {
      setError(t.networkError)
    } finally {
      setLoading(false)
    }
  }

  function handleScanAgain() {
    setScanned(false)
    setProduct(null)
    setError(null)
  }

  if (permission === null) {
    return null
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionTitle}>{t.permissionTitle}</Text>
          <Text style={styles.permissionMessage}>{t.permissionMessage}</Text>
          <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
            <Text style={styles.permissionBtnText}>{t.permissionBtn}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
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
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'] }}
          onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
        />
        {!scanned && (
          <View style={styles.scanOverlay}>
            <View style={styles.scanFrame} />
            <Text style={styles.scanHint}>{t.title}</Text>
          </View>
        )}
      </View>

      {loading && (
        <View style={styles.statusRow}>
          <ActivityIndicator color={COLORS.primary} />
          <Text style={styles.statusText}>{t.loading}</Text>
        </View>
      )}

      {(error || product) && (
        <ScrollView style={styles.resultContainer} contentContainerStyle={styles.resultContent}>
          {error && (
            <Text style={styles.errorText}>{error}</Text>
          )}

          {product && (
            <>
              <Text style={styles.productName}>{productName}</Text>

              {showBanner && (
                <View style={[styles.banner, isSafe ? styles.bannerSafe : styles.bannerDanger]}>
                  {isSafe ? (
                    <Text style={styles.bannerText}>✓ {t.safe}</Text>
                  ) : (
                    <View>
                      <Text style={styles.bannerText}>✕ {t.alertTitle}</Text>
                      {detectionResults.map(({ profileName, detected }) => (
                        <Text key={profileName} style={styles.bannerDetail}>
                          {profileName}: {detected.join(', ')}
                        </Text>
                      ))}
                    </View>
                  )}
                </View>
              )}

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t.ingredients}</Text>
                {ingredientsText ? (
                  <Text style={styles.ingredientsText}>{ingredientsText}</Text>
                ) : (
                  <Text style={styles.mutedText}>{t.unavailable}</Text>
                )}
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t.declaredAllergens}</Text>
                {allergenTags.length > 0 ? (
                  <View style={styles.chipsRow}>
                    {allergenTags.map(tag => (
                      <View key={tag} style={styles.allergenChip}>
                        <Text style={styles.allergenChipText}>{formatAllergenTag(tag)}</Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text style={styles.mutedText}>{t.none}</Text>
                )}
              </View>
            </>
          )}

          <TouchableOpacity style={styles.scanAgainBtn} onPress={handleScanAgain}>
            <Text style={styles.scanAgainBtnText}>{t.scanAgain}</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  cameraContainer: {
    height: 240,
    position: 'relative',
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  scanOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanFrame: {
    width: 180,
    height: 120,
    borderWidth: 2,
    borderColor: '#ffffff',
    borderRadius: 8,
    opacity: 0.7,
  },
  scanHint: {
    marginTop: 12,
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 16,
  },
  statusText: {
    fontSize: 15,
    color: COLORS.muted,
  },
  resultContainer: {
    flex: 1,
  },
  resultContent: {
    padding: 16,
    gap: 12,
  },
  errorText: {
    fontSize: 15,
    color: COLORS.danger,
    textAlign: 'center',
    padding: 16,
  },
  productName: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  banner: {
    borderRadius: 10,
    padding: 14,
  },
  bannerSafe: {
    backgroundColor: '#dcfce7',
  },
  bannerDanger: {
    backgroundColor: '#fee2e2',
  },
  bannerText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  bannerDetail: {
    fontSize: 14,
    color: COLORS.text,
    marginTop: 4,
  },
  section: {
    gap: 6,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  ingredientsText: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },
  mutedText: {
    fontSize: 14,
    color: COLORS.muted,
    fontStyle: 'italic',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  allergenChip: {
    backgroundColor: '#fef9c3',
    borderRadius: 12,
    paddingVertical: 3,
    paddingHorizontal: 10,
  },
  allergenChipText: {
    fontSize: 13,
    color: '#713f12',
  },
  scanAgainBtn: {
    height: 48,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  scanAgainBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 16,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
  },
  permissionMessage: {
    fontSize: 15,
    color: COLORS.muted,
    textAlign: 'center',
    lineHeight: 22,
  },
  permissionBtn: {
    height: 48,
    paddingHorizontal: 24,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
})
