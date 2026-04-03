// Localization.swift — Bilingual labels (FR / EN)

import Foundation

enum AppLanguage: String, Codable, CaseIterable {
    case fr, en
}

struct Labels {
    let lang: AppLanguage

    // MARK: - Scanner

    var scanPrompt: String { lang == .fr ? "Appuyez pour scanner" : "Tap to scan" }
    var scanBtn: String { lang == .fr ? "Scanner un produit" : "Scan a product" }
    var ocrBtn: String { lang == .fr ? "Photographier l'étiquette" : "Photograph a label" }
    var cancel: String { lang == .fr ? "Annuler" : "Cancel" }
    var retry: String { lang == .fr ? "Réessayer" : "Try again" }
    var loading: String { lang == .fr ? "Analyse en cours…" : "Scanning..." }
    var ocrLoading: String { lang == .fr ? "Lecture de l'étiquette…" : "Reading label..." }
    var notFound: String { lang == .fr ? "Produit introuvable." : "Product not found." }
    var networkError: String { lang == .fr ? "Erreur réseau. Vérifiez votre connexion." : "Network error. Check your connection." }
    var unknownProduct: String { lang == .fr ? "Produit sans nom" : "Unknown product" }
    var ocrProductName: String { lang == .fr ? "Produit scanné" : "Scanned product" }
    var ingredients: String { lang == .fr ? "Ingrédients" : "Ingredients" }
    var declaredAllergens: String { lang == .fr ? "Allergènes déclarés" : "Declared allergens" }
    var ocrExtractedText: String { lang == .fr ? "Texte extrait" : "Extracted text" }
    var ocrTextHide: String { lang == .fr ? "Masquer" : "Hide" }
    var ocrTextShow: String { lang == .fr ? "Afficher" : "Show" }
    var unavailable: String { lang == .fr ? "Non disponible" : "Not available" }
    var none: String { lang == .fr ? "Aucun" : "None" }
    var safe: String { lang == .fr ? "Aucun allergène détecté." : "No allergens detected." }
    var alertAllergies: String { lang == .fr ? "Allergies détectées" : "Allergies detected" }
    var alertIntolerances: String { lang == .fr ? "Intolérances détectées" : "Intolerances detected" }
    var alertAIAllergies: String { lang == .fr ? "Allergies détectées (IA)" : "Allergies detected (AI)" }
    var alertAIIntolerances: String { lang == .fr ? "Intolérances détectées (IA)" : "Intolerances detected (AI)" }
    var scanAgain: String { lang == .fr ? "Scanner à nouveau" : "Scan again" }
    var backHome: String { lang == .fr ? "Retour" : "Back" }
    var permissionTitle: String { lang == .fr ? "Permission caméra requise" : "Camera permission required" }
    var permissionMessage: String { lang == .fr ? "Allergie Check a besoin d'accès à votre caméra pour scanner les codes-barres." : "Allergie Check needs camera access to scan barcodes." }
    var permissionBtn: String { lang == .fr ? "Autoriser la caméra" : "Allow camera" }
    var recentTitle: String { lang == .fr ? "Produits récents" : "Recent products" }
    var today: String { lang == .fr ? "Aujourd'hui" : "Today" }
    var yesterday: String { lang == .fr ? "Hier" : "Yesterday" }
    var ocrSourceLabel: String { "OCR" }
    var barcodeSourceLabel: String { lang == .fr ? "Code-barres" : "Barcode" }
    var ocrErrorPermission: String { lang == .fr ? "Accès à la caméra refusé. Autorisez l'accès dans les réglages." : "Camera access denied. Allow access in Settings." }
    var ocrErrorEmpty: String { lang == .fr ? "Aucun texte détecté sur l'image. Essayez avec une meilleure photo." : "No text detected in the image. Try a clearer photo." }
    var ocrErrorFailed: String { lang == .fr ? "Échec de la lecture. Essayez à nouveau." : "Reading failed. Please try again." }
    var noIngredientsTitle: String { lang == .fr ? "Ingrédients non disponibles" : "Ingredients not available" }
    var noIngredientsSuggest: String { lang == .fr ? "Photographiez l'étiquette pour analyser les ingrédients." : "Photograph the label to analyze ingredients." }

    // MARK: - Profiles

    var myProfile: String { lang == .fr ? "Mon profil" : "My profile" }
    var family: String { lang == .fr ? "Famille" : "Family" }
    var language: String { lang == .fr ? "Langue" : "Language" }
    var editName: String { lang == .fr ? "Modifier le nom" : "Edit name" }
    var saveName: String { lang == .fr ? "Enregistrer" : "Save" }
    var addProfile: String { lang == .fr ? "Ajouter un membre" : "Add a member" }
    var addProfilePlaceholder: String { lang == .fr ? "Nom (ex. Ma femme)" : "Name (e.g. My wife)" }
    var save: String { lang == .fr ? "Ajouter" : "Add" }
    var deleteProfile: String { lang == .fr ? "Supprimer" : "Delete" }
    var allergyPlaceholder: String { lang == .fr ? "Ex. arachides, gluten…" : "E.g. peanuts, gluten…" }
    var intolerancePlaceholder: String { lang == .fr ? "Ex. lactose, fructose…" : "E.g. lactose, fructose…" }
    var noAllergies: String { lang == .fr ? "Aucune allergie configurée." : "No allergies configured." }
    var noIntolerances: String { lang == .fr ? "Aucune intolérance configurée." : "No intolerances configured." }
    var addAllergy: String { lang == .fr ? "Allergie" : "Allergy" }
    var addIntolerance: String { lang == .fr ? "Intolérance" : "Intolerance" }
    var allergies: String { lang == .fr ? "Allergies" : "Allergies" }
    var intolerances: String { lang == .fr ? "Intolérances" : "Intolerances" }
    var synonymsTitle: String { lang == .fr ? "Noms dérivés" : "Derived names" }
    var synonymsSubtitle: String { "FR · EN" }
    var noFamily: String { lang == .fr ? "Aucun membre de la famille." : "No family members." }
    var back: String { lang == .fr ? "Retour" : "Back" }
    var deleteConfirmTitle: String { lang == .fr ? "Supprimer" : "Delete" }
    var deleteConfirmMessage: String { lang == .fr ? "Voulez-vous vraiment supprimer ce profil ?" : "Are you sure you want to delete this profile?" }
    var deleteConfirmOk: String { lang == .fr ? "Supprimer" : "Delete" }
    var deleteConfirmCancel: String { lang == .fr ? "Annuler" : "Cancel" }

    func items(_ n: Int) -> String { lang == .fr ? "\(n) élément(s)" : "\(n) item(s)" }
    func members(_ n: Int) -> String { lang == .fr ? "\(n) membre(s)" : "\(n) member(s)" }

    // MARK: - Tabs

    var scannerTab: String { "Scanner" }
    var profilesTab: String { lang == .fr ? "Profils" : "Profiles" }

    // MARK: - Date formatting

    func formatDate(_ date: Date) -> String {
        let now = Date()
        let calendar = Calendar.current
        if calendar.isDateInToday(date) { return today }
        if calendar.isDateInYesterday(date) { return yesterday }
        let formatter = DateFormatter()
        formatter.dateFormat = "d MMM"
        formatter.locale = Locale(identifier: lang == .fr ? "fr_CA" : "en_CA")
        return formatter.string(from: date)
    }
}
