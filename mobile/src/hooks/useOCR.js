import { useState } from 'react'
import * as ImagePicker from 'expo-image-picker'
import TextRecognition from '@react-native-ml-kit/text-recognition'
import { detectAllProfiles } from '../utils/allergenDetection'
import {
  getOnDeviceAIProvider,
  analyzeWithAppleIntelligence,
  mergeWithAIFindings,
} from '../utils/onDeviceAI'

export function useOCR() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState(null)

  // Launch camera and return the image URI, or null if cancelled / permission denied.
  async function pickImageFromCamera() {
    setError(null)

    const { status } = await ImagePicker.requestCameraPermissionsAsync()
    if (status !== 'granted') {
      setError('permission_denied')
      return null
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: 'images',
      quality: 0.9,
      allowsEditing: false,
    })

    if (result.canceled) return null
    return result.assets[0].uri
  }

  // Extract text from an image using ML Kit OCR.
  // Returns the plain text string, or null on failure (sets error state).
  async function extractTextFromImage(uri) {
    if (!uri) return null

    try {
      const result = await TextRecognition.recognize(uri)
      // Join blocks to preserve paragraph structure
      const text = (result.blocks || []).map(b => b.text).join(' ').trim()
      if (!text) {
        setError('empty_text')
        return null
      }
      return text
    } catch {
      setError('ocr_failed')
      return null
    }
  }

  /**
   * Full OCR + AI analysis pipeline.
   *
   * 1. Extract text via ML Kit (always runs).
   * 2. Run keyword detection via detectAllProfiles() (always runs).
   * 3. If an on-device AI provider is available, run semantic analysis and merge
   *    findings not caught by keywords.
   *
   * @param {string} uri - Image URI from pickImageFromCamera()
   * @param {Array<{name, allergies, intolerances}>} profiles - All user profiles
   * @returns {Promise<{text: string, mergedResults: Array, aiProvider: string} | null>}
   *   Returns null if OCR fails (error state is set). aiProvider is 'apple' | 'gemini' | 'none'.
   */
  async function analyzeLabel(uri, profiles) {
    setIsProcessing(true)
    setError(null)

    try {
      // Step 1: OCR
      const text = await extractTextFromImage(uri)
      if (!text) return null // error already set by extractTextFromImage

      // Profiles that have at least one allergen configured
      const activeProfiles = (profiles || []).filter(
        p => (p.allergies || []).length > 0 || (p.intolerances || []).length > 0
      )

      // Step 2: Keyword detection
      const keywordResults = activeProfiles.length > 0
        ? detectAllProfiles(activeProfiles, text, [])
        : []

      // Seed merged results with empty AI arrays for UI consistency
      let mergedResults = keywordResults.map(r => ({
        ...r,
        aiOnlyAllergies: [],
        aiOnlyIntolerances: [],
      }))

      // Step 3: On-device AI (additive — never replaces keyword results)
      let aiProvider = 'none'
      if (activeProfiles.length > 0) {
        try {
          aiProvider = await getOnDeviceAIProvider()
          if (aiProvider !== 'none') {
            let aiDetected = []
            if (aiProvider === 'apple') {
              aiDetected = await analyzeWithAppleIntelligence(text, activeProfiles)
            }
            if (aiDetected.length > 0) {
              mergedResults = mergeWithAIFindings(keywordResults, aiDetected, activeProfiles)
            }
          }
        } catch (err) {
          // AI failure is silent — keyword results are still shown
          console.warn('On-device AI analysis failed, using keyword results only', err)
          aiProvider = 'none'
        }
      }

      return { text, mergedResults, aiProvider }
    } finally {
      setIsProcessing(false)
    }
  }

  function clearError() {
    setError(null)
  }

  return { isProcessing, error, pickImageFromCamera, analyzeLabel, clearError }
}
