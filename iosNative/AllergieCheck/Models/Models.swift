// Models.swift — Data models for Allergie Check

import Foundation

// MARK: - Profile

struct Profile: Identifiable, Codable, Equatable {
    var id: String
    var name: String
    var allergies: [String]
    var intolerances: [String]

    static func makeId() -> String {
        UUID().uuidString
    }

    var itemCount: Int {
        allergies.count + intolerances.count
    }
}

// MARK: - Open Food Facts API

struct OFFResponse: Codable {
    let status: Int
    let product: OFFProduct?
}

struct OFFProduct: Codable, Equatable {
    let productName: String?
    let productNameFr: String?
    let ingredientsText: String?
    let allergensTags: [String]?

    enum CodingKeys: String, CodingKey {
        case productName = "product_name"
        case productNameFr = "product_name_fr"
        case ingredientsText = "ingredients_text"
        case allergensTags = "allergens_tags"
    }

    var displayName: String {
        productNameFr ?? productName ?? ""
    }
}

// MARK: - Scan Result (recent scans)

struct ScanResult: Identifiable, Codable {
    let id: String
    let barcode: String
    let productName: String
    let source: ScanSource
    let scannedAt: Date
    let productData: OFFProduct?

    enum ScanSource: String, Codable {
        case barcode, ocr
    }
}

// MARK: - Detection Result

struct DetectionResult: Identifiable, Equatable {
    var id: String { profileName }
    let profileName: String
    let detectedAllergies: [String]
    let detectedIntolerances: [String]
    var aiOnlyAllergies: [String] = []
    var aiOnlyIntolerances: [String] = []

    var hasDetections: Bool {
        !detectedAllergies.isEmpty || !detectedIntolerances.isEmpty ||
        !aiOnlyAllergies.isEmpty || !aiOnlyIntolerances.isEmpty
    }
}
