// On-device AI utilities: Apple Intelligence (iOS 26+) and Gemini Nano (Android).
//
// Both providers are loaded dynamically so the app works on devices that don't
// support them — getOnDeviceAIProvider() returns 'none' and the caller falls back
// to keyword detection silently.

/**
 * Returns the available on-device AI provider for the current device.
 * @returns {Promise<'apple' | 'gemini' | 'none'>}
 */
export async function getOnDeviceAIProvider() {
  // iOS: Apple Intelligence Foundation Models (iOS 26+, iPhone 15 Pro / 16 series)
  try {
    const { isFoundationModelsEnabled } = require('react-native-apple-llm')
    const status = await isFoundationModelsEnabled()
    if (status === 'available') return 'apple'
  } catch (_) {}

  // Android: Gemini Nano via AICore (Pixel 6+, Samsung S22+, Android 10+)
  // NOTE: install the package when available — npm i rn-on-device-ai
  try {
    const { OnDeviceAI } = require('rn-on-device-ai')
    const available = await OnDeviceAI.isAvailable()
    if (available) return 'gemini'
  } catch (_) {}

  return 'none'
}

/**
 * Analyze an ingredient text with Apple Intelligence.
 * Returns an array of detected allergen name strings.
 * @param {string} ingredientsText
 * @param {Array<{allergies: string[], intolerances: string[]}>} profiles
 * @returns {Promise<string[]>}
 */
export async function analyzeWithAppleIntelligence(ingredientsText, profiles) {
  const { AppleLLMSession } = require('react-native-apple-llm')

  const allergenList = profiles
    .flatMap(p => [...(p.allergies || []), ...(p.intolerances || [])])
    .filter((v, i, a) => a.indexOf(v) === i) // deduplicate
    .join(', ')

  const session = new AppleLLMSession()
  await session.configure({
    instructions:
      'You are a food allergen detection assistant. ' +
      'You receive an ingredient list and a list of allergens to look for. ' +
      'Reply only with a JSON array of detected allergen names from the provided list. ' +
      'If nothing is detected, reply with an empty array []. No explanation, no markdown.',
  })

  const response = await session.generateText({
    prompt: `Allergens to look for: ${allergenList}\n\nIngredient list:\n${ingredientsText}`,
  })

  session.dispose()

  try {
    const parsed = JSON.parse(response)
    return Array.isArray(parsed) ? parsed.map(String) : []
  } catch {
    return []
  }
}

/**
 * Analyze an ingredient text with Gemini Nano (Android).
 * Returns an array of detected allergen name strings.
 * @param {string} ingredientsText
 * @param {Array<{allergies: string[], intolerances: string[]}>} profiles
 * @returns {Promise<string[]>}
 */
export async function analyzeWithGeminiNano(ingredientsText, profiles) {
  const { OnDeviceAI } = require('rn-on-device-ai')

  const allergenList = profiles
    .flatMap(p => [...(p.allergies || []), ...(p.intolerances || [])])
    .filter((v, i, a) => a.indexOf(v) === i)
    .join(', ')

  const result = await OnDeviceAI.generateText({
    prompt:
      `Allergens to look for: ${allergenList}\n\n` +
      `Ingredient list:\n${ingredientsText}\n\n` +
      'Reply only with a JSON array of detected allergen names from the list above. ' +
      'If nothing detected, reply [].',
  })

  try {
    const parsed = JSON.parse(result)
    return Array.isArray(parsed) ? parsed.map(String) : []
  } catch {
    return []
  }
}

/**
 * Merges keyword-detection results with AI-detected allergens.
 * AI findings that are already covered by keyword detection are skipped.
 * New AI-only findings are added as { aiOnlyAllergies, aiOnlyIntolerances }.
 *
 * @param {Array<{profileName, detectedAllergies, detectedIntolerances}>} keywordResults
 * @param {string[]} aiDetected - flat list of allergen names returned by the AI
 * @param {Array<{name, allergies, intolerances}>} profiles
 * @returns {Array<{profileName, detectedAllergies, detectedIntolerances, aiOnlyAllergies, aiOnlyIntolerances}>}
 */
export function mergeWithAIFindings(keywordResults, aiDetected, profiles) {
  // Seed map with keyword results (add empty AI arrays)
  const resultMap = {}
  for (const r of keywordResults) {
    resultMap[r.profileName] = { ...r, aiOnlyAllergies: [], aiOnlyIntolerances: [] }
  }

  const lowerAiDetected = aiDetected.map(a => a.toLowerCase().trim()).filter(Boolean)

  for (const profile of profiles) {
    for (const aiAllergen of lowerAiDetected) {
      const inAllergies = (profile.allergies || []).some(a => {
        const la = a.toLowerCase()
        return aiAllergen.includes(la) || la.includes(aiAllergen)
      })
      const inIntolerances = (profile.intolerances || []).some(i => {
        const li = i.toLowerCase()
        return aiAllergen.includes(li) || li.includes(aiAllergen)
      })

      if (!inAllergies && !inIntolerances) continue

      // Create entry if profile had no keyword hits
      if (!resultMap[profile.name]) {
        resultMap[profile.name] = {
          profileName: profile.name,
          detectedAllergies: [],
          detectedIntolerances: [],
          aiOnlyAllergies: [],
          aiOnlyIntolerances: [],
        }
      }

      const entry = resultMap[profile.name]

      // Skip if already caught by keyword detection
      const alreadyCaught = [...entry.detectedAllergies, ...entry.detectedIntolerances].some(kw => {
        const lkw = kw.toLowerCase()
        return lkw.includes(aiAllergen) || aiAllergen.includes(lkw)
      })
      if (alreadyCaught) continue

      if (inAllergies && !entry.aiOnlyAllergies.includes(aiAllergen)) {
        entry.aiOnlyAllergies.push(aiAllergen)
      } else if (inIntolerances && !entry.aiOnlyIntolerances.includes(aiAllergen)) {
        entry.aiOnlyIntolerances.push(aiAllergen)
      }
    }
  }

  return Object.values(resultMap).filter(
    r =>
      r.detectedAllergies.length > 0 ||
      r.detectedIntolerances.length > 0 ||
      r.aiOnlyAllergies.length > 0 ||
      r.aiOnlyIntolerances.length > 0
  )
}
