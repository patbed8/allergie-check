import { useState, useRef } from 'react'
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
import { Ionicons } from '@expo/vector-icons'
import { detectAllProfiles } from '../utils/allergenDetection'
import { useRecentScans } from '../hooks/useRecentScans'
import { useOCR } from '../hooks/useOCR'

// ── Types ─────────────────────────────────────────────────────────────────────
// ocrAnalysis: null | { results: MergedResult[], aiProvider: 'apple'|'gemini'|'none' }
// MergedResult: { profileName, detectedAllergies, detectedIntolerances,
//                 aiOnlyAllergies, aiOnlyIntolerances }

const COLORS = {
  safe: '#22c55e',
  danger: '#ef4444',
  warning: '#f59e0b',
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
    scanPrompt: 'Appuyez pour scanner',
    scanBtn: 'Scanner un produit',
    ocrBtn: 'Photographier l\'étiquette',
    cancel: 'Annuler',
    retry: 'Réessayer',
    loading: 'Analyse en cours…',
    ocrLoading: 'Lecture de l\'étiquette…',
    notFound: 'Produit introuvable.',
    networkError: 'Erreur réseau. Vérifiez votre connexion.',
    unknownProduct: 'Produit sans nom',
    ocrProductName: 'Produit scanné',
    ingredients: 'Ingrédients',
    declaredAllergens: 'Allergènes déclarés',
    ocrExtractedText: 'Texte extrait',
    ocrTextHide: 'Masquer',
    ocrTextShow: 'Afficher',
    unavailable: 'Non disponible',
    none: 'Aucun',
    safe: 'Aucun allergène détecté.',
    alertAllergies: 'Allergies détectées',
    alertIntolerances: 'Intolérances détectées',
    alertAIAllergies: 'Allergies détectées (IA)',
    alertAIIntolerances: 'Intolérances détectées (IA)',
    scanAgain: 'Scanner à nouveau',
    backHome: 'Retour',
    permissionTitle: 'Permission caméra requise',
    permissionMessage: 'Allergie Check a besoin d\'accès à votre caméra pour scanner les codes-barres.',
    permissionBtn: 'Autoriser la caméra',
    recentTitle: 'Produits récents',
    today: 'Aujourd\'hui',
    yesterday: 'Hier',
    ocrError_permission_denied: 'Accès à la caméra refusé. Autorisez l\'accès dans les réglages.',
    ocrError_empty_text: 'Aucun texte détecté sur l\'image. Essayez avec une meilleure photo.',
    ocrError_ocr_failed: 'Échec de la lecture. Essayez à nouveau.',
    ocrSourceLabel: 'OCR',
    barcodeSourceLabel: 'Code-barres',
  },
  en: {
    scanPrompt: 'Tap to scan',
    scanBtn: 'Scan a product',
    ocrBtn: 'Photograph a label',
    cancel: 'Cancel',
    retry: 'Try again',
    loading: 'Scanning...',
    ocrLoading: 'Reading label...',
    notFound: 'Product not found.',
    networkError: 'Network error. Check your connection.',
    unknownProduct: 'Unknown product',
    ocrProductName: 'Scanned product',
    ingredients: 'Ingredients',
    declaredAllergens: 'Declared allergens',
    ocrExtractedText: 'Extracted text',
    ocrTextHide: 'Hide',
    ocrTextShow: 'Show',
    unavailable: 'Not available',
    none: 'None',
    safe: 'No allergens detected.',
    alertAllergies: 'Allergies detected',
    alertIntolerances: 'Intolerances detected',
    alertAIAllergies: 'Allergies detected (AI)',
    alertAIIntolerances: 'Intolerances detected (AI)',
    scanAgain: 'Scan again',
    backHome: 'Back',
    permissionTitle: 'Camera permission required',
    permissionMessage: 'Allergie Check needs camera access to scan barcodes.',
    permissionBtn: 'Allow camera',
    recentTitle: 'Recent products',
    today: 'Today',
    yesterday: 'Yesterday',
    ocrError_permission_denied: 'Camera access denied. Allow access in Settings.',
    ocrError_empty_text: 'No text detected in the image. Try a clearer photo.',
    ocrError_ocr_failed: 'Reading failed. Please try again.',
    ocrSourceLabel: 'OCR',
    barcodeSourceLabel: 'Barcode',
  },
}

function formatAllergenTag(tag) {
  return tag.replace(/^[a-z]{2}:/, '')
}

function formatDate(timestamp, lang) {
  const t = LABELS[lang]
  const now = Date.now()
  const diff = now - timestamp
  const oneDay = 86400000

  if (diff < oneDay) return t.today
  if (diff < 2 * oneDay) return t.yesterday

  return new Date(timestamp).toLocaleDateString(lang === 'fr' ? 'fr-CA' : 'en-CA', {
    month: 'short',
    day: 'numeric',
  })
}

function DetectionBanner({ results, isSafe, t }) {
  if (isSafe) {
    return (
      <View style={[styles.banner, styles.bannerSafe]}>
        <Text style={styles.bannerSafeText}>✓ {t.safe}</Text>
      </View>
    )
  }

  return (
    <View style={[styles.banner, styles.bannerDanger]}>
      {results.map(({
        profileName,
        detectedAllergies,
        detectedIntolerances,
        aiOnlyAllergies = [],
        aiOnlyIntolerances = [],
      }) => (
        <View key={profileName} style={styles.bannerProfile}>
          <Text style={styles.bannerProfileName}>{profileName}</Text>
          {detectedAllergies.length > 0 && (
            <View style={styles.bannerGroup}>
              <Text style={styles.bannerGroupLabel}>⚠ {t.alertAllergies}</Text>
              <Text style={styles.bannerGroupItems}>{detectedAllergies.join(', ')}</Text>
            </View>
          )}
          {detectedIntolerances.length > 0 && (
            <View style={styles.bannerGroup}>
              <Text style={[styles.bannerGroupLabel, styles.bannerGroupLabelWarning]}>
                ⚡ {t.alertIntolerances}
              </Text>
              <Text style={styles.bannerGroupItems}>{detectedIntolerances.join(', ')}</Text>
            </View>
          )}
          {aiOnlyAllergies.length > 0 && (
            <View style={styles.bannerGroup}>
              <Text style={styles.bannerGroupLabel}>🤖 {t.alertAIAllergies}</Text>
              <Text style={styles.bannerGroupItems}>{aiOnlyAllergies.join(', ')}</Text>
            </View>
          )}
          {aiOnlyIntolerances.length > 0 && (
            <View style={styles.bannerGroup}>
              <Text style={[styles.bannerGroupLabel, styles.bannerGroupLabelWarning]}>
                🤖 {t.alertAIIntolerances}
              </Text>
              <Text style={styles.bannerGroupItems}>{aiOnlyIntolerances.join(', ')}</Text>
            </View>
          )}
        </View>
      ))}
    </View>
  )
}

// Collapsible section showing the raw OCR text (OCR mode only)
function OCRTextSection({ ocrText, t }) {
  const [expanded, setExpanded] = useState(false)
  if (!ocrText) return null

  return (
    <View style={styles.section}>
      <TouchableOpacity
        style={styles.ocrTextHeader}
        onPress={() => setExpanded(v => !v)}
      >
        <Text style={styles.sectionTitle}>{t.ocrExtractedText}</Text>
        <Text style={styles.ocrTextToggle}>
          {expanded ? t.ocrTextHide : t.ocrTextShow}
        </Text>
      </TouchableOpacity>
      {expanded && (
        <Text style={styles.ocrRawText}>{ocrText}</Text>
      )}
    </View>
  )
}

// precomputedResults is set for OCR scans (already includes AI findings).
// For barcode scans it is null and detection runs here via detectAllProfiles().
function ProductResult({ product, profiles, t, lang, onScanAgain, onBack, ocrText, precomputedResults }) {
  const productName = product?.product_name_fr || product?.product_name || t.unknownProduct
  const ingredientsText = product?.ingredients_text || null
  const allergenTags = product?.allergens_tags ?? []

  let detectionResults, showBanner
  if (precomputedResults) {
    detectionResults = precomputedResults
    showBanner = true
  } else {
    const profilesWithItems = (profiles || []).filter(
      p => (p.allergies || []).length > 0 || (p.intolerances || []).length > 0
    )
    detectionResults = profilesWithItems.length > 0
      ? detectAllProfiles(profilesWithItems, ingredientsText, allergenTags)
      : []
    showBanner = profilesWithItems.length > 0
  }
  const isSafe = showBanner && detectionResults.length === 0

  return (
    <ScrollView style={styles.resultContainer} contentContainerStyle={styles.resultContent}>
      <Text style={styles.productName}>{productName}</Text>

      {showBanner && (
        <DetectionBanner results={detectionResults} isSafe={isSafe} t={t} />
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t.ingredients}</Text>
        {ingredientsText
          ? <Text style={styles.ingredientsText}>{ingredientsText}</Text>
          : <Text style={styles.mutedText}>{t.unavailable}</Text>
        }
      </View>

      {/* Declared allergens: shown for barcode mode only (allergenTags not empty) */}
      {allergenTags.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.declaredAllergens}</Text>
          <View style={styles.chipsRow}>
            {allergenTags.map(tag => (
              <View key={tag} style={styles.allergenChip}>
                <Text style={styles.allergenChipText}>{formatAllergenTag(tag)}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Collapsible raw OCR text: shown in OCR mode only */}
      <OCRTextSection ocrText={ocrText} t={t} />

      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.secondaryBtn} onPress={onBack}>
          <Ionicons name="arrow-back" size={20} color={COLORS.primary} style={{ marginRight: 8 }} />
          <Text style={styles.secondaryBtnText}>{t.backHome}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.primaryBtn, { flex: 1 }]} onPress={onScanAgain}>
          <Ionicons name="camera-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.primaryBtnText}>{t.scanAgain}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

// scanMode: null | 'barcode' | 'ocr'
export default function ScannerScreen({ profiles, lang }) {
  const [permission, requestPermission] = useCameraPermissions()
  const [scanMode, setScanMode] = useState(null)
  const [scanned, setScanned] = useState(false)
  const scanLock = useRef(false)
  const [loading, setLoading] = useState(false)
  const [product, setProduct] = useState(null)
  const [error, setError] = useState(null)
  const [ocrText, setOcrText] = useState(null)
  const [ocrAnalysis, setOcrAnalysis] = useState(null) // { results, aiProvider }
  const { recentScans, addScan } = useRecentScans()
  const { isProcessing, error: ocrError, pickImageFromCamera, analyzeLabel, clearError: clearOcrError } = useOCR()

  const t = LABELS[lang]

  // ── Barcode flow ─────────────────────────────────────────────────────────────

  async function handleBarcodeScanned({ data }) {
    if (scanLock.current) return
    scanLock.current = true
    setScanned(true)
    setScanMode(null)
    const normalized = data.length === 12 ? '0' + data : data
    setLoading(true)
    setError(null)
    setProduct(null)
    setOcrText(null)

    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 10000)
      const res = await fetch(`${OFF_API_URL}/${normalized}.json`, { signal: controller.signal })
      clearTimeout(timeout)
      const json = await res.json()
      if (json.status === 0) {
        setError(t.notFound)
      } else {
        setProduct(json.product)
        addScan(normalized, json.product, 'barcode')
      }
    } catch {
      setError(t.networkError)
    } finally {
      setLoading(false)
    }
  }

  // ── OCR flow ─────────────────────────────────────────────────────────────────

  async function handleStartOCR() {
    if (isProcessing) return
    clearOcrError()
    setScanMode('ocr')
    setError(null)
    setOcrText(null)
    setOcrAnalysis(null)
    setProduct(null)

    const uri = await pickImageFromCamera()
    if (!uri) {
      // User cancelled or permission denied — return to idle
      setScanMode(null)
      return
    }

    // analyzeLabel handles OCR + keyword detection + on-device AI
    const analysis = await analyzeLabel(uri, profiles)
    if (!analysis) {
      // Error already set in hook — scanMode stays 'ocr' to show error UI
      return
    }

    const { text, mergedResults, aiProvider } = analysis
    setOcrText(text)
    setOcrAnalysis({ results: mergedResults, aiProvider })
    const ocrProduct = {
      product_name: t.ocrProductName,
      product_name_fr: lang === 'fr' ? t.ocrProductName : null,
      ingredients_text: text,
      allergens_tags: [],
    }
    setProduct(ocrProduct)
    addScan(`ocr-${Date.now()}`, ocrProduct, 'ocr')
    setScanned(true)
    setScanMode(null)
  }

  // ── Navigation ───────────────────────────────────────────────────────────────

  function handleOpenRecentScan(scan) {
    setProduct(scan.productData)
    setOcrText(null) // raw text not stored in recent scans
    setScanned(true)
    setError(null)
    setLoading(false)
    setScanMode(null)
  }

  function handleScanAgain() {
    scanLock.current = false
    setScanned(false)
    setProduct(null)
    setError(null)
    setOcrText(null)
    setOcrAnalysis(null)
    clearOcrError()
    setScanMode('barcode')
  }

  function handleGoHome() {
    scanLock.current = false
    setScanned(false)
    setProduct(null)
    setError(null)
    setOcrText(null)
    setOcrAnalysis(null)
    clearOcrError()
    setScanMode(null)
  }

  function handleStartBarcodeScan() {
    setScanMode('barcode')
  }

  function handleCancelBarcode() {
    setScanMode(null)
  }

  // ── Permission gate ───────────────────────────────────────────────────────────

  if (permission === null) return null

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.permissionContainer}>
          <Ionicons name="camera-outline" size={64} color={COLORS.muted} />
          <Text style={styles.permissionTitle}>{t.permissionTitle}</Text>
          <Text style={styles.permissionMessage}>{t.permissionMessage}</Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={requestPermission}>
            <Text style={styles.primaryBtnText}>{t.permissionBtn}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  // ── Barcode camera ────────────────────────────────────────────────────────────

  if (scanMode === 'barcode') {
    return (
      <View style={styles.fullCamera}>
        <CameraView
          style={StyleSheet.absoluteFill}
          barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'] }}
          onBarcodeScanned={handleBarcodeScanned}
        />
        <SafeAreaView style={styles.cameraOverlay} edges={['top', 'bottom']}>
          <View style={styles.scanFrameContainer}>
            <View style={styles.scanFrame} />
          </View>
          <TouchableOpacity style={styles.cancelBtn} onPress={handleCancelBarcode}>
            <Text style={styles.cancelBtnText}>{t.cancel}</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    )
  }

  // ── OCR processing / error ────────────────────────────────────────────────────

  if (scanMode === 'ocr') {
    const ocrErrKey = ocrError ? `ocrError_${ocrError}` : null
    const ocrErrMsg = ocrErrKey && t[ocrErrKey] ? t[ocrErrKey] : (ocrError ? t.ocrError_ocr_failed : null)

    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.loadingContainer}>
          {isProcessing ? (
            <>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingText}>{t.ocrLoading}</Text>
              <TouchableOpacity style={[styles.secondaryBtn, { marginTop: 8 }]} onPress={handleGoHome}>
                <Text style={styles.secondaryBtnText}>{t.cancel}</Text>
              </TouchableOpacity>
            </>
          ) : ocrErrMsg ? (
            <>
              <Ionicons name="alert-circle-outline" size={48} color={COLORS.danger} />
              <Text style={styles.errorText}>{ocrErrMsg}</Text>
              <TouchableOpacity style={styles.primaryBtn} onPress={handleStartOCR}>
                <Ionicons name="refresh-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.primaryBtnText}>{t.retry}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryBtn} onPress={handleGoHome}>
                <Text style={styles.secondaryBtnText}>{t.backHome}</Text>
              </TouchableOpacity>
            </>
          ) : (
            // Camera launched by handleStartOCR; waiting for user action
            <ActivityIndicator size="large" color={COLORS.primary} />
          )}
        </View>
      </SafeAreaView>
    )
  }

  // ── Loading (barcode API) ─────────────────────────────────────────────────────

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>{t.loading}</Text>
        </View>
      </SafeAreaView>
    )
  }

  // ── Result ────────────────────────────────────────────────────────────────────

  if (scanned) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={handleScanAgain}>
              <Ionicons name="camera-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.primaryBtnText}>{t.scanAgain}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ProductResult
            product={product}
            profiles={profiles}
            t={t}
            lang={lang}
            onScanAgain={handleScanAgain}
            onBack={handleGoHome}
            ocrText={ocrText}
            precomputedResults={ocrAnalysis?.results ?? null}
          />
        )}
      </SafeAreaView>
    )
  }

  // ── Idle ──────────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.idleContent}>
        <View style={styles.scanBtnSection}>
          <Ionicons name="barcode-outline" size={72} color={COLORS.muted} />
          <Text style={styles.idleHint}>{t.scanPrompt}</Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={handleStartBarcodeScan}>
            <Ionicons name="camera-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.primaryBtnText}>{t.scanBtn}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} onPress={handleStartOCR}>
            <Ionicons name="image-outline" size={20} color={COLORS.primary} style={{ marginRight: 8 }} />
            <Text style={styles.secondaryBtnText}>{t.ocrBtn}</Text>
          </TouchableOpacity>
        </View>

        {recentScans.length > 0 && (
          <View style={styles.recentSection}>
            <Text style={styles.recentTitle}>{t.recentTitle}</Text>
            <View style={styles.recentList}>
              {recentScans.map((scan, index) => (
                <TouchableOpacity
                  key={scan.id}
                  style={[
                    styles.recentItem,
                    index === recentScans.length - 1 && styles.recentItemLast,
                  ]}
                  onPress={() => handleOpenRecentScan(scan)}
                >
                  <View style={styles.recentItemIcon}>
                    <Ionicons
                      name={scan.source === 'ocr' ? 'image-outline' : 'cube-outline'}
                      size={20}
                      color={COLORS.primary}
                    />
                  </View>
                  <View style={styles.recentItemContent}>
                    <Text style={styles.recentItemName} numberOfLines={1}>
                      {scan.productName || t.unknownProduct}
                    </Text>
                    <View style={styles.recentItemMeta}>
                      <Text style={styles.recentItemDate}>
                        {formatDate(scan.scannedAt, lang)}
                      </Text>
                      {scan.source === 'ocr' && (
                        <View style={styles.sourceTag}>
                          <Text style={styles.sourceTagText}>{t.ocrSourceLabel}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={COLORS.muted} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  fullCamera: {
    flex: 1,
    backgroundColor: '#000',
  },
  cameraOverlay: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 40,
  },
  scanFrameContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  scanFrame: {
    width: 220,
    height: 140,
    borderWidth: 2,
    borderColor: '#ffffff',
    borderRadius: 10,
    opacity: 0.8,
  },
  cancelBtn: {
    height: 48,
    paddingHorizontal: 32,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  idleContent: {
    padding: 24,
    gap: 32,
  },
  scanBtnSection: {
    alignItems: 'center',
    gap: 12,
    paddingTop: 16,
  },
  idleHint: {
    fontSize: 16,
    color: COLORS.muted,
    marginBottom: 4,
  },
  primaryBtn: {
    flexDirection: 'row',
    height: 52,
    paddingHorizontal: 28,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryBtn: {
    flexDirection: 'row',
    height: 52,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  recentSection: {
    gap: 10,
  },
  recentTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  recentList: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 12,
  },
  recentItemLast: {
    borderBottomWidth: 0,
  },
  recentItemIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentItemContent: {
    flex: 1,
    gap: 2,
  },
  recentItemName: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.text,
  },
  recentItemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  recentItemDate: {
    fontSize: 13,
    color: COLORS.muted,
  },
  sourceTag: {
    backgroundColor: '#e0f2fe',
    borderRadius: 4,
    paddingVertical: 1,
    paddingHorizontal: 5,
  },
  sourceTagText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0369a1',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 32,
  },
  loadingText: {
    fontSize: 15,
    color: COLORS.muted,
  },
  resultContainer: {
    flex: 1,
  },
  resultContent: {
    padding: 16,
    gap: 16,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 16,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.danger,
    textAlign: 'center',
  },
  productName: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  banner: {
    borderRadius: 10,
    padding: 14,
    gap: 10,
  },
  bannerSafe: {
    backgroundColor: '#dcfce7',
  },
  bannerDanger: {
    backgroundColor: '#fee2e2',
  },
  bannerSafeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#166534',
  },
  bannerProfile: {
    gap: 6,
  },
  bannerProfileName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  bannerGroup: {
    gap: 2,
    paddingLeft: 8,
  },
  bannerGroupLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#991b1b',
  },
  bannerGroupLabelWarning: {
    color: '#92400e',
  },
  bannerGroupItems: {
    fontSize: 13,
    color: COLORS.text,
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
  ocrTextHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ocrTextToggle: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
  },
  ocrRawText: {
    fontSize: 13,
    color: COLORS.text,
    lineHeight: 19,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    padding: 10,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
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
})
