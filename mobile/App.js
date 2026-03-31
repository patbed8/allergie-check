import { Text } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
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
  const { profiles, addProfile, removeProfile, addAllergen, removeAllergen, loaded } = useProfiles()
  const { lang, setLang } = useLanguage()

  if (!loaded) return null

  const nav = NAV_LABELS[lang]

  return (
    <NavigationContainer>
      <Tab.Navigator
        initialRouteName="Scanner"
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#3b82f6',
          tabBarInactiveTintColor: '#94a3b8',
          tabBarStyle: { backgroundColor: '#ffffff' },
        }}
      >
        <Tab.Screen
          name="Scanner"
          options={{
            title: nav.scanner,
            tabBarIcon: () => <Text style={{ fontSize: 20 }}>📷</Text>,
          }}
        >
          {() => <ScannerScreen profiles={profiles} lang={lang} />}
        </Tab.Screen>
        <Tab.Screen
          name="Profiles"
          options={{
            title: nav.profiles,
            tabBarIcon: () => <Text style={{ fontSize: 20 }}>👤</Text>,
          }}
        >
          {() => (
            <ProfilesScreen
              profiles={profiles}
              addProfile={addProfile}
              removeProfile={removeProfile}
              addAllergen={addAllergen}
              removeAllergen={removeAllergen}
              lang={lang}
              setLang={setLang}
            />
          )}
        </Tab.Screen>
      </Tab.Navigator>
    </NavigationContainer>
  )
}
