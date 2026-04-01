import { useState } from 'react'
import * as ImagePicker from 'expo-image-picker'
import TextRecognition from '@react-native-ml-kit/text-recognition'

export function useOCR() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState(null)

  // Launch camera and capture a photo, returning the image URI or null if cancelled/denied.
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

  // Run ML Kit OCR on the given image URI.
  // Returns the extracted text string, or null on failure.
  async function extractTextFromImage(uri) {
    if (!uri) return null
    setIsProcessing(true)
    setError(null)

    try {
      const result = await TextRecognition.recognize(uri)
      const text = result?.text?.trim() ?? ''
      if (!text) {
        setError('empty_text')
        return null
      }
      return text
    } catch {
      setError('ocr_failed')
      return null
    } finally {
      setIsProcessing(false)
    }
  }

  function clearError() {
    setError(null)
  }

  return { isProcessing, error, pickImageFromCamera, extractTextFromImage, clearError }
}
