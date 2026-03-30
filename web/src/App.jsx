// src/App.jsx
import BarcodeInput from './components/BarcodeInput'
import './App.css'

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>Allergie Check</h1>
      </header>
      <main className="app-main">
        <BarcodeInput />
      </main>
    </div>
  )
}

export default App
