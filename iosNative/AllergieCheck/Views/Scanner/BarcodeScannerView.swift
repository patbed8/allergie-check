// BarcodeScannerView.swift — AVFoundation barcode scanner camera

import SwiftUI
import AVFoundation

struct BarcodeScannerView: UIViewControllerRepresentable {
    let onBarcodeScanned: (String) -> Void
    let onCancel: () -> Void

    func makeUIViewController(context: Context) -> BarcodeScannerViewController {
        let vc = BarcodeScannerViewController()
        vc.onBarcodeScanned = onBarcodeScanned
        vc.onCancel = onCancel
        return vc
    }

    func updateUIViewController(_ uiViewController: BarcodeScannerViewController, context: Context) {}
}

class BarcodeScannerViewController: UIViewController {
    var onBarcodeScanned: ((String) -> Void)?
    var onCancel: (() -> Void)?

    private let captureSession = AVCaptureSession()
    private var previewLayer: AVCaptureVideoPreviewLayer!
    private var hasScanned = false

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
        guard let device = AVCaptureDevice.default(for: .video),
              let input = try? AVCaptureDeviceInput(device: device) else { return }

        if captureSession.canAddInput(input) {
            captureSession.addInput(input)
        }

        let output = AVCaptureMetadataOutput()
        if captureSession.canAddOutput(output) {
            captureSession.addOutput(output)
            output.setMetadataObjectsDelegate(self, queue: .main)
            output.metadataObjectTypes = [.ean13, .ean8, .upce]
        }

        previewLayer = AVCaptureVideoPreviewLayer(session: captureSession)
        previewLayer.videoGravity = .resizeAspectFill
        previewLayer.frame = view.bounds
        view.layer.addSublayer(previewLayer)
    }

    private func setupOverlay() {
        // Scan frame
        let frameView = UIView()
        frameView.layer.borderColor = UIColor.white.withAlphaComponent(0.8).cgColor
        frameView.layer.borderWidth = 2
        frameView.layer.cornerRadius = 10
        frameView.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(frameView)

        NSLayoutConstraint.activate([
            frameView.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            frameView.centerYAnchor.constraint(equalTo: view.centerYAnchor),
            frameView.widthAnchor.constraint(equalToConstant: 220),
            frameView.heightAnchor.constraint(equalToConstant: 140),
        ])

        // Cancel button
        let cancelBtn = UIButton(type: .system)
        cancelBtn.setTitle(nil, for: .normal)
        cancelBtn.backgroundColor = UIColor.black.withAlphaComponent(0.5)
        cancelBtn.layer.cornerRadius = 24
        cancelBtn.layer.borderWidth = 1
        cancelBtn.layer.borderColor = UIColor.white.withAlphaComponent(0.4).cgColor
        cancelBtn.translatesAutoresizingMaskIntoConstraints = false

        let config = UIImage.SymbolConfiguration(pointSize: 20, weight: .medium)
        let xImage = UIImage(systemName: "xmark", withConfiguration: config)
        cancelBtn.setImage(xImage, for: .normal)
        cancelBtn.tintColor = .white
        cancelBtn.addTarget(self, action: #selector(cancelTapped), for: .touchUpInside)
        view.addSubview(cancelBtn)

        NSLayoutConstraint.activate([
            cancelBtn.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            cancelBtn.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor, constant: -24),
            cancelBtn.widthAnchor.constraint(equalToConstant: 48),
            cancelBtn.heightAnchor.constraint(equalToConstant: 48),
        ])
    }

    @objc private func cancelTapped() {
        onCancel?()
    }
}

// Delegate conformance in a nonisolated extension to avoid Swift 6 concurrency issues
extension BarcodeScannerViewController: AVCaptureMetadataOutputObjectsDelegate {
    nonisolated func metadataOutput(
        _ output: AVCaptureMetadataOutput,
        didOutput metadataObjects: [AVMetadataObject],
        from connection: AVCaptureConnection
    ) {
        guard let object = metadataObjects.first as? AVMetadataMachineReadableCodeObject,
              let value = object.stringValue else { return }

        DispatchQueue.main.async { [weak self] in
            guard let self, !self.hasScanned else { return }
            self.hasScanned = true
            self.captureSession.stopRunning()

            let generator = UIImpactFeedbackGenerator(style: .medium)
            generator.impactOccurred()

            self.onBarcodeScanned?(value)
        }
    }
}
