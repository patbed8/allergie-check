// AllergieCheckApp.swift — App entry point

import SwiftUI

@main
struct AllergieCheckApp: App {
    @State private var profileStore = ProfileStore()
    @State private var scanHistory = ScanHistoryStore()
    @AppStorage("allergie-check-lang") private var langRaw: String = AppLanguage.fr.rawValue

    private var lang: Binding<AppLanguage> {
        Binding(
            get: { AppLanguage(rawValue: langRaw) ?? .fr },
            set: { langRaw = $0.rawValue }
        )
    }

    var body: some Scene {
        WindowGroup {
            ContentView(profileStore: profileStore, lang: lang)
                .environment(scanHistory)
        }
    }
}

struct ContentView: View {
    let profileStore: ProfileStore
    @Binding var lang: AppLanguage

    private var t: Labels { Labels(lang: lang) }

    var body: some View {
        if !profileStore.loaded {
            ProgressView()
                .frame(maxWidth: .infinity, maxHeight: .infinity)
        } else {
            TabView {
                ScannerView(profileStore: profileStore, lang: lang)
                    .tabItem {
                        Label(t.scannerTab, systemImage: "camera")
                    }

                ProfilesView(profileStore: profileStore, lang: $lang)
                    .tabItem {
                        Label(t.profilesTab, systemImage: "person.2")
                    }
            }
        }
    }
}
