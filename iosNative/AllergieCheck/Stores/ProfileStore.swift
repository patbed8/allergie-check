// ProfileStore.swift — Profile CRUD with UserDefaults persistence

import Foundation
import Observation

@Observable
class ProfileStore {
    var profiles: [Profile] = []
    var loaded = false

    private let storageKey = "allergie-check-profiles"

    init() {
        loadProfiles()
    }

    // MARK: - Persistence

    private func loadProfiles() {
        if let data = UserDefaults.standard.data(forKey: storageKey),
           let decoded = try? JSONDecoder().decode([Profile].self, from: data),
           !decoded.isEmpty {
            profiles = decoded
        } else {
            profiles = [Profile(id: Profile.makeId(), name: "Moi", allergies: [], intolerances: [])]
        }
        loaded = true
    }

    private func save() {
        if let data = try? JSONEncoder().encode(profiles) {
            UserDefaults.standard.set(data, forKey: storageKey)
        }
    }

    // MARK: - Computed

    var myProfile: Profile? { profiles.first }
    var familyProfiles: [Profile] { Array(profiles.dropFirst()) }

    /// Profiles that have at least one allergen or intolerance configured.
    var activeProfiles: [Profile] {
        profiles.filter { !$0.allergies.isEmpty || !$0.intolerances.isEmpty }
    }

    // MARK: - CRUD

    func addProfile(name: String) {
        let trimmed = name.trimmingCharacters(in: .whitespaces)
        guard !trimmed.isEmpty else { return }
        profiles.append(Profile(id: Profile.makeId(), name: trimmed, allergies: [], intolerances: []))
        save()
    }

    func removeProfile(id: String) {
        guard profiles.count > 1 else { return }
        profiles.removeAll { $0.id == id }
        save()
    }

    func updateProfileName(id: String, name: String) {
        let trimmed = name.trimmingCharacters(in: .whitespaces)
        guard !trimmed.isEmpty else { return }
        guard let index = profiles.firstIndex(where: { $0.id == id }) else { return }
        profiles[index].name = trimmed
        save()
    }

    func addAllergy(profileId: String, allergen: String) {
        let trimmed = allergen.trimmingCharacters(in: .whitespaces).lowercased()
        guard !trimmed.isEmpty else { return }
        guard let index = profiles.firstIndex(where: { $0.id == profileId }) else { return }
        guard !profiles[index].allergies.contains(where: { $0.lowercased() == trimmed }) else { return }
        profiles[index].allergies.append(trimmed)
        save()
    }

    func removeAllergy(profileId: String, allergen: String) {
        guard let index = profiles.firstIndex(where: { $0.id == profileId }) else { return }
        profiles[index].allergies.removeAll { $0 == allergen }
        save()
    }

    func addIntolerance(profileId: String, allergen: String) {
        let trimmed = allergen.trimmingCharacters(in: .whitespaces).lowercased()
        guard !trimmed.isEmpty else { return }
        guard let index = profiles.firstIndex(where: { $0.id == profileId }) else { return }
        guard !profiles[index].intolerances.contains(where: { $0.lowercased() == trimmed }) else { return }
        profiles[index].intolerances.append(trimmed)
        save()
    }

    func removeIntolerance(profileId: String, allergen: String) {
        guard let index = profiles.firstIndex(where: { $0.id == profileId }) else { return }
        profiles[index].intolerances.removeAll { $0 == allergen }
        save()
    }
}
