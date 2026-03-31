// src/App.jsx
import { useAllergyProfile } from './hooks/useAllergyProfile'
import AllergyProfile from './components/AllergyProfile'
import BarcodeInput from './components/BarcodeInput'
import './App.css'

function App() {
  const { allergens, addAllergen, removeAllergen } = useAllergyProfile()

  return (
    <div className="app">
      <header className="app-header">
        <h1>Allergie Check</h1>
      </header>
      <main className="app-main">
        <AllergyProfile
          allergens={allergens}
          addAllergen={addAllergen}
          removeAllergen={removeAllergen}
        />
        <BarcodeInput allergens={allergens} />
      </main>
    </div>
  )
}

export default App
