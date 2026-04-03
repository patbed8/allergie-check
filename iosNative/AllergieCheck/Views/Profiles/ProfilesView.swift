// ProfilesView.swift — Profiles tab: navigation, list, detail, family, synonyms

import SwiftUI

struct ProfilesView: View {
    @Bindable var profileStore: ProfileStore
    @Binding var lang: AppLanguage

    @State private var path: [ProfileRoute] = []

    private var t: Labels { Labels(lang: lang) }

    enum ProfileRoute: Hashable {
        case me
        case family
        case familyMember(String) // profile id
    }

    var body: some View {
        NavigationStack(path: $path) {
            mainListView
                .navigationDestination(for: ProfileRoute.self) { route in
                    switch route {
                    case .me:
                        if let profile = profileStore.myProfile {
                            ProfileDetailView(profile: profile, profileStore: profileStore, lang: lang)
                                .navigationTitle(profile.name)
                                .navigationBarTitleDisplayMode(.inline)
                        }
                    case .family:
                        FamilyListView(profileStore: profileStore, lang: lang) { profileId in
                            path.append(.familyMember(profileId))
                        }
                        .navigationTitle(t.family)
                        .navigationBarTitleDisplayMode(.inline)
                    case .familyMember(let id):
                        if let profile = profileStore.profiles.first(where: { $0.id == id }) {
                            ProfileDetailView(profile: profile, profileStore: profileStore, lang: lang)
                                .navigationTitle(profile.name)
                                .navigationBarTitleDisplayMode(.inline)
                        } else {
                            // Profile was deleted — empty view triggers back
                            Color.clear.onAppear { path.removeLast() }
                        }
                    }
                }
        }
    }

    // MARK: - Main list

    private var mainListView: some View {
        List {
            Section {
                // My profile
                Button {
                    path.append(.me)
                } label: {
                    HStack(spacing: 12) {
                        Image(systemName: "person")
                            .foregroundStyle(.blue)
                            .frame(width: 36, height: 36)
                            .background(Color.blue.opacity(0.1))
                            .clipShape(RoundedRectangle(cornerRadius: 8))

                        VStack(alignment: .leading, spacing: 2) {
                            Text(profileStore.myProfile?.name ?? t.myProfile)
                                .fontWeight(.medium)
                            Text(t.items(profileStore.myProfile?.itemCount ?? 0))
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }

                        Spacer()
                        Image(systemName: "chevron.right")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }
                .foregroundStyle(Color(.label))

                // Family
                Button {
                    path.append(.family)
                } label: {
                    HStack(spacing: 12) {
                        Image(systemName: "person.2")
                            .foregroundStyle(.blue)
                            .frame(width: 36, height: 36)
                            .background(Color.blue.opacity(0.1))
                            .clipShape(RoundedRectangle(cornerRadius: 8))

                        VStack(alignment: .leading, spacing: 2) {
                            Text(t.family)
                                .fontWeight(.medium)
                            Text(t.members(profileStore.familyProfiles.count))
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }

                        Spacer()
                        Image(systemName: "chevron.right")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }
                .foregroundStyle(Color(.label))
            }
        }
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                HStack(spacing: 4) {
                    ForEach(AppLanguage.allCases, id: \.self) { l in
                        Button {
                            lang = l
                        } label: {
                            Text(l.rawValue.uppercased())
                                .font(.caption)
                                .fontWeight(.semibold)
                                .padding(.horizontal, 10)
                                .padding(.vertical, 4)
                                .background(lang == l ? Color.blue : Color.clear)
                                .foregroundStyle(lang == l ? .white : .primary)
                                .clipShape(Capsule())
                                .overlay(
                                    Capsule().stroke(lang == l ? Color.blue : Color(.separator), lineWidth: 1)
                                )
                        }
                    }
                }
            }
        }
    }
}

// MARK: - Profile Detail View

struct ProfileDetailView: View {
    let profile: Profile
    @Bindable var profileStore: ProfileStore
    let lang: AppLanguage

    @State private var editingName = false
    @State private var nameInput = ""
    @State private var addingType: AddingType? = nil
    @State private var newItemInput = ""
    @State private var selectedAllergen: String? = nil

    private var t: Labels { Labels(lang: lang) }

    enum AddingType { case allergy, intolerance }

    // Get the live profile from the store
    private var liveProfile: Profile {
        profileStore.profiles.first(where: { $0.id == profile.id }) ?? profile
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 12) {
                // Name section
                GroupBox {
                    if editingName {
                        HStack {
                            TextField(t.editName, text: $nameInput)
                                .textFieldStyle(.roundedBorder)
                                .onSubmit { saveName() }

                            Button { saveName() } label: {
                                Image(systemName: "checkmark")
                            }
                            .buttonStyle(.borderedProminent)
                            .controlSize(.small)

                            Button { editingName = false } label: {
                                Image(systemName: "xmark")
                            }
                            .buttonStyle(.bordered)
                            .controlSize(.small)
                        }
                    } else {
                        Button {
                            nameInput = liveProfile.name
                            editingName = true
                        } label: {
                            HStack {
                                Text(liveProfile.name)
                                    .font(.title2)
                                    .fontWeight(.bold)
                                    .foregroundStyle(Color(.label))
                                Spacer()
                                Image(systemName: "pencil")
                                    .foregroundStyle(.secondary)
                            }
                        }
                    }
                }

                // Allergies section
                GroupBox {
                    VStack(alignment: .leading, spacing: 10) {
                        Text(t.allergies)
                            .font(.caption)
                            .fontWeight(.semibold)
                            .foregroundStyle(.secondary)
                            .textCase(.uppercase)

                        if liveProfile.allergies.isEmpty && addingType != .allergy {
                            Text(t.noAllergies)
                                .font(.subheadline)
                                .foregroundStyle(.secondary)
                                .italic()
                        }

                        FlowLayout(spacing: 8) {
                            ForEach(liveProfile.allergies, id: \.self) { allergen in
                                allergyChip(allergen, type: .allergy)
                            }
                        }

                        if addingType == .allergy {
                            addItemRow {
                                profileStore.addAllergy(profileId: profile.id, allergen: newItemInput)
                                newItemInput = ""
                                addingType = nil
                            }
                        } else {
                            Button {
                                addingType = .allergy
                                newItemInput = ""
                            } label: {
                                Label(t.addAllergy, systemImage: "plus.circle")
                                    .font(.subheadline)
                                    .foregroundStyle(.red)
                            }
                        }
                    }
                }

                // Intolerances section
                GroupBox {
                    VStack(alignment: .leading, spacing: 10) {
                        Text(t.intolerances)
                            .font(.caption)
                            .fontWeight(.semibold)
                            .foregroundStyle(.secondary)
                            .textCase(.uppercase)

                        if liveProfile.intolerances.isEmpty && addingType != .intolerance {
                            Text(t.noIntolerances)
                                .font(.subheadline)
                                .foregroundStyle(.secondary)
                                .italic()
                        }

                        FlowLayout(spacing: 8) {
                            ForEach(liveProfile.intolerances, id: \.self) { allergen in
                                allergyChip(allergen, type: .intolerance)
                            }
                        }

                        if addingType == .intolerance {
                            addItemRow {
                                profileStore.addIntolerance(profileId: profile.id, allergen: newItemInput)
                                newItemInput = ""
                                addingType = nil
                            }
                        } else {
                            Button {
                                addingType = .intolerance
                                newItemInput = ""
                            } label: {
                                Label(t.addIntolerance, systemImage: "plus.circle")
                                    .font(.subheadline)
                                    .foregroundStyle(.orange)
                            }
                        }
                    }
                }
            }
            .padding(16)
        }
        .background(Color(.systemGroupedBackground))
        .sheet(item: $selectedAllergen) { allergen in
            SynonymsSheet(allergen: allergen, lang: lang)
                .presentationDetents([.medium])
        }
    }

    private func saveName() {
        profileStore.updateProfileName(id: profile.id, name: nameInput)
        editingName = false
    }

    private func allergyChip(_ allergen: String, type: AddingType) -> some View {
        let isAllergy = type == .allergy
        return Button {
            selectedAllergen = allergen
        } label: {
            HStack(spacing: 4) {
                Text(allergen)
                    .font(.subheadline)
                    .fontWeight(.medium)

                Button {
                    if isAllergy {
                        profileStore.removeAllergy(profileId: profile.id, allergen: allergen)
                    } else {
                        profileStore.removeIntolerance(profileId: profile.id, allergen: allergen)
                    }
                } label: {
                    Image(systemName: "xmark.circle.fill")
                        .font(.caption)
                }
            }
            .padding(.vertical, 5)
            .padding(.leading, 10)
            .padding(.trailing, 6)
            .background(isAllergy ? Color.red.opacity(0.1) : Color.orange.opacity(0.1))
            .foregroundStyle(isAllergy ? .red : .orange)
            .clipShape(Capsule())
        }
    }

    private func addItemRow(onSubmit: @escaping () -> Void) -> some View {
        HStack(spacing: 8) {
            TextField(addingType == .allergy ? t.allergyPlaceholder : t.intolerancePlaceholder,
                      text: $newItemInput)
                .textFieldStyle(.roundedBorder)
                .onSubmit {
                    guard !newItemInput.trimmingCharacters(in: .whitespaces).isEmpty else { return }
                    onSubmit()
                }

            Button {
                guard !newItemInput.trimmingCharacters(in: .whitespaces).isEmpty else { return }
                onSubmit()
            } label: {
                Image(systemName: "checkmark")
            }
            .buttonStyle(.borderedProminent)
            .controlSize(.small)

            Button { addingType = nil } label: {
                Image(systemName: "xmark")
            }
            .buttonStyle(.bordered)
            .controlSize(.small)
        }
    }
}

// MARK: - Family List View

struct FamilyListView: View {
    @Bindable var profileStore: ProfileStore
    let lang: AppLanguage
    let onSelectProfile: (String) -> Void

    @State private var addingNew = false
    @State private var newName = ""
    @State private var profileToDelete: Profile? = nil

    private var t: Labels { Labels(lang: lang) }

    var body: some View {
        List {
            if profileStore.familyProfiles.isEmpty && !addingNew {
                Text(t.noFamily)
                    .foregroundStyle(.secondary)
                    .italic()
                    .frame(maxWidth: .infinity)
                    .listRowBackground(Color.clear)
            }

            ForEach(profileStore.familyProfiles) { profile in
                Button {
                    onSelectProfile(profile.id)
                } label: {
                    HStack(spacing: 12) {
                        Image(systemName: "person")
                            .foregroundStyle(.blue)
                            .frame(width: 36, height: 36)
                            .background(Color.blue.opacity(0.1))
                            .clipShape(RoundedRectangle(cornerRadius: 8))

                        VStack(alignment: .leading, spacing: 2) {
                            Text(profile.name)
                                .fontWeight(.medium)
                                .foregroundStyle(Color(.label))
                            Text(t.items(profile.itemCount))
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }

                        Spacer()

                        Button {
                            profileToDelete = profile
                        } label: {
                            Image(systemName: "trash")
                                .foregroundStyle(.red)
                        }
                        .buttonStyle(.plain)

                        Image(systemName: "chevron.right")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }
            }

            if addingNew {
                HStack(spacing: 8) {
                    TextField(t.addProfilePlaceholder, text: $newName)
                        .textFieldStyle(.roundedBorder)
                        .onSubmit { submitNewProfile() }

                    Button { submitNewProfile() } label: {
                        Image(systemName: "checkmark")
                    }
                    .buttonStyle(.borderedProminent)
                    .controlSize(.small)
                    .disabled(newName.trimmingCharacters(in: .whitespaces).isEmpty)

                    Button { addingNew = false } label: {
                        Image(systemName: "xmark")
                    }
                    .buttonStyle(.bordered)
                    .controlSize(.small)
                }
            }
        }
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                if !addingNew {
                    Button {
                        newName = ""
                        addingNew = true
                    } label: {
                        Image(systemName: "person.badge.plus")
                    }
                }
            }
        }
        .alert(t.deleteConfirmTitle, isPresented: Binding(
            get: { profileToDelete != nil },
            set: { if !$0 { profileToDelete = nil } }
        )) {
            Button(t.deleteConfirmCancel, role: .cancel) { profileToDelete = nil }
            Button(t.deleteConfirmOk, role: .destructive) {
                if let profile = profileToDelete {
                    profileStore.removeProfile(id: profile.id)
                    profileToDelete = nil
                }
            }
        } message: {
            Text(t.deleteConfirmMessage)
        }
    }

    private func submitNewProfile() {
        let trimmed = newName.trimmingCharacters(in: .whitespaces)
        guard !trimmed.isEmpty else { return }
        profileStore.addProfile(name: trimmed)
        newName = ""
        addingNew = false
    }
}

// MARK: - Synonyms Sheet

struct SynonymsSheet: View {
    let allergen: String
    let lang: AppLanguage
    @Environment(\.dismiss) private var dismiss

    private var t: Labels { Labels(lang: lang) }
    private var synonyms: [String] { getAllergenSynonyms(for: allergen) }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 12) {
                    Text(allergen)
                        .font(.title2)
                        .fontWeight(.bold)
                        .textCase(.none)

                    Text("\(t.synonymsTitle) · \(t.synonymsSubtitle)")
                        .font(.caption)
                        .foregroundStyle(.secondary)

                    FlowLayout(spacing: 8) {
                        ForEach(synonyms, id: \.self) { synonym in
                            Text(synonym)
                                .font(.subheadline)
                                .padding(.horizontal, 12)
                                .padding(.vertical, 5)
                                .background(Color(.secondarySystemGroupedBackground))
                                .clipShape(Capsule())
                                .overlay(Capsule().stroke(Color(.separator), lineWidth: 0.5))
                        }
                    }
                }
                .padding(24)
            }
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button { dismiss() } label: {
                        Image(systemName: "xmark.circle.fill")
                            .foregroundStyle(.secondary)
                    }
                }
            }
        }
    }
}

// Make String identifiable for .sheet(item:)
extension String: @retroactive Identifiable {
    public var id: String { self }
}
