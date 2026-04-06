// ScannerView.swift — Main scanner tab: idle, barcode, OCR, results

import SwiftUI
import PhotosUI
import AVFoundation

struct ScannerView: View {
    let profileStore: ProfileStore
    let lang: AppLanguage

    @State private var scanMode: ScanMode? = nil
    @State private var product: OFFProduct? = nil
    @State private var ocrText: String? = nil
    @State private var detectionResults: [DetectionResult]? = nil
    @State private var aiProvider: AIProvider = .none
    @State private var error: String? = nil
    @State private var isLoading = false
    @State private var showImagePicker = false
    @State private var pickedImage: UIImage? = nil
    @State private var supplementingProduct: OFFProduct? = nil
    @State private var currentBarcode: String? = nil
    @State private var ocrCapturedImage: UIImage? = nil

    @Environment(ScanHistoryStore.self) private var scanHistory

    private var t: Labels { Labels(lang: lang) }

    enum ScanMode {
        case barcode, ocr
    }

    enum TagMatch {
        case allergy, intolerance, none
    }

    var body: some View {
        Group {
            if scanMode == .barcode {
                barcodeCameraView
            } else if isLoading {
                loadingView
            } else if let product {
                productResultView(product)
            } else if let error {
                errorView(error)
            } else {
                idleView
            }
        }
        .fullScreenCover(isPresented: $showImagePicker) {
            PhotoCaptureView(
                onPhotoCaptured: { image in
                    pickedImage = image
                    showImagePicker = false
                },
                onCancel: {
                    showImagePicker = false
                }
            )
            .ignoresSafeArea()
        }
        .onChange(of: pickedImage) { _, newImage in
            if let image = newImage {
                if supplementingProduct != nil {
                    Task { await processSupplementOCR(image) }
                } else {
                    Task { await processOCRImage(image) }
                }
            }
        }
    }

    // MARK: - Idle

    private var idleView: some View {
        VStack(spacing: 0) {
            // Scan buttons — always visible at top
            VStack(spacing: 12) {
                Image(systemName: "barcode.viewfinder")
                    .font(.system(size: 72))
                    .foregroundStyle(.secondary)

                Text(t.scanPrompt)
                    .foregroundStyle(.secondary)

                Button {
                    scanMode = .barcode
                } label: {
                    Label(t.scanBtn, systemImage: "camera")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)
                .controlSize(.large)

                Button {
                    startOCR()
                } label: {
                    Label(t.ocrBtn, systemImage: "doc.text.viewfinder")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.bordered)
                .controlSize(.large)
            }
            .padding(.horizontal, 24)
            .padding(.top, 16)
            .padding(.bottom, 24)

            // Recent scans — scrollable list with swipe-to-delete
            if !scanHistory.recentScans.isEmpty {
                VStack(alignment: .leading, spacing: 6) {
                    Text(t.recentTitle)
                        .font(.caption)
                        .fontWeight(.semibold)
                        .foregroundStyle(.secondary)
                        .textCase(.uppercase)
                        .padding(.horizontal, 24)

                    List {
                        ForEach(scanHistory.recentScans) { scan in
                            Button {
                                openRecentScan(scan)
                            } label: {
                                recentScanRow(scan)
                                    .contentShape(Rectangle())
                            }
                            .buttonStyle(.plain)
                            .swipeActions(edge: .trailing, allowsFullSwipe: true) {
                                Button(role: .destructive) {
                                    scanHistory.removeScan(id: scan.id)
                                } label: {
                                    Image(systemName: "trash")
                                }
                            }
                            .listRowInsets(EdgeInsets())
                        }
                    }
                    .listStyle(.plain)
                    .scrollContentBackground(.hidden)
                }
            } else {
                Spacer()
            }
        }
        .background(Color(.systemGroupedBackground))
    }

    private func recentScanRow(_ scan: ScanResult) -> some View {
        let summary = scanDetectionSummary(for: scan.productData)
        return HStack(spacing: 12) {
            Image(systemName: scan.source == .ocr ? "doc.text" : "cube")
                .foregroundStyle(.blue)
                .frame(width: 36, height: 36)
                .background(Color.blue.opacity(0.1))
                .clipShape(RoundedRectangle(cornerRadius: 8))

            VStack(alignment: .leading, spacing: 2) {
                Text(scan.productName.isEmpty ? t.unknownProduct : scan.productName)
                    .lineLimit(1)
                    .font(.subheadline)
                    .fontWeight(.medium)

                HStack(spacing: 6) {
                    Text(t.formatDate(scan.scannedAt))
                        .font(.caption)
                        .foregroundStyle(.secondary)

                    if scan.source == .ocr {
                        Text(t.ocrSourceLabel)
                            .font(.caption2)
                            .fontWeight(.semibold)
                            .padding(.horizontal, 5)
                            .padding(.vertical, 1)
                            .background(Color.blue.opacity(0.1))
                            .clipShape(RoundedRectangle(cornerRadius: 4))
                            .foregroundStyle(.blue)
                    }
                }
            }

            Spacer()

            // Detection status icons
            if summary.allergies > 0 || summary.intolerances > 0 {
                HStack(spacing: 4) {
                    if summary.allergies > 0 {
                        Text("⛔️\(summary.allergies)")
                            .font(.caption2)
                    }
                    if summary.intolerances > 0 {
                        Text("⚠️\(summary.intolerances)")
                            .font(.caption2)
                    }
                }
            }

            Image(systemName: "chevron.right")
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 12)
    }

    // MARK: - Barcode camera

    private var barcodeCameraView: some View {
        BarcodeScannerView(
            onBarcodeScanned: { barcode in
                scanMode = nil
                Task { await fetchProduct(barcode: barcode) }
            },
            onCancel: { scanMode = nil }
        )
        .ignoresSafeArea()
    }

    // MARK: - Loading

    private var loadingView: some View {
        VStack(spacing: 12) {
            ProgressView()
                .controlSize(.large)
            Text(scanMode == .ocr ? t.ocrLoading : t.loading)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color(.systemGroupedBackground))
    }

    // MARK: - Error

    private func errorView(_ message: String) -> some View {
        VStack(spacing: 16) {
            Image(systemName: "exclamationmark.triangle")
                .font(.system(size: 48))
                .foregroundStyle(.red)

            Text(message)
                .foregroundStyle(.red)
                .multilineTextAlignment(.center)

            Button {
                scanMode = .barcode
                error = nil
            } label: {
                Label(t.scanAgain, systemImage: "camera")
            }
            .buttonStyle(.borderedProminent)

            Button(t.backHome) {
                resetState()
            }
            .buttonStyle(.bordered)
        }
        .padding(32)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color(.systemGroupedBackground))
    }

    // MARK: - Product result

    private func productResultView(_ product: OFFProduct) -> some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Text(product.displayName.isEmpty ? t.unknownProduct : product.displayName)
                    .font(.title2)
                    .fontWeight(.bold)

                // Detection banner
                detectionBannerView

                // Ingredients
                VStack(alignment: .leading, spacing: 6) {
                    Text(t.ingredients)
                        .font(.subheadline)
                        .fontWeight(.semibold)

                    if let text = product.ingredientsText, !text.isEmpty {
                        Text(highlightedIngredients(text))
                            .font(.subheadline)
                    } else {
                        Text(t.unavailable)
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                            .italic()
                    }
                }

                // Declared allergens (barcode mode)
                let tags = product.allergensTags ?? []
                if !tags.isEmpty {
                    VStack(alignment: .leading, spacing: 6) {
                        Text(t.declaredAllergens)
                            .font(.subheadline)
                            .fontWeight(.semibold)

                        FlowLayout(spacing: 6) {
                            ForEach(tags, id: \.self) { tag in
                                let cleaned = tag.replacingOccurrences(
                                    of: #"^[a-z]{2}:"#, with: "", options: .regularExpression)
                                let match = tagMatchType(tag)
                                HStack(spacing: 3) {
                                    if match == .allergy {
                                        Text("⛔️").font(.caption2)
                                    } else if match == .intolerance {
                                        Text("⚠️").font(.caption2)
                                    }
                                    Text(cleaned)
                                        .font(.caption)
                                        .fontWeight(match != .none ? .semibold : .regular)
                                }
                                .padding(.horizontal, 10)
                                .padding(.vertical, 3)
                                .background(
                                    match == .allergy ? Color.red.opacity(0.2) :
                                    match == .intolerance ? Color.orange.opacity(0.2) :
                                    Color.yellow.opacity(0.2)
                                )
                                .clipShape(Capsule())
                            }
                        }
                    }
                }

                // OCR extracted text (collapsible)
                if let ocrText {
                    OCRTextSection(ocrText: ocrText, t: t)
                }

                // OCR photo proof (collapsible)
                if let ocrImage = ocrCapturedImage {
                    OCRPhotoSection(image: ocrImage, t: t)
                }

                // Action buttons
                HStack(spacing: 10) {
                    Button {
                        resetState()
                    } label: {
                        Label(t.backHome, systemImage: "arrow.left")
                    }
                    .buttonStyle(.bordered)

                    Button {
                        resetState()
                        scanMode = .barcode
                    } label: {
                        Label(t.scanAgain, systemImage: "camera")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.borderedProminent)
                }
                .padding(.top, 8)
            }
            .padding(16)
        }
        .background(Color(.systemGroupedBackground))
    }

    @ViewBuilder
    private var detectionBannerView: some View {
        if let results = detectionResults {
            if results.isEmpty {
                if ingredientsUnavailable {
                    noIngredientsWarningBanner
                } else {
                    // Safe banner
                    HStack {
                        Image(systemName: "checkmark.circle.fill")
                            .foregroundStyle(.green)
                        Text(t.safe)
                            .fontWeight(.semibold)
                            .foregroundStyle(Color(.systemGreen))
                    }
                    .padding(14)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(Color.green.opacity(0.1))
                    .clipShape(RoundedRectangle(cornerRadius: 10))
                }
            } else {
                // Danger banner
                VStack(alignment: .leading, spacing: 10) {
                    ForEach(results) { result in
                        VStack(alignment: .leading, spacing: 6) {
                            Text(result.profileName)
                                .font(.subheadline)
                                .fontWeight(.bold)

                            if !result.detectedAllergies.isEmpty {
                                alertRow(icon: "⛔️", label: t.alertAllergies,
                                         items: result.detectedAllergies, color: .red)
                            }
                            if !result.detectedIntolerances.isEmpty {
                                alertRow(icon: "⚠️", label: t.alertIntolerances,
                                         items: result.detectedIntolerances, color: .orange)
                            }
                            if !result.aiOnlyAllergies.isEmpty {
                                alertRow(icon: "⛔️", label: t.alertAIAllergies,
                                         items: result.aiOnlyAllergies, color: .red)
                            }
                            if !result.aiOnlyIntolerances.isEmpty {
                                alertRow(icon: "⚠️", label: t.alertAIIntolerances,
                                         items: result.aiOnlyIntolerances, color: .orange)
                            }
                        }
                    }
                }
                .padding(14)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(Color.red.opacity(0.1))
                .clipShape(RoundedRectangle(cornerRadius: 10))
            }
        } else if !profileStore.activeProfiles.isEmpty, product != nil {
            // Compute detection for barcode results
            let computed = detectAllProfiles(
                profileStore.activeProfiles,
                ingredientsText: product?.ingredientsText,
                allergenTags: product?.allergensTags
            )
            let isSafe = computed.isEmpty

            if isSafe {
                if ingredientsUnavailable {
                    noIngredientsWarningBanner
                        .onAppear { detectionResults = computed }
                } else {
                    HStack {
                        Image(systemName: "checkmark.circle.fill")
                            .foregroundStyle(.green)
                        Text(t.safe)
                            .fontWeight(.semibold)
                            .foregroundStyle(Color(.systemGreen))
                    }
                    .padding(14)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(Color.green.opacity(0.1))
                    .clipShape(RoundedRectangle(cornerRadius: 10))
                    .onAppear { detectionResults = computed }
                }
            } else {
                Color.clear.onAppear { detectionResults = computed }
            }
        }
    }

    private func alertRow(icon: String, label: String, items: [String], color: Color) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            HStack(spacing: 4) {
                Text(icon)
                    .font(.caption)
                Text(label)
                    .font(.caption)
                    .fontWeight(.semibold)
                    .foregroundStyle(color)
            }

            Text(items.joined(separator: ", "))
                .font(.caption)
                .padding(.leading, 8)
        }
    }

    // MARK: - Unified detection (keywords + AI additive)

    /// Run allergen detection: keywords always run first (reliable synonym matching),
    /// then AI adds extra findings when available.
    /// Keywords handle synonym groups (e.g. "blé" → gluten) + compound neutralization.
    /// AI adds context-aware findings that keywords might miss.
    private func runDetection(
        ingredientsText: String?,
        allergenTags: [String]?,
        barcode: String? = nil
    ) async -> [DetectionResult] {
        let profiles = profileStore.activeProfiles
        guard !profiles.isEmpty else { return [] }

        // Always run keyword detection first (reliable synonym matching + compound neutralization)
        let keywordResults = detectAllProfiles(
            profiles, ingredientsText: ingredientsText, allergenTags: allergenTags)

        let provider = await OnDeviceAIService.getProvider()
        aiProvider = provider
        let text = ingredientsText ?? ""

        if provider == .apple && !text.isEmpty {
            // AI adds context-aware findings on top of keyword results
            let aiDetected = await OnDeviceAIService.analyzeWithAppleIntelligence(
                ingredientsText: text, profiles: profiles, barcode: barcode)

            if aiDetected.isEmpty {
                return keywordResults
            }
            return mergeWithAIFindings(
                keywordResults: keywordResults, aiDetected: aiDetected, profiles: profiles)
        } else {
            return keywordResults
        }
    }

    // MARK: - Actions

    private func fetchProduct(barcode: String) async {
        isLoading = true
        error = nil
        product = nil
        ocrText = nil
        detectionResults = nil
        currentBarcode = barcode

        do {
            let fetched = try await OpenFoodFactsService.fetchProduct(barcode: barcode)
            product = fetched
            scanHistory.addScan(barcode: barcode, product: fetched, source: .barcode)

            // Run detection (AI if available, keyword fallback)
            detectionResults = await runDetection(
                ingredientsText: fetched.ingredientsText,
                allergenTags: fetched.allergensTags,
                barcode: barcode)
        } catch let offError as OpenFoodFactsError {
            switch offError {
            case .notFound: self.error = t.notFound
            default: self.error = t.networkError
            }
        } catch {
            self.error = t.networkError
        }

        isLoading = false
    }

    private func startOCR() {
        showImagePicker = true
    }

    private func processOCRImage(_ image: UIImage) async {
        isLoading = true
        scanMode = .ocr
        error = nil
        product = nil
        ocrText = nil
        detectionResults = nil
        ocrCapturedImage = image

        do {
            // Step 1: OCR — extract raw text
            let rawText = try await OCRService.recognizeText(from: image)
            ocrText = rawText

            // Step 2: Extract only ingredients via AI (if available), keyword fallback otherwise
            var ingredientsText = rawText
            let provider = await OnDeviceAIService.getProvider()
            if provider == .apple {
                if let extracted = await OnDeviceAIService.extractIngredientsFromOCR(fullText: rawText) {
                    ingredientsText = extracted
                }
            } else {
                if let extracted = OnDeviceAIService.extractIngredientsKeyword(fullText: rawText) {
                    ingredientsText = extracted
                }
            }

            // Step 3: Run detection (keywords first, AI additive)
            detectionResults = await runDetection(ingredientsText: ingredientsText, allergenTags: nil)

            let ocrProduct = OFFProduct(
                productName: t.ocrProductName,
                productNameFr: lang == .fr ? t.ocrProductName : nil,
                ingredientsText: ingredientsText,
                allergensTags: []
            )
            product = ocrProduct
            scanHistory.addScan(barcode: "ocr-\(Date().timeIntervalSince1970)", product: ocrProduct, source: .ocr)

        } catch is OCRService.OCRError {
            let ocrError = error as? OCRService.OCRError
            switch ocrError {
            case .noTextFound: self.error = t.ocrErrorEmpty
            default: self.error = t.ocrErrorFailed
            }
        } catch {
            self.error = t.ocrErrorFailed
        }

        isLoading = false
        scanMode = nil
        pickedImage = nil
    }

    private func openRecentScan(_ scan: ScanResult) {
        product = scan.productData
        ocrText = nil
        error = nil
        // Keyword results immediately (reliable), then AI adds on top
        if let pd = scan.productData {
            detectionResults = detectAllProfiles(
                profileStore.activeProfiles,
                ingredientsText: pd.ingredientsText,
                allergenTags: pd.allergensTags)
        } else {
            detectionResults = nil
        }
    }

    private func resetState() {
        scanMode = nil
        product = nil
        ocrText = nil
        detectionResults = nil
        error = nil
        isLoading = false
        pickedImage = nil
        supplementingProduct = nil
        currentBarcode = nil
        ocrCapturedImage = nil
    }

    private func supplementWithOCR() {
        supplementingProduct = product
        showImagePicker = true
    }

    private func processSupplementOCR(_ image: UIImage) async {
        guard let original = supplementingProduct else { return }
        isLoading = true
        ocrCapturedImage = image

        do {
            let rawText = try await OCRService.recognizeText(from: image)
            ocrText = rawText

            // Extract only ingredients via AI (if available), keyword fallback otherwise
            var ingredientsText = rawText
            let provider = await OnDeviceAIService.getProvider()
            if provider == .apple {
                if let extracted = await OnDeviceAIService.extractIngredientsFromOCR(fullText: rawText) {
                    ingredientsText = extracted
                }
            } else {
                if let extracted = OnDeviceAIService.extractIngredientsKeyword(fullText: rawText) {
                    ingredientsText = extracted
                }
            }

            // Merge OCR ingredients into the original barcode product
            let merged = OFFProduct(
                productName: original.productName,
                productNameFr: original.productNameFr,
                ingredientsText: ingredientsText,
                allergensTags: original.allergensTags
            )
            product = merged

            // Run detection (AI primary, keyword fallback)
            detectionResults = await runDetection(ingredientsText: ingredientsText, allergenTags: merged.allergensTags)

            // Update scan history with merged product
            if let barcode = currentBarcode {
                scanHistory.addScan(barcode: barcode, product: merged, source: .barcode)
            }

        } catch {
            self.error = t.ocrErrorFailed
        }

        isLoading = false
        supplementingProduct = nil
        pickedImage = nil
    }

    // MARK: - Helpers

    private var ingredientsUnavailable: Bool {
        guard let product else { return false }
        return (product.ingredientsText ?? "").trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    }

    private var noIngredientsWarningBanner: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: "exclamationmark.triangle.fill")
                    .foregroundStyle(.orange)
                Text(t.noIngredientsTitle)
                    .fontWeight(.semibold)
                    .foregroundStyle(.orange)
            }
            Text(t.noIngredientsSuggest)
                .font(.caption)
                .foregroundStyle(.secondary)
            Button {
                supplementWithOCR()
            } label: {
                Label(t.ocrBtn, systemImage: "doc.text.viewfinder")
                    .font(.caption)
            }
            .buttonStyle(.bordered)
            .tint(.blue)
        }
        .padding(14)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.orange.opacity(0.1))
        .clipShape(RoundedRectangle(cornerRadius: 10))
    }

    private func scanDetectionSummary(for product: OFFProduct?) -> (allergies: Int, intolerances: Int) {
        guard let product else { return (0, 0) }
        let results = detectAllProfiles(profileStore.activeProfiles,
                                         ingredientsText: product.ingredientsText,
                                         allergenTags: product.allergensTags)
        let allergies = results.filter { !$0.detectedAllergies.isEmpty || !$0.aiOnlyAllergies.isEmpty }.count
        let intolerances = results.filter { !$0.detectedIntolerances.isEmpty || !$0.aiOnlyIntolerances.isEmpty }.count
        return (allergies, intolerances)
    }

    private func tagMatchType(_ tag: String) -> TagMatch {
        let cleaned = tag.replacingOccurrences(of: #"^[a-z]{2}:"#, with: "", options: .regularExpression).lowercased()
        for profile in profileStore.activeProfiles {
            for allergen in profile.allergies {
                let keywords = getKeywords(for: allergen)
                if keywords.contains(where: { cleaned.contains($0) || $0.contains(cleaned) }) {
                    return .allergy
                }
            }
            for intolerance in profile.intolerances {
                let keywords = getKeywords(for: intolerance)
                if keywords.contains(where: { cleaned.contains($0) || $0.contains(cleaned) }) {
                    return .intolerance
                }
            }
        }
        return .none
    }

    private func highlightedIngredients(_ text: String) -> AttributedString {
        guard let results = detectionResults, !results.isEmpty else {
            return AttributedString(text)
        }

        // Collect keywords for detected allergens and intolerances
        var allergyKeywords: Set<String> = []
        var intoleranceKeywords: Set<String> = []

        for result in results {
            for name in result.detectedAllergies + result.aiOnlyAllergies {
                getKeywords(for: name).forEach { allergyKeywords.insert($0) }
            }
            for name in result.detectedIntolerances + result.aiOnlyIntolerances {
                getKeywords(for: name).forEach { intoleranceKeywords.insert($0) }
            }
        }
        // Allergies take priority for shared keywords
        intoleranceKeywords.subtract(allergyKeywords)

        // Find keyword positions in the text
        struct HighlightRange {
            let range: Range<String.Index>
            let isAllergy: Bool
        }
        var highlights: [HighlightRange] = []

        func findKeyword(_ kw: String, isAllergy: Bool) {
            var searchStart = text.startIndex
            while searchStart < text.endIndex {
                guard let range = text.range(of: kw, options: [.caseInsensitive, .diacriticInsensitive],
                                              range: searchStart..<text.endIndex) else { break }

                // Word boundary check for single-word keywords
                var matchValid = true
                if !kw.contains(" ") {
                    let isWordStart = range.lowerBound == text.startIndex ||
                        !text[text.index(before: range.lowerBound)].isLetter
                    let isWordEnd = range.upperBound == text.endIndex ||
                        !text[range.upperBound].isLetter
                    matchValid = isWordStart && isWordEnd
                }

                if matchValid {
                    let overlaps = highlights.contains { $0.range.overlaps(range) }
                    if !overlaps {
                        highlights.append(HighlightRange(range: range, isAllergy: isAllergy))
                    }
                }
                searchStart = range.upperBound
            }
        }

        // Process longer keywords first to avoid partial matches
        for kw in allergyKeywords.sorted(by: { $0.count > $1.count }) {
            findKeyword(kw, isAllergy: true)
        }
        for kw in intoleranceKeywords.sorted(by: { $0.count > $1.count }) {
            findKeyword(kw, isAllergy: false)
        }

        highlights.sort { $0.range.lowerBound < $1.range.lowerBound }

        // Build attributed string with highlights
        var attributed = AttributedString()
        var current = text.startIndex

        for h in highlights {
            if current < h.range.lowerBound {
                attributed.append(AttributedString(text[current..<h.range.lowerBound]))
            }
            var segment = AttributedString(text[h.range])
            segment.foregroundColor = h.isAllergy ? .red : .orange
            segment.font = .subheadline.bold()
            attributed.append(segment)
            current = h.range.upperBound
        }

        if current < text.endIndex {
            attributed.append(AttributedString(text[current..<text.endIndex]))
        }

        return attributed
    }
}

// MARK: - OCR Text Section (collapsible)

struct OCRTextSection: View {
    let ocrText: String
    let t: Labels
    @State private var expanded = false

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Button {
                withAnimation { expanded.toggle() }
            } label: {
                HStack {
                    Text(t.ocrExtractedText)
                        .font(.subheadline)
                        .fontWeight(.semibold)
                        .foregroundStyle(Color(.label))
                    Spacer()
                    Text(expanded ? t.ocrTextHide : t.ocrTextShow)
                        .font(.subheadline)
                        .foregroundStyle(.blue)
                }
            }

            if expanded {
                Text(ocrText)
                    .font(.caption)
                    .padding(10)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(Color(.secondarySystemGroupedBackground))
                    .clipShape(RoundedRectangle(cornerRadius: 8))
            }
        }
    }
}

// MARK: - OCR Photo Section (collapsible)

struct OCRPhotoSection: View {
    let image: UIImage
    let t: Labels
    @State private var expanded = false

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Button {
                withAnimation { expanded.toggle() }
            } label: {
                HStack {
                    Text(t.ocrPhotoTitle)
                        .font(.subheadline)
                        .fontWeight(.semibold)
                        .foregroundStyle(Color(.label))
                    Spacer()
                    Text(expanded ? t.ocrTextHide : t.ocrTextShow)
                        .font(.subheadline)
                        .foregroundStyle(.blue)
                }
            }

            if expanded {
                Image(uiImage: image)
                    .resizable()
                    .scaledToFit()
                    .clipShape(RoundedRectangle(cornerRadius: 8))
            }
        }
    }
}

// MARK: - Photo Capture (custom AVCaptureSession camera — rear only, full screen)

struct PhotoCaptureView: UIViewControllerRepresentable {
    let onPhotoCaptured: (UIImage) -> Void
    let onCancel: () -> Void

    func makeUIViewController(context: Context) -> PhotoCaptureViewController {
        let vc = PhotoCaptureViewController()
        vc.onPhotoCaptured = onPhotoCaptured
        vc.onCancel = onCancel
        return vc
    }

    func updateUIViewController(_ uiViewController: PhotoCaptureViewController, context: Context) {}
}

class PhotoCaptureViewController: UIViewController {
    var onPhotoCaptured: ((UIImage) -> Void)?
    var onCancel: (() -> Void)?

    private let captureSession = AVCaptureSession()
    private var previewLayer: AVCaptureVideoPreviewLayer!
    private let photoOutput = AVCapturePhotoOutput()

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .black
        setupCamera()
        setupOverlay()
    }

    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)
        DispatchQueue.global(qos: .userInitiated).async { [weak self] in
            self?.captureSession.startRunning()
        }
    }

    override func viewWillDisappear(_ animated: Bool) {
        super.viewWillDisappear(animated)
        captureSession.stopRunning()
    }

    override func viewDidLayoutSubviews() {
        super.viewDidLayoutSubviews()
        previewLayer?.frame = view.bounds
    }

    private func setupCamera() {
        guard let device = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: .back),
              let input = try? AVCaptureDeviceInput(device: device) else { return }

        if captureSession.canAddInput(input) {
            captureSession.addInput(input)
        }

        if captureSession.canAddOutput(photoOutput) {
            captureSession.addOutput(photoOutput)
        }

        previewLayer = AVCaptureVideoPreviewLayer(session: captureSession)
        previewLayer.videoGravity = .resizeAspectFill
        previewLayer.frame = view.bounds
        view.layer.addSublayer(previewLayer)
    }

    private func setupOverlay() {
        // Shutter button — white circle
        let shutterBtn = UIButton(type: .system)
        shutterBtn.translatesAutoresizingMaskIntoConstraints = false
        shutterBtn.backgroundColor = .white
        shutterBtn.layer.cornerRadius = 36
        shutterBtn.layer.borderWidth = 4
        shutterBtn.layer.borderColor = UIColor.white.withAlphaComponent(0.4).cgColor
        shutterBtn.addTarget(self, action: #selector(shutterTapped), for: .touchUpInside)
        view.addSubview(shutterBtn)

        // Cancel button
        let cancelBtn = UIButton(type: .system)
        cancelBtn.translatesAutoresizingMaskIntoConstraints = false
        cancelBtn.backgroundColor = UIColor.black.withAlphaComponent(0.5)
        cancelBtn.layer.cornerRadius = 24
        cancelBtn.layer.borderWidth = 1
        cancelBtn.layer.borderColor = UIColor.white.withAlphaComponent(0.4).cgColor
        let config = UIImage.SymbolConfiguration(pointSize: 20, weight: .medium)
        let xImage = UIImage(systemName: "xmark", withConfiguration: config)
        cancelBtn.setImage(xImage, for: .normal)
        cancelBtn.tintColor = .white
        cancelBtn.addTarget(self, action: #selector(cancelTapped), for: .touchUpInside)
        view.addSubview(cancelBtn)

        NSLayoutConstraint.activate([
            shutterBtn.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            shutterBtn.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor, constant: -24),
            shutterBtn.widthAnchor.constraint(equalToConstant: 72),
            shutterBtn.heightAnchor.constraint(equalToConstant: 72),

            cancelBtn.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 24),
            cancelBtn.centerYAnchor.constraint(equalTo: shutterBtn.centerYAnchor),
            cancelBtn.widthAnchor.constraint(equalToConstant: 48),
            cancelBtn.heightAnchor.constraint(equalToConstant: 48),
        ])
    }

    @objc private func shutterTapped() {
        let settings = AVCapturePhotoSettings()
        photoOutput.capturePhoto(with: settings, delegate: self)
    }

    @objc private func cancelTapped() {
        onCancel?()
    }
}

extension PhotoCaptureViewController: AVCapturePhotoCaptureDelegate {
    nonisolated func photoOutput(_ output: AVCapturePhotoOutput, didFinishProcessingPhoto photo: AVCapturePhoto, error: Error?) {
        guard let data = photo.fileDataRepresentation(),
              let image = UIImage(data: data) else { return }
        DispatchQueue.main.async { [weak self] in
            self?.captureSession.stopRunning()
            self?.onPhotoCaptured?(image)
        }
    }
}

// MARK: - Flow Layout (for allergen tag chips)

struct FlowLayout: Layout {
    var spacing: CGFloat = 6

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let result = arrangeSubviews(proposal: proposal, subviews: subviews)
        return result.size
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        let result = arrangeSubviews(proposal: proposal, subviews: subviews)
        for (index, position) in result.positions.enumerated() {
            subviews[index].place(at: CGPoint(x: bounds.minX + position.x, y: bounds.minY + position.y),
                                  proposal: .unspecified)
        }
    }

    private func arrangeSubviews(proposal: ProposedViewSize, subviews: Subviews) -> (size: CGSize, positions: [CGPoint]) {
        let maxWidth = proposal.width ?? .infinity
        var positions: [CGPoint] = []
        var x: CGFloat = 0
        var y: CGFloat = 0
        var rowHeight: CGFloat = 0

        for subview in subviews {
            let size = subview.sizeThatFits(.unspecified)
            if x + size.width > maxWidth && x > 0 {
                x = 0
                y += rowHeight + spacing
                rowHeight = 0
            }
            positions.append(CGPoint(x: x, y: y))
            rowHeight = max(rowHeight, size.height)
            x += size.width + spacing
        }

        return (CGSize(width: maxWidth, height: y + rowHeight), positions)
    }
}
