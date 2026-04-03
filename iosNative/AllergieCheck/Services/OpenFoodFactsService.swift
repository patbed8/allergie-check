// OpenFoodFactsService.swift — Open Food Facts API client

import Foundation

enum OpenFoodFactsError: Error {
    case notFound
    case networkError(Error)
    case timeout
}

struct OpenFoodFactsService {
    private static let baseURL = "https://world.openfoodfacts.org/api/v0/product"
    private static let timeoutInterval: TimeInterval = 10

    /// Fetch a product by barcode. Normalizes 12-digit UPC-A to 13-digit EAN-13.
    static func fetchProduct(barcode: String) async throws -> OFFProduct {
        let normalized = barcode.count == 12 ? "0" + barcode : barcode
        guard let url = URL(string: "\(baseURL)/\(normalized).json") else {
            throw OpenFoodFactsError.networkError(URLError(.badURL))
        }

        var request = URLRequest(url: url)
        request.timeoutInterval = timeoutInterval

        let (data, _) = try await URLSession.shared.data(for: request)
        let response = try JSONDecoder().decode(OFFResponse.self, from: data)

        guard response.status != 0, let product = response.product else {
            throw OpenFoodFactsError.notFound
        }

        return product
    }
}
