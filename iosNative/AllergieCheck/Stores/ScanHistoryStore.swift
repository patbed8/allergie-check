// ScanHistoryStore.swift — Recent scans persistence (max 10)

import Foundation
import Observation

@Observable
class ScanHistoryStore {
    var recentScans: [ScanResult] = []

    private let storageKey = "allergie-check-recent-scans"
    private let maxScans = 10

    init() {
        load()
    }

    private func load() {
        guard let data = UserDefaults.standard.data(forKey: storageKey),
              let decoded = try? JSONDecoder().decode([ScanResult].self, from: data) else { return }
        recentScans = decoded
    }

    private func save() {
        if let data = try? JSONEncoder().encode(recentScans) {
            UserDefaults.standard.set(data, forKey: storageKey)
        }
    }

    func addScan(barcode: String, product: OFFProduct, source: ScanResult.ScanSource) {
        // Remove existing entry for same barcode (barcode scans only)
        if source == .barcode {
            recentScans.removeAll { $0.barcode == barcode }
        }

        let scan = ScanResult(
            id: UUID().uuidString,
            barcode: barcode,
            productName: product.displayName,
            source: source,
            scannedAt: Date(),
            productData: product
        )

        recentScans.insert(scan, at: 0)
        if recentScans.count > maxScans {
            recentScans = Array(recentScans.prefix(maxScans))
        }
        save()
    }
}
