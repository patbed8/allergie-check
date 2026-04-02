// ScannerView.swift — Main scanner tab: idle, barcode, OCR, results

import SwiftUI
import PhotosUI

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

    @Environment(ScanHistoryStore.self) private var scanHistory

    private var t: Labels { Labels(lang: lang) }

    enum ScanMode {
        case barcode, ocr
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
        .sheet(isPresented: $showImagePicker) {
            ImagePicker(image: $pickedImage)
        }
        .onChange(of: pickedImage) { _, newImage in
            if let image = newImage {
                Task { await processOCRImage(image) }
            }
        }
    }

    // MARK: - Idle

    private var idleView: some View {
        ScrollView {
            VStack(spacing: 32) {
                // Scan buttons
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
                .padding(.top, 16)

                // Recent scans
                if !scanHistory.recentScans.isEmpty {
                    VStack(alignment: .leading, spacing: 10) {
                        Text(t.recentTitle)
                            .font(.caption)
                            .fontWeight(.semibold)
                            .foregroundStyle(.secondary)
                            .textCase(.uppercase)

                        VStack(spacing: 0) {
                            ForEach(Array(scanHistory.recentScans.enumerated()), id: \.element.id) { index, scan in
                                Button {
                                    openRecentScan(scan)
                                } label: {
                                    recentScanRow(scan)
                                }
                                .buttonStyle(.plain)

                                if index < scanHistory.recentScans.count - 1 {
                                    Divider().padding(.leading, 52)
                                }
                            }
                        }
                        .background(Color(.systemBackground))
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                        .overlay(
                            RoundedRectangle(cornerRadius: 12)
                                .stroke(Color(.separator), lineWidth: 0.5)
                        )
                    }
                }
            }
            .padding(24)
        }
        .background(Color(.systemGroupedBackground))
    }

    private func recentScanRow(_ scan: ScanResult) -> some View {
        HStack(spacing: 12) {
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
                        Text(text)
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
                                Text(cleaned)
                                    .font(.caption)
                                    .padding(.horizontal, 10)
                                    .padding(.vertical, 3)
                                    .background(Color.yellow.opacity(0.2))
                                    .clipShape(Capsule())
                            }
                        }
                    }
                }

                // OCR extracted text (collapsible)
                if let ocrText {
                    OCRTextSection(ocrText: ocrText, t: t)
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
            } else {
                // Danger banner
                VStack(alignment: .leading, spacing: 10) {
                    ForEach(results) { result in
                        VStack(alignment: .leading, spacing: 6) {
                            Text(result.profileName)
                                .font(.subheadline)
                                .fontWeight(.bold)

                            if !result.detectedAllergies.isEmpty {
                                alertRow(icon: "exclamationmark.triangle.fill", label: t.alertAllergies,
                                         items: result.detectedAllergies, color: .red)
                            }
                            if !result.detectedIntolerances.isEmpty {
                                alertRow(icon: "bolt.fill", label: t.alertIntolerances,
                                         items: result.detectedIntolerances, color: .orange)
                            }
                            if !result.aiOnlyAllergies.isEmpty {
                                alertRow(icon: "cpu", label: t.alertAIAllergies,
                                         items: result.aiOnlyAllergies, color: .red)
                            }
                            if !result.aiOnlyIntolerances.isEmpty {
                                alertRow(icon: "cpu", label: t.alertAIIntolerances,
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
            } else {
                Color.clear.onAppear { detectionResults = computed }
            }
        }
    }

    private func alertRow(icon: String, label: String, items: [String], color: Color) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            HStack(spacing: 4) {
                Image(systemName: icon)
                    .font(.caption)
                Text(label)
                    .font(.caption)
                    .fontWeight(.semibold)
            }
            .foregroundStyle(color)

            Text(items.joined(separator: ", "))
                .font(.caption)
                .padding(.leading, 8)
        }
    }

    // MARK: - Actions

    private func fetchProduct(barcode: String) async {
        isLoading = true
        error = nil
        product = nil
        ocrText = nil
        detectionResults = nil

        do {
            let fetched = try await OpenFoodFactsService.fetchProduct(barcode: barcode)
            product = fetched
            scanHistory.addScan(barcode: barcode, product: fetched, source: .barcode)

            // Run detection
            if !profileStore.activeProfiles.isEmpty {
                detectionResults = detectAllProfiles(
                    profileStore.activeProfiles,
                    ingredientsText: fetched.ingredientsText,
                    allergenTags: fetched.allergensTags
                )
            }
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

        do {
            // Step 1: OCR
            let text = try await OCRService.recognizeText(from: image)
            ocrText = text

            // Step 2: Keyword detection
            let activeProfiles = profileStore.activeProfiles
            var keywordResults: [DetectionResult] = []
            if !activeProfiles.isEmpty {
                keywordResults = detectAllProfiles(activeProfiles, ingredientsText: text, allergenTags: nil)
            }

            // Step 3: On-device AI (additive)
            var mergedResults = keywordResults.map { r in
                var copy = r
                copy.aiOnlyAllergies = []
                copy.aiOnlyIntolerances = []
                return copy
            }

            aiProvider = .none
            if !activeProfiles.isEmpty {
                let provider = await OnDeviceAIService.getProvider()
                aiProvider = provider
                if provider == .apple {
                    let aiDetected = await OnDeviceAIService.analyzeWithAppleIntelligence(
                        ingredientsText: text, profiles: activeProfiles)
                    if !aiDetected.isEmpty {
                        mergedResults = mergeWithAIFindings(
                            keywordResults: keywordResults, aiDetected: aiDetected, profiles: activeProfiles)
                    }
                }
            }

            detectionResults = mergedResults

            let ocrProduct = OFFProduct(
                productName: t.ocrProductName,
                productNameFr: lang == .fr ? t.ocrProductName : nil,
                ingredientsText: text,
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
        detectionResults = nil
        error = nil
    }

    private func resetState() {
        scanMode = nil
        product = nil
        ocrText = nil
        detectionResults = nil
        error = nil
        isLoading = false
        pickedImage = nil
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

// MARK: - Image Picker (camera)

struct ImagePicker: UIViewControllerRepresentable {
    @Binding var image: UIImage?
    @Environment(\.dismiss) private var dismiss

    func makeUIViewController(context: Context) -> UIImagePickerController {
        let picker = UIImagePickerController()
        picker.sourceType = .camera
        picker.delegate = context.coordinator
        return picker
    }

    func updateUIViewController(_ uiViewController: UIImagePickerController, context: Context) {}

    func makeCoordinator() -> Coordinator { Coordinator(self) }

    class Coordinator: NSObject, UIImagePickerControllerDelegate, UINavigationControllerDelegate {
        let parent: ImagePicker
        init(_ parent: ImagePicker) { self.parent = parent }

        func imagePickerController(_ picker: UIImagePickerController,
                                   didFinishPickingMediaWithInfo info: [UIImagePickerController.InfoKey: Any]) {
            parent.image = info[.originalImage] as? UIImage
            parent.dismiss()
        }

        func imagePickerControllerDidCancel(_ picker: UIImagePickerController) {
            parent.dismiss()
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
