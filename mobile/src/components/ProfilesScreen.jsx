import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  StyleSheet,
  Pressable,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { getAllergenSynonyms } from '../utils/allergenDetection'

const COLORS = {
  bg: '#f8fafc',
  card: '#ffffff',
  primary: '#3b82f6',
  danger: '#ef4444',
  border: '#e2e8f0',
  text: '#1e293b',
  muted: '#94a3b8',
  allergyBg: '#fee2e2',
  allergyText: '#991b1b',
  intoleranceBg: '#fef3c7',
  intoleranceText: '#92400e',
}

const LABELS = {
  fr: {
    myProfile: 'Mon profil',
    family: 'Famille',
    language: 'Langue',
    editName: 'Modifier le nom',
    saveName: 'Enregistrer',
    addProfile: 'Ajouter un membre',
    addProfilePlaceholder: 'Nom (ex. Ma femme)',
    save: 'Ajouter',
    deleteProfile: 'Supprimer',
    allergyPlaceholder: 'Ex. arachides, gluten…',
    intolerancePlaceholder: 'Ex. lactose, fructose…',
    noAllergies: 'Aucune allergie configurée.',
    noIntolerances: 'Aucune intolérance configurée.',
    addAllergy: 'Allergie',
    addIntolerance: 'Intolérance',
    allergies: 'Allergies',
    intolerances: 'Intolérances',
    synonymsTitle: 'Noms dérivés',
    synonymsSubtitle: 'FR · EN',
    noFamily: 'Aucun membre de la famille.',
    back: 'Retour',
    deleteConfirmTitle: 'Supprimer',
    deleteConfirmMessage: 'Voulez-vous vraiment supprimer ce profil ?',
    deleteConfirmOk: 'Supprimer',
    deleteConfirmCancel: 'Annuler',
    items: (n) => `${n} élément(s)`,
    members: (n) => `${n} membre(s)`,
  },
  en: {
    myProfile: 'My profile',
    family: 'Family',
    language: 'Language',
    editName: 'Edit name',
    saveName: 'Save',
    addProfile: 'Add a member',
    addProfilePlaceholder: 'Name (e.g. My wife)',
    save: 'Add',
    deleteProfile: 'Delete',
    allergyPlaceholder: 'E.g. peanuts, gluten…',
    intolerancePlaceholder: 'E.g. lactose, fructose…',
    noAllergies: 'No allergies configured.',
    noIntolerances: 'No intolerances configured.',
    addAllergy: 'Allergy',
    addIntolerance: 'Intolerance',
    allergies: 'Allergies',
    intolerances: 'Intolerances',
    synonymsTitle: 'Derived names',
    synonymsSubtitle: 'FR · EN',
    noFamily: 'No family members.',
    back: 'Back',
    deleteConfirmTitle: 'Delete',
    deleteConfirmMessage: 'Are you sure you want to delete this profile?',
    deleteConfirmOk: 'Delete',
    deleteConfirmCancel: 'Cancel',
    items: (n) => `${n} item(s)`,
    members: (n) => `${n} member(s)`,
  },
}

// Modal showing all synonyms for a tapped allergen
function SynonymsModal({ allergen, lang, onClose }) {
  const t = LABELS[lang]
  const synonyms = allergen ? getAllergenSynonyms(allergen) : []

  return (
    <Modal visible={!!allergen} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Pressable style={styles.modalCard} onPress={() => {}}>
          <Text style={styles.modalTitle}>{allergen}</Text>
          <Text style={styles.modalSubtitle}>{t.synonymsTitle} · {t.synonymsSubtitle}</Text>
          <View style={styles.synonymsGrid}>
            {synonyms.map(s => (
              <View key={s} style={styles.synonymChip}>
                <Text style={styles.synonymChipText}>{s}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity style={styles.modalCloseBtn} onPress={onClose}>
            <Ionicons name="close" size={20} color={COLORS.muted} />
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

// Inline text input row that appears when adding allergen/intolerance
function AddItemRow({ placeholder, onSubmit, onCancel }) {
  const [input, setInput] = useState('')

  function handleSubmit() {
    if (!input.trim()) return
    onSubmit(input)
    setInput('')
  }

  return (
    <View style={styles.addItemRow}>
      <TextInput
        style={styles.textInput}
        value={input}
        onChangeText={setInput}
        placeholder={placeholder}
        placeholderTextColor={COLORS.muted}
        returnKeyType="done"
        onSubmitEditing={handleSubmit}
        autoFocus
      />
      <TouchableOpacity onPress={handleSubmit} style={styles.saveBtn}>
        <Ionicons name="checkmark" size={20} color="#fff" />
      </TouchableOpacity>
      <TouchableOpacity onPress={onCancel} style={styles.cancelIconBtn}>
        <Ionicons name="close" size={20} color={COLORS.muted} />
      </TouchableOpacity>
    </View>
  )
}

// Profile detail view (my profile or a family member)
function ProfileDetail({ profile, lang, onUpdateName, onAddAllergy, onRemoveAllergy, onAddIntolerance, onRemoveIntolerance }) {
  const [editingName, setEditingName] = useState(false)
  const [nameInput, setNameInput] = useState(profile.name)
  const [addingType, setAddingType] = useState(null) // 'allergy' | 'intolerance' | null
  const [selectedAllergen, setSelectedAllergen] = useState(null)
  const t = LABELS[lang]

  function handleSaveName() {
    onUpdateName(profile.id, nameInput)
    setEditingName(false)
  }

  function handleAddAllergy(value) {
    onAddAllergy(profile.id, value)
    setAddingType(null)
  }

  function handleAddIntolerance(value) {
    onAddIntolerance(profile.id, value)
    setAddingType(null)
  }

  return (
    <ScrollView contentContainerStyle={styles.detailContent}>
      <SynonymsModal
        allergen={selectedAllergen}
        lang={lang}
        onClose={() => setSelectedAllergen(null)}
      />

      {/* Name */}
      <View style={styles.sectionCard}>
        {editingName ? (
          <View style={styles.addItemRow}>
            <TextInput
              style={styles.textInput}
              value={nameInput}
              onChangeText={setNameInput}
              returnKeyType="done"
              onSubmitEditing={handleSaveName}
              autoFocus
            />
            <TouchableOpacity onPress={handleSaveName} style={styles.saveBtn}>
              <Ionicons name="checkmark" size={20} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setEditingName(false)} style={styles.cancelIconBtn}>
              <Ionicons name="close" size={20} color={COLORS.muted} />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.nameRow} onPress={() => { setNameInput(profile.name); setEditingName(true) }}>
            <Text style={styles.profileNameLarge}>{profile.name}</Text>
            <Ionicons name="pencil-outline" size={18} color={COLORS.muted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Allergies */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionLabel}>{t.allergies}</Text>
        {(profile.allergies || []).length === 0 && addingType !== 'allergy' && (
          <Text style={styles.emptyText}>{t.noAllergies}</Text>
        )}
        <View style={styles.chipsRow}>
          {(profile.allergies || []).map(a => (
            <TouchableOpacity
              key={a}
              style={styles.allergyChip}
              onPress={() => setSelectedAllergen(a)}
              onLongPress={() => onRemoveAllergy(profile.id, a)}
            >
              <Text style={styles.allergyChipText}>{a}</Text>
              <TouchableOpacity
                onPress={() => onRemoveAllergy(profile.id, a)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close-circle" size={16} color={COLORS.allergyText} />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>
        {addingType === 'allergy' ? (
          <AddItemRow
            placeholder={t.allergyPlaceholder}
            onSubmit={handleAddAllergy}
            onCancel={() => setAddingType(null)}
          />
        ) : (
          <TouchableOpacity style={styles.addTypeBtn} onPress={() => setAddingType('allergy')}>
            <Ionicons name="add-circle-outline" size={18} color={COLORS.danger} style={{ marginRight: 6 }} />
            <Text style={[styles.addTypeBtnText, { color: COLORS.danger }]}>{t.addAllergy}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Intolerances */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionLabel}>{t.intolerances}</Text>
        {(profile.intolerances || []).length === 0 && addingType !== 'intolerance' && (
          <Text style={styles.emptyText}>{t.noIntolerances}</Text>
        )}
        <View style={styles.chipsRow}>
          {(profile.intolerances || []).map(a => (
            <TouchableOpacity
              key={a}
              style={styles.intoleranceChip}
              onPress={() => setSelectedAllergen(a)}
              onLongPress={() => onRemoveIntolerance(profile.id, a)}
            >
              <Text style={styles.intoleranceChipText}>{a}</Text>
              <TouchableOpacity
                onPress={() => onRemoveIntolerance(profile.id, a)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close-circle" size={16} color={COLORS.intoleranceText} />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>
        {addingType === 'intolerance' ? (
          <AddItemRow
            placeholder={t.intolerancePlaceholder}
            onSubmit={handleAddIntolerance}
            onCancel={() => setAddingType(null)}
          />
        ) : (
          <TouchableOpacity style={styles.addTypeBtn} onPress={() => setAddingType('intolerance')}>
            <Ionicons name="add-circle-outline" size={18} color="#d97706" style={{ marginRight: 6 }} />
            <Text style={[styles.addTypeBtnText, { color: '#d97706' }]}>{t.addIntolerance}</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  )
}

// Family member list
function FamilyList({ profiles, lang, onSelectProfile, onAddProfile, onRemoveProfile }) {
  const [addingNew, setAddingNew] = useState(false)
  const t = LABELS[lang]

  function handleAdd(name) {
    onAddProfile(name)
    setAddingNew(false)
  }

  function confirmDelete(profileId) {
    Alert.alert(t.deleteConfirmTitle, t.deleteConfirmMessage, [
      { text: t.deleteConfirmCancel, style: 'cancel' },
      { text: t.deleteConfirmOk, style: 'destructive', onPress: () => onRemoveProfile(profileId) },
    ])
  }

  return (
    <ScrollView contentContainerStyle={styles.listContent}>
      {profiles.length === 0 && !addingNew && (
        <Text style={[styles.emptyText, { textAlign: 'center', paddingVertical: 24 }]}>
          {t.noFamily}
        </Text>
      )}

      {profiles.length > 0 && (
        <View style={styles.listCard}>
          {profiles.map((profile, index) => (
            <View key={profile.id}>
              <TouchableOpacity
                style={styles.listItem}
                onPress={() => onSelectProfile(profile)}
              >
                <View style={styles.listItemIcon}>
                  <Ionicons name="person-outline" size={18} color={COLORS.primary} />
                </View>
                <View style={styles.listItemContent}>
                  <Text style={styles.listItemLabel}>{profile.name}</Text>
                  <Text style={styles.listItemSub}>
                    {t.items((profile.allergies || []).length + (profile.intolerances || []).length)}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => confirmDelete(profile.id)}
                  style={styles.deleteIconBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
                </TouchableOpacity>
                <Ionicons name="chevron-forward" size={16} color={COLORS.muted} />
              </TouchableOpacity>
              {index < profiles.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>
      )}

      {addingNew ? (
        <AddItemRow
          placeholder={t.addProfilePlaceholder}
          onSubmit={handleAdd}
          onCancel={() => setAddingNew(false)}
        />
      ) : (
        <TouchableOpacity style={styles.addProfileBtn} onPress={() => setAddingNew(true)}>
          <Ionicons name="person-add-outline" size={18} color={COLORS.primary} style={{ marginRight: 8 }} />
          <Text style={styles.addProfileBtnText}>{t.addProfile}</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  )
}

// Main screen
export default function ProfilesScreen({
  profiles,
  addProfile,
  removeProfile,
  updateProfileName,
  addAllergy,
  removeAllergy,
  addIntolerance,
  removeIntolerance,
  lang,
  setLang,
}) {
  // Stack: each entry is { screen: 'main'|'me'|'family'|'familyProfile', profile?: object }
  const [stack, setStack] = useState([{ screen: 'main' }])
  const t = LABELS[lang]

  const current = stack[stack.length - 1]

  function push(entry) {
    setStack(prev => [...prev, entry])
  }

  function pop() {
    setStack(prev => prev.length > 1 ? prev.slice(0, -1) : prev)
  }

  const myProfile = profiles[0]
  const familyProfiles = profiles.slice(1)

  // Resolve the profile for familyProfile screen using live profiles data
  const activeFamilyProfile = current.screen === 'familyProfile'
    ? profiles.find(p => p.id === current.profileId)
    : null

  function renderScreen() {
    if (current.screen === 'main') {
      return (
        <ScrollView contentContainerStyle={styles.listContent}>
          <View style={styles.listCard}>
            {/* My profile */}
            <TouchableOpacity style={styles.listItem} onPress={() => push({ screen: 'me' })}>
              <View style={styles.listItemIcon}>
                <Ionicons name="person-outline" size={18} color={COLORS.primary} />
              </View>
              <View style={styles.listItemContent}>
                <Text style={styles.listItemLabel}>{myProfile?.name || t.myProfile}</Text>
                <Text style={styles.listItemSub}>
                  {t.items((myProfile?.allergies || []).length + (myProfile?.intolerances || []).length)}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={COLORS.muted} />
            </TouchableOpacity>

            <View style={styles.divider} />

            {/* Family */}
            <TouchableOpacity style={styles.listItem} onPress={() => push({ screen: 'family' })}>
              <View style={styles.listItemIcon}>
                <Ionicons name="people-outline" size={18} color={COLORS.primary} />
              </View>
              <View style={styles.listItemContent}>
                <Text style={styles.listItemLabel}>{t.family}</Text>
                <Text style={styles.listItemSub}>{t.members(familyProfiles.length)}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={COLORS.muted} />
            </TouchableOpacity>
          </View>
        </ScrollView>
      )
    }

    if (current.screen === 'me' && myProfile) {
      return (
        <ProfileDetail
          profile={myProfile}
          lang={lang}
          onUpdateName={updateProfileName}
          onAddAllergy={addAllergy}
          onRemoveAllergy={removeAllergy}
          onAddIntolerance={addIntolerance}
          onRemoveIntolerance={removeIntolerance}
        />
      )
    }

    if (current.screen === 'family') {
      return (
        <FamilyList
          profiles={familyProfiles}
          lang={lang}
          onSelectProfile={profile => push({ screen: 'familyProfile', profileId: profile.id })}
          onAddProfile={addProfile}
          onRemoveProfile={removeProfile}
        />
      )
    }

    if (current.screen === 'familyProfile') {
      if (!activeFamilyProfile) {
        // Profile was deleted — go back to family list
        setTimeout(pop, 0)
        return null
      }
      return (
        <ProfileDetail
          profile={activeFamilyProfile}
          lang={lang}
          onUpdateName={updateProfileName}
          onAddAllergy={addAllergy}
          onRemoveAllergy={removeAllergy}
          onAddIntolerance={addIntolerance}
          onRemoveIntolerance={removeIntolerance}
        />
      )
    }

    return null
  }

  function getTitle() {
    if (current.screen === 'main') return null
    if (current.screen === 'me') return myProfile?.name || t.myProfile
    if (current.screen === 'family') return t.family
    if (current.screen === 'familyProfile') return activeFamilyProfile?.name || ''
    return null
  }

  const title = getTitle()

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        {stack.length > 1 ? (
          <TouchableOpacity style={styles.backBtn} onPress={pop}>
            <Ionicons name="chevron-back" size={22} color={COLORS.primary} />
            <Text style={styles.backBtnText}>{t.back}</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.backBtn} />
        )}
        <Text style={styles.headerTitle} numberOfLines={1}>
          {title || ''}
        </Text>
        <View style={styles.langPills}>
          <TouchableOpacity
            style={[styles.langPill, lang === 'fr' && styles.langPillActive]}
            onPress={() => setLang('fr')}
          >
            <Text style={[styles.langPillText, lang === 'fr' && styles.langPillTextActive]}>FR</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.langPill, lang === 'en' && styles.langPillActive]}
            onPress={() => setLang('en')}
          >
            <Text style={[styles.langPillText, lang === 'en' && styles.langPillTextActive]}>EN</Text>
          </TouchableOpacity>
        </View>
      </View>

      {renderScreen()}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 70,
  },
  backBtnText: {
    fontSize: 16,
    color: COLORS.primary,
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
  },
  langPills: {
    flexDirection: 'row',
    gap: 4,
    minWidth: 70,
    justifyContent: 'flex-end',
  },
  langPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  langPillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  langPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
  },
  langPillTextActive: {
    color: '#ffffff',
  },
  listContent: {
    padding: 16,
    gap: 16,
  },
  listCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  listItemIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listItemContent: {
    flex: 1,
    gap: 2,
  },
  listItemLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
  },
  listItemSub: {
    fontSize: 13,
    color: COLORS.muted,
  },
  deleteIconBtn: {
    padding: 4,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginLeft: 64,
  },
  detailContent: {
    padding: 16,
    gap: 12,
  },
  sectionCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  profileNameLarge: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.muted,
    fontStyle: 'italic',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  allergyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.allergyBg,
    borderRadius: 20,
    paddingVertical: 5,
    paddingLeft: 10,
    paddingRight: 6,
    gap: 4,
  },
  allergyChipText: {
    fontSize: 14,
    color: COLORS.allergyText,
    fontWeight: '500',
  },
  intoleranceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.intoleranceBg,
    borderRadius: 20,
    paddingVertical: 5,
    paddingLeft: 10,
    paddingRight: 6,
    gap: 4,
  },
  intoleranceChipText: {
    fontSize: 14,
    color: COLORS.intoleranceText,
    fontWeight: '500',
  },
  addTypeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  addTypeBtnText: {
    fontSize: 15,
    fontWeight: '500',
  },
  addItemRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
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
  saveBtn: {
    width: 44,
    height: 44,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.card,
  },
  addProfileBtn: {
    flexDirection: 'row',
    height: 48,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: 10,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addProfileBtnText: {
    fontSize: 15,
    color: COLORS.primary,
    fontWeight: '500',
  },
  // Synonyms modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  modalCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    gap: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    textTransform: 'capitalize',
    paddingRight: 32,
  },
  modalSubtitle: {
    fontSize: 13,
    color: COLORS.muted,
    fontWeight: '500',
  },
  synonymsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  synonymChip: {
    backgroundColor: COLORS.bg,
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  synonymChipText: {
    fontSize: 14,
    color: COLORS.text,
  },
  modalCloseBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
