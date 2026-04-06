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
        profiles: [Profile]
    ) async -> [String] {
        #if canImport(FoundationModels)
        if #available(iOS 26, *) {
            do {
                let allergenList = profiles
                    .flatMap { $0.allergies + $0.intolerances }
                    .removingDuplicates()
                    .joined(separator: ", ")

                let instructions = Instructions {
                    "You are a food allergen detection assistant. "
                    "You receive an ingredient list and a list of allergens to look for. "
                    "IMPORTANT: Understand the context of each ingredient. For example, "
                    "'pommes de terre' (potatoes) does NOT contain 'pommes' (apples), "
                    "'beurre de cacao' (cocoa butter) is NOT dairy 'beurre' (butter), "
                    "'lait de coco' (coconut milk) is NOT dairy 'lait' (milk). "
                    "Only flag an allergen if the ingredient genuinely contains or derives from that allergen. "
                    "Reply only with a JSON array of detected allergen names from the provided list. "
                    "If nothing is detected, reply with an empty array []. No explanation, no markdown."
                }

                let session = LanguageModelSession(instructions: instructions)
                let prompt = "Allergens to look for: \(allergenList)\n\nIngredient list:\n\(ingredientsText)"

                let response = try await session.respond(to: prompt)
                let text = response.content

                // Parse JSON array from response
                if let data = text.data(using: .utf8),
                   let parsed = try? JSONSerialization.jsonObject(with: data) as? [String] {
                    return parsed
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
