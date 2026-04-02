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
}

// MARK: - Array helper

extension Array where Element: Hashable {
    func removingDuplicates() -> [Element] {
        var seen = Set<Element>()
        return filter { seen.insert($0).inserted }
    }
}
