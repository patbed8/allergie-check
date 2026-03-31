import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const COLORS = {
  safe: '#22c55e',
  danger: '#ef4444',
  bg: '#f8fafc',
  card: '#ffffff',
  primary: '#3b82f6',
  border: '#e2e8f0',
  text: '#1e293b',
  muted: '#94a3b8',
}

const LABELS = {
  fr: {
    language: 'Langue / Language',
    addProfile: 'Nouveau profil',
    addProfilePlaceholder: 'Nom du profil (ex. Ma femme)',
    addBtn: 'Ajouter',
    deleteProfile: 'Supprimer ce profil',
    allergenPlaceholder: 'Ex. arachides, gluten…',
    noAllergens: 'Aucun allergène configuré.',
    removeAllergenPrefix: 'Supprimer',
  },
  en: {
    language: 'Language / Langue',
    addProfile: 'New profile',
    addProfilePlaceholder: 'Profile name (e.g. My wife)',
    addBtn: 'Add',
    deleteProfile: 'Delete this profile',
    allergenPlaceholder: 'E.g. peanuts, gluten…',
    noAllergens: 'No allergens configured.',
    removeAllergenPrefix: 'Remove',
  },
}

function ProfileCard({ profile, lang, onRemoveProfile, onAddAllergen, onRemoveAllergen, canDelete }) {
  const [input, setInput] = useState('')
  const t = LABELS[lang]

  function handleSubmit() {
    if (!input.trim()) return
    onAddAllergen(profile.id, input)
    setInput('')
  }

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardName}>{profile.name}</Text>
        {canDelete && (
          <TouchableOpacity
            onPress={() => onRemoveProfile(profile.id)}
            style={styles.deleteBtn}
            accessibilityLabel={t.deleteProfile}
          >
            <Text style={styles.deleteBtnText}>×</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.inputRow}>
        <TextInput
          style={styles.textInput}
          value={input}
          onChangeText={setInput}
          placeholder={t.allergenPlaceholder}
          placeholderTextColor={COLORS.muted}
          returnKeyType="done"
          onSubmitEditing={handleSubmit}
          accessibilityLabel={t.allergenPlaceholder}
        />
        <TouchableOpacity onPress={handleSubmit} style={styles.addBtn}>
          <Text style={styles.addBtnText}>{t.addBtn}</Text>
        </TouchableOpacity>
      </View>

      {profile.allergens.length === 0 ? (
        <Text style={styles.mutedText}>{t.noAllergens}</Text>
      ) : (
        <View style={styles.chipsRow}>
          {profile.allergens.map(allergen => (
            <View key={allergen} style={styles.chip}>
              <Text style={styles.chipText}>{allergen}</Text>
              <TouchableOpacity
                onPress={() => onRemoveAllergen(profile.id, allergen)}
                accessibilityLabel={`${t.removeAllergenPrefix} ${allergen}`}
              >
                <Text style={styles.chipRemove}>×</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </View>
  )
}

export default function ProfilesScreen({ profiles, addProfile, removeProfile, addAllergen, removeAllergen, lang, setLang }) {
  const [newProfileInput, setNewProfileInput] = useState('')
  const [showNewProfileForm, setShowNewProfileForm] = useState(false)
  const t = LABELS[lang]

  function handleAddProfile() {
    if (!newProfileInput.trim()) return
    addProfile(newProfileInput)
    setNewProfileInput('')
    setShowNewProfileForm(false)
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.langRow}>
          <Text style={styles.langLabel}>{t.language}</Text>
          <View style={styles.langPills}>
            <TouchableOpacity
              style={[styles.langPill, lang === 'fr' && styles.langPillActive]}
              onPress={() => setLang('fr')}
            >
              <Text style={[styles.langPillText, lang === 'fr' && styles.langPillTextActive]}>
                Français
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.langPill, lang === 'en' && styles.langPillActive]}
              onPress={() => setLang('en')}
            >
              <Text style={[styles.langPillText, lang === 'en' && styles.langPillTextActive]}>
                English
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {profiles.map(profile => (
          <ProfileCard
            key={profile.id}
            profile={profile}
            lang={lang}
            onRemoveProfile={removeProfile}
            onAddAllergen={addAllergen}
            onRemoveAllergen={removeAllergen}
            canDelete={profiles.length > 1}
          />
        ))}

        {showNewProfileForm ? (
          <View style={styles.newProfileForm}>
            <TextInput
              style={styles.textInput}
              value={newProfileInput}
              onChangeText={setNewProfileInput}
              placeholder={t.addProfilePlaceholder}
              placeholderTextColor={COLORS.muted}
              returnKeyType="done"
              onSubmitEditing={handleAddProfile}
              autoFocus
            />
            <TouchableOpacity onPress={handleAddProfile} style={styles.addBtn}>
              <Text style={styles.addBtnText}>{t.addBtn}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.addProfileBtn}
            onPress={() => setShowNewProfileForm(true)}
          >
            <Text style={styles.addProfileBtnText}>+ {t.addProfile}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scrollContent: {
    padding: 16,
    gap: 12,
  },
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  langLabel: {
    fontSize: 14,
    color: COLORS.muted,
  },
  langPills: {
    flexDirection: 'row',
    gap: 8,
  },
  langPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  langPillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  langPillText: {
    fontSize: 13,
    color: COLORS.text,
  },
  langPillTextActive: {
    color: '#ffffff',
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardName: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.text,
  },
  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnText: {
    fontSize: 18,
    color: COLORS.danger,
    lineHeight: 20,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  textInput: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 15,
    color: COLORS.text,
    backgroundColor: COLORS.bg,
  },
  addBtn: {
    height: 44,
    paddingHorizontal: 16,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '500',
  },
  mutedText: {
    fontSize: 14,
    color: COLORS.muted,
    fontStyle: 'italic',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    borderRadius: 20,
    paddingVertical: 4,
    paddingLeft: 10,
    paddingRight: 6,
    gap: 4,
  },
  chipText: {
    fontSize: 14,
    color: COLORS.primary,
  },
  chipRemove: {
    fontSize: 16,
    color: COLORS.primary,
    lineHeight: 18,
  },
  newProfileForm: {
    flexDirection: 'row',
    gap: 8,
  },
  addProfileBtn: {
    height: 48,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: 10,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  addProfileBtnText: {
    fontSize: 15,
    color: COLORS.primary,
    fontWeight: '500',
  },
})
