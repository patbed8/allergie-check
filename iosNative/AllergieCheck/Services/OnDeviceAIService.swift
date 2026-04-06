// OnDeviceAIService.swift — Apple Intelligence (FoundationModels, iOS 26+)

import Foundation

#if canImport(FoundationModels)
import FoundationModels
#endif

enum AIProvider: String {
    case apple, none
}

struct OnDeviceAIService {

    /// Check if an on-device AI provider is available.
    static func getProvider() async -> AIProvider {
        #if canImport(FoundationModels)
        if #available(iOS 26, *) {
            let model = SystemLanguageModel.default
            if model.availability == .available {
                return .apple
            }
        }
        #endif
        return .none
    }

    /// Analyze ingredient text with Apple Intelligence to find allergens.
    /// Returns an array of detected allergen names.
    static func analyzeWithAppleIntelligence(
        ingredientsText: String,
        profiles: [Profile],
        barcode: String? = nil
    ) async -> [String] {
        #if canImport(FoundationModels)
        if #available(iOS 26, *) {
            do {
                let allergenList = profiles
                    .flatMap { $0.allergies + $0.intolerances }
                    .removingDuplicates()
                    .joined(separator: ", ")

                let instructions = Instructions {
                    "You are a food allergen detection expert. Your job is to analyze ingredient "
                    "lists and determine which allergens from a provided list are genuinely present."
                    ""
                    "CRITICAL RULES:"
                    "1. Read each ingredient phrase as a COMPLETE unit between commas."
                    "2. A phrase containing 'sans [allergen]', '[allergen]-free', 'free of [allergen]' "
                    "means that allergen is ABSENT — never flag it."
                    "3. Only flag an allergen when the full ingredient phrase confirms its genuine presence."
                    ""
                    "Examples of what NOT to flag:"
                    "- 'avoine sans gluten' → NOT gluten (oats that have had gluten removed)"
                    "- 'gluten-free oats' → NOT gluten"
                    "- 'lait de coco' → NOT dairy (coconut milk, unrelated to cow's milk)"
                    "- 'beurre de cacao' → NOT dairy (cocoa butter, a plant fat)"
                    "- 'crème de coco' → NOT dairy"
                    "- 'farine sans gluten' → NOT gluten"
                    "- 'sans lactose' → NOT lactose"
                    ""
                    "Examples of what TO flag:"
                    "- 'farine de blé' → gluten"
                    "- 'lait écrémé' → dairy"
                    "- 'beurre' alone → dairy"
                    "- 'œufs' → eggs"
                    "- 'arachides' → peanuts"
                    "- 'lactosérum' → dairy"
                    ""
                    "Reply ONLY with a valid JSON array of allergen names from the provided list "
                    "that are genuinely present. Use empty array [] if none detected. "
                    "No explanation, no markdown, no preamble."
                }

                let session = LanguageModelSession(instructions: instructions)
                let prompt = "Allergens to detect: \(allergenList)\n\nIngredient list (analyze each comma-separated phrase as a complete semantic unit):\n\(ingredientsText)"

                let response = try await session.respond(to: prompt)
                let text = response.content
                print("🤖 AI response [\(barcode ?? "ocr")]: \(text)")

                // Strip markdown code fences if present (e.g. ```json ... ```)
                var jsonText = text.trimmingCharacters(in: .whitespacesAndNewlines)
                if jsonText.hasPrefix("```") {
                    // Remove opening fence (```json or ```)
                    if let firstNewline = jsonText.firstIndex(of: "\n") {
                        jsonText = String(jsonText[jsonText.index(after: firstNewline)...])
                    }
                    // Remove closing fence
                    if let lastFence = jsonText.range(of: "```", options: .backwards) {
                        jsonText = String(jsonText[..<lastFence.lowerBound])
                    }
                    jsonText = jsonText.trimmingCharacters(in: .whitespacesAndNewlines)
                }

                // Parse JSON array from response
                if let data = jsonText.data(using: .utf8),
                   let parsed = try? JSONSerialization.jsonObject(with: data) as? [String] {
                    // Filter out hallucinations: corroborate against cleaned ingredient text
                    // Apply the same "free of" removal and compound neutralization as keyword detection
                    let cleaned = neutralizeCompounds(removeFreeOfClaims(ingredientsText.lowercased()))
                    return parsed.filter { allergen in
                        let keywords = getKeywords(for: allergen)
                        if cleaned.contains(allergen.lowercased()) { return true }
                        return keywords.contains { kw in
                            cleaned.contains(kw.lowercased())
                        }
                    }
                }
                return []
            } catch {
                return []
            }
        }
        #endif
        return []
    }

    /// Use Apple Intelligence to extract only the ingredients list from OCR text.
    /// Returns the filtered ingredients text, or nil if extraction fails.
    static func extractIngredientsFromOCR(fullText: String) async -> String? {
        #if canImport(FoundationModels)
        if #available(iOS 26, *) {
            do {
                let instructions = Instructions {
                    "You extract ONLY the ingredients list from food label text. "
                    "The ingredients list typically starts after 'Ingrédients:', 'Ingredients:', or 'INGRÉDIENTS:' "
                    "and is a comma-separated list of food components, possibly with parentheses for sub-ingredients. "
                    "Return ONLY the comma-separated ingredients without any prefix like 'Ingrédients:'. "
                    "Do NOT include: product name, brand, weight, net quantity, nutritional facts, "
                    "barcodes, certifications, storage instructions, recycling info, dates, addresses. "
                    "If you cannot identify a clear ingredients list, return ONLY the text unchanged."
                }

                let session = LanguageModelSession(instructions: instructions)
                let response = try await session.respond(to: fullText)
                let result = response.content.trimmingCharacters(in: .whitespacesAndNewlines)
                return result.isEmpty ? nil : result
            } catch {
                return nil
            }
        }
        #endif
        return nil
    }

    /// Keyword-based fallback: extract ingredients section from OCR text using common markers.
    /// Used when Apple Intelligence is not available.
    static func extractIngredientsKeyword(fullText: String) -> String? {
        let text = fullText
        let lower = text.lowercased()

        // Find the start of ingredients section
        let startMarkers = ["ingrédients :", "ingrédients:", "ingredients:", "ingredients :",
                            "ingrédients/ingredients:", "ingrédients /ingredients:"]
        var startIndex: String.Index? = nil
        for marker in startMarkers {
            if let range = lower.range(of: marker) {
                startIndex = range.upperBound
                break
            }
        }
        guard let start = startIndex else { return nil }

        // Find the end of ingredients section (next section marker)
        let endMarkers = ["valeur nutritive", "nutrition facts", "contient :", "contient:",
                          "contains:", "contains :", "peut contenir", "may contain",
                          "allergènes", "allergens", "mise en garde", "warning",
                          "conservation", "storage", "best before", "meilleur avant"]
        let remaining = String(text[start...]).trimmingCharacters(in: .whitespacesAndNewlines)
        let remainingLower = remaining.lowercased()

        var endOffset = remaining.endIndex
        for marker in endMarkers {
            if let range = remainingLower.range(of: marker) {
                if range.lowerBound < endOffset {
                    endOffset = range.lowerBound
                }
            }
        }

        let extracted = String(remaining[remaining.startIndex..<endOffset])
            .trimmingCharacters(in: .whitespacesAndNewlines)
            .trimmingCharacters(in: CharacterSet(charactersIn: ".,;"))
            .trimmingCharacters(in: .whitespacesAndNewlines)

        return extracted.isEmpty ? nil : extracted
    }
}

// MARK: - Array helper

extension Array where Element: Hashable {
    func removingDuplicates() -> [Element] {
        var seen = Set<Element>()
        return filter { seen.insert($0).inserted }
    }
}
