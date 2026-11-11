import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './features/auth/AuthContext'
import { HouseholdProvider } from './features/household/HouseholdContext'
import { DeadlinesProvider } from './features/deadlines/DeadlinesContext'
import { EventsProvider } from './features/events/EventsContext'
import { BudgetProvider } from './features/budget/BudgetContext'
import { BillsProvider } from './features/bills/BillsContext'

// Telepített PWA-ként a régi service worker nem frissíti magát automatikusan
// csak attól, hogy új build kerül ki a szerverre - enélkül a felhasználó a
// régi, cache-elt verziót futtatná tovább új telepítés/manuális törlés nélkül.
if ('serviceWorker' in navigator) {
  let reloaded = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloaded) return
    reloaded = true
    window.location.reload()
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <HouseholdProvider>
          <DeadlinesProvider>
            <EventsProvider>
              <BudgetProvider>
                <BillsProvider>
                  <App />
                </BillsProvider>
              </BudgetProvider>
            </EventsProvider>
          </DeadlinesProvider>
        </HouseholdProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
