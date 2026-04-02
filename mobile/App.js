import { NavigationContainer } from '@react-navigation/native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { View, ActivityIndicator } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useProfiles } from './src/hooks/useProfiles'
import { useLanguage } from './src/hooks/useLanguage'
import ScannerScreen from './src/components/ScannerScreen'
import ProfilesScreen from './src/components/ProfilesScreen'

const Tab = createBottomTabNavigator()

const NAV_LABELS = {
  fr: { scanner: 'Scanner', profiles: 'Profils' },
  en: { scanner: 'Scanner', profiles: 'Profiles' },
}

export default function App() {
  const {
    profiles,
    addProfile,
    removeProfile,
    updateProfileName,
    addAllergy,
    removeAllergy,
    addIntolerance,
    removeIntolerance,
    loaded,
  } = useProfiles()
  const { lang, setLang } = useLanguage()

  if (!loaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' }}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    )
  }

  const nav = NAV_LABELS[lang]

  return (
    <NavigationContainer>
      <Tab.Navigator
        initialRouteName="Scanner"
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: '#3b82f6',
          tabBarInactiveTintColor: '#94a3b8',
          tabBarStyle: { backgroundColor: '#ffffff' },
          tabBarIcon: ({ color, size }) => {
            const icon = route.name === 'Scanner' ? 'camera-outline' : 'people-outline'
            return <Ionicons name={icon} size={size} color={color} />
          },
        })}
      >
        <Tab.Screen name="Scanner" options={{ title: nav.scanner }}>
          {() => <ScannerScreen profiles={profiles} lang={lang} />}
        </Tab.Screen>
        <Tab.Screen name="Profiles" options={{ title: nav.profiles }}>
          {() => (
            <ProfilesScreen
              profiles={profiles}
              addProfile={addProfile}
              removeProfile={removeProfile}
              updateProfileName={updateProfileName}
              addAllergy={addAllergy}
              removeAllergy={removeAllergy}
              addIntolerance={addIntolerance}
              removeIntolerance={removeIntolerance}
              lang={lang}
              setLang={setLang}
            />
          )}
        </Tab.Screen>
      </Tab.Navigator>
    </NavigationContainer>
  )
}
