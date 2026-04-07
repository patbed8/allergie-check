// AllergenDetection.swift — Keyword-based allergen detection (FR + EN)

import Foundation

// MARK: - Allergen synonym groups

/// Each group contains all keywords (FR + EN) associated with one allergen family.
let allergenGroups: [[String]] = [
    ["arachide", "arachides", "peanut", "peanuts", "cacahuète", "cacahuètes", "cacahuete", "cacahuetes", "groundnut", "groundnuts"],
    ["gluten", "blé", "ble", "wheat", "seigle", "rye", "orge", "barley", "avoine", "oat", "oats", "épeautre", "epeautre", "spelt", "kamut", "triticale"],
    ["lait", "milk", "lactosérum", "lactoserum", "whey", "caséine", "caseine", "casein", "lactose", "beurre", "butter", "crème", "creme", "cream", "fromage", "cheese", "yogourt", "yogurt", "yaourt", "lactalbumine", "lactalbumin", "lactoglobuline"],
    ["oeuf", "oeufs", "œuf", "œufs", "egg", "eggs", "albumine", "albumin", "lysozyme", "mayonnaise"],
    ["noix", "nut", "nuts", "noisette", "noisettes", "hazelnut", "hazelnuts", "amande", "amandes", "almond", "almonds", "cajou", "cashew", "pistache", "pistaches", "pistachio", "pistachios", "macadamia", "pécan", "pecan", "pacane", "noix du brésil", "noix du bresil", "brazil nut", "châtaigne", "chataigne", "chestnut", "noix de pin", "pine nut"],
    ["soja", "soya", "soy", "soybeans", "tofu", "edamame", "tempeh", "miso", "okara", "lécithine de soja", "lecithine de soja", "soy lecithin"],
    ["poisson", "fish", "saumon", "salmon", "thon", "tuna", "morue", "cod", "tilapia", "anchois", "anchovy", "sardine", "sardines", "pangasius", "truite", "trout", "flétan", "fletan", "halibut", "sole", "merlu", "hake", "aiglefin", "haddock", "maquereau", "mackerel", "doré", "dore", "walleye"],
    ["crustacé", "crustacés", "crustace", "crustaces", "crustacean", "crustaceans", "crevette", "crevettes", "shrimp", "prawn", "prawns", "homard", "lobster", "crabe", "crab", "langoustine", "langoustines", "écrevisse", "ecrevisse", "crayfish"],
    ["mollusque", "mollusques", "mollusk", "mollusks", "moule", "moules", "mussel", "mussels", "huître", "huîtres", "huitre", "huitres", "oyster", "oysters", "pétoncle", "pétoncles", "petoncle", "petoncles", "scallop", "scallops", "palourde", "palourdes", "clam", "clams", "calmar", "squid", "pieuvre", "octopus"],
    ["fruits de mer", "seafood", "shellfish"],
    ["sésame", "sesame", "tahini", "tahine"],
    ["sulfite", "sulfites", "sulphite", "sulphites", "so2", "dioxyde de soufre", "sulphur dioxide", "sulfur dioxide", "métabisulfite", "metabisulfite"],
    ["moutarde", "mustard"],
    ["céleri", "celeri", "celeriac", "celery", "céleri-rave", "celeri-rave"],
    ["lupin", "lupine", "lupin flour", "farine de lupin"],
]

// MARK: - Accent normalization

/// Strip accents to normalize French text (e.g. "épeautre" → "epeautre")
func stripAccents(_ str: String) -> String {
    str.folding(options: .diacriticInsensitive, locale: .current)
}

// MARK: - Keyword lookup

/// Returns the full synonym group for a given allergen name, or [allergen] if not found.
func getKeywords(for allergen: String) -> [String] {
    let lower = stripAccents(allergen.lowercased())
    for group in allergenGroups {
        let match = group.contains { kw in
            let stripped = stripAccents(kw)
            return stripped == lower || lower.contains(stripped) || stripped.contains(lower)
        }
        if match { return group }
    }
    return [allergen.lowercased()]
}

/// Returns all known synonyms (FR + EN) for a given allergen name.
func getAllergenSynonyms(for allergen: String) -> [String] {
    getKeywords(for: allergen)
}

// MARK: - Free-of claim removal

/// Remove entire ingredient segments that contain "sans X", "X-free", or "free of X".
/// Splits by comma and drops any segment that matches a free-of pattern.
/// This prevents e.g. "avoine sans gluten" from leaving "avoine" which would trigger gluten.
func removeFreeOfClaims(_ text: String) -> String {
    let segments = text.components(separatedBy: ",")
    let filtered = segments.filter { segment in
        let s = segment.trimmingCharacters(in: .whitespaces).lowercased()
        // French: "sans gluten", "sans noix", etc.
        if s.range(of: #"\bsans\s+\w+"#, options: .regularExpression) != nil { return false }
        // English: "gluten-free", "nut free", "dairy-free"
        if s.range(of: #"\w+[-\s]free\b"#, options: .regularExpression) != nil { return false }
        // English: "free of gluten"
        if s.range(of: #"\bfree\s+of\s+\w+"#, options: .regularExpression) != nil { return false }
        return true
    }
    return filtered.joined(separator: ",")
}

// MARK: - Word-boundary keyword matching

/// Check if keyword appears as a whole word (not as substring of another word).
/// Multi-word keywords (e.g. "noix du brésil") use simple contains since they're specific enough.
func keywordInText(_ kw: String, text: String) -> Bool {
    if kw.contains(" ") {
        return text.contains(kw) || text.contains(stripAccents(kw))
    }
    let escaped = NSRegularExpression.escapedPattern(for: kw)
    let pattern = #"(?:^|[\s,;:()])"# + escaped + #"(?:s|es)?(?=[\s,;:().]|$)"#
    if let regex = try? NSRegularExpression(pattern: pattern, options: .caseInsensitive) {
        let range = NSRange(text.startIndex..., in: text)
        if regex.firstMatch(in: text, range: range) != nil { return true }
        let stripped = stripAccents(text)
        let strippedRange = NSRange(stripped.startIndex..., in: stripped)
        if regex.firstMatch(in: stripped, range: strippedRange) != nil { return true }
    }
    return false
}

// MARK: - Compound phrase neutralization

/// Regex patterns for multi-word food terms that contain allergen keywords but are NOT allergens.
/// Regex allows tolerance for OCR typos (e.g. "POMMES DE IERRE" instead of "POMMES DE TERRE").
private let safeCompoundPatterns: [(pattern: String, token: String)] = [
    // "pommes de terre" and OCR variants like "pommes de ierre" (potatoes, not apples)
    (#"\bpommes?\s+de\s+\S*erres?\b"#, "_POTATO_"),
    (#"\bpotatoe?s?\b"#, "_POTATO_"),
    // "beurre de cacao" (cocoa butter, not dairy butter)
    (#"\bbeurre\s+de\s+cacao\b"#, "_COCOA_BUTTER_"),
    (#"\bcocoa\s+butter\b"#, "_COCOA_BUTTER_"),
    // "beurre de karité" (shea butter, not dairy butter)
    (#"\bbeurre\s+de\s+karit\w*\b"#, "_SHEA_BUTTER_"),
    (#"\bshea\s+butter\b"#, "_SHEA_BUTTER_"),
    // "crème de cacao" (not dairy cream)
    (#"\bcr[eè]me\s+de\s+cacao\b"#, "_COCOA_CREAM_"),
    // "lait de coco" (coconut milk, not dairy milk)
    (#"\blait\s+de\s+coco\b"#, "_COCONUT_MILK_"),
    (#"\bcoconut\s+milk\b"#, "_COCONUT_MILK_"),
    // "crème de coco" (coconut cream, not dairy cream)
    (#"\bcr[eè]me\s+de\s+coco\b"#, "_COCONUT_CREAM_"),
    (#"\bcoconut\s+cream\b"#, "_COCONUT_CREAM_"),
]

/// Replace known safe compound phrases with neutral tokens to prevent false positives.
/// Uses regex for tolerance against OCR typos in Open Food Facts data.
func neutralizeCompounds(_ text: String) -> String {
    var result = text
    for (pattern, token) in safeCompoundPatterns {
        if let regex = try? NSRegularExpression(pattern: pattern, options: .caseInsensitive) {
            result = regex.stringByReplacingMatches(
                in: result, range: NSRange(result.startIndex..., in: result), withTemplate: token)
        }
    }
    return result
}

// MARK: - Detection

/// Detect which allergens from the list appear in the text or tags.
func detectAllergens(_ list: [String], text: String, tags: [String]) -> [String] {
    list.filter { allergen in
        let keywords = getKeywords(for: allergen)
        let inIngredients = keywords.contains { kw in keywordInText(kw, text: text) }
        let inTags = tags.contains { tag in
            keywords.contains { kw in tag.contains(kw) || kw.contains(tag) }
        }
        return inIngredients || inTags
    }
}

/// Run detection across all profiles. Returns only profiles with at least one detection.
func detectAllProfiles(_ profiles: [Profile], ingredientsText: String?, allergenTags: [String]?) -> [DetectionResult] {
    let text = neutralizeCompounds(removeFreeOfClaims((ingredientsText ?? "").lowercased()))
    let tags = (allergenTags ?? []).map { $0.replacingOccurrences(of: #"^[a-z]{2}:"#, with: "", options: .regularExpression).lowercased() }

    return profiles.compactMap { profile in
        let allergies = detectAllergens(profile.allergies, text: text, tags: tags)
        let intolerances = detectAllergens(profile.intolerances, text: text, tags: tags)
        guard !allergies.isEmpty || !intolerances.isEmpty else { return nil }
        return DetectionResult(
            profileName: profile.name,
            detectedAllergies: allergies,
            detectedIntolerances: intolerances
        )
    }
}

// MARK: - AI merge

/// Merges keyword-detection results with AI-detected allergens.
/// AI findings already caught by keywords are skipped. New findings are added as aiOnly.
func mergeWithAIFindings(
    keywordResults: [DetectionResult],
    aiDetected: [String],
    profiles: [Profile]
) -> [DetectionResult] {
    var resultMap: [String: DetectionResult] = [:]
    for r in keywordResults {
        resultMap[r.profileName] = r
    }

    let lowerAI = aiDetected.map { $0.lowercased().trimmingCharacters(in: .whitespaces) }.filter { !$0.isEmpty }

    for profile in profiles {
        for aiAllergen in lowerAI {
            let inAllergies = profile.allergies.contains { a in
                let la = a.lowercased()
                return aiAllergen.contains(la) || la.contains(aiAllergen)
            }
            let inIntolerances = profile.intolerances.contains { i in
                let li = i.lowercased()
                return aiAllergen.contains(li) || li.contains(aiAllergen)
            }

            guard inAllergies || inIntolerances else { continue }

            if resultMap[profile.name] == nil {
                resultMap[profile.name] = DetectionResult(
                    profileName: profile.name,
                    detectedAllergies: [],
                    detectedIntolerances: []
                )
            }

            var entry = resultMap[profile.name]!
            let alreadyCaught = (entry.detectedAllergies + entry.detectedIntolerances).contains { kw in
                let lkw = kw.lowercased()
                return lkw.contains(aiAllergen) || aiAllergen.contains(lkw)
            }
            if alreadyCaught { continue }

            if inAllergies && !entry.aiOnlyAllergies.contains(aiAllergen) {
                entry.aiOnlyAllergies.append(aiAllergen)
            } else if inIntolerances && !entry.aiOnlyIntolerances.contains(aiAllergen) {
                entry.aiOnlyIntolerances.append(aiAllergen)
            }
            resultMap[profile.name] = entry
        }
    }

    return Array(resultMap.values).filter { $0.hasDetections }
}
