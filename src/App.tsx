import { useState } from 'react'
import { Route } from 'react-router-dom'
import { Header } from './components/layout/Header'
import { SectionBackground } from './components/layout/SectionBackground'
import { SwipeNav } from './components/layout/SwipeNav'
import { Fab } from './components/ui/Fab'
import { QuickAddSheet, type QuickAddKind } from './features/quick-add/QuickAddSheet'
import { HomePage } from './features/home/HomePage'
import { DeadlinesPage } from './features/deadlines/DeadlinesPage'
import { EventsPage } from './features/events/EventsPage'
import { BudgetPage } from './features/budget/BudgetPage'
import { BillsPage } from './features/bills/BillsPage'
import { FamilyPage } from './features/family/FamilyPage'
import { SettingsPage } from './features/settings/SettingsPage'
import { SearchPage } from './features/search/SearchPage'
import { useSection } from './hooks/useSection'
import { useAuth } from './features/auth/AuthContext'
import { LoginPage } from './features/auth/LoginPage'
import { useHousehold } from './features/household/HouseholdContext'
import { OnboardingPage } from './features/household/OnboardingPage'

function App() {
  const { user, loading: authLoading } = useAuth()
  const { loading: householdLoading, household } = useHousehold()

  if (authLoading || (user && householdLoading)) {
    return <div className="min-h-dvh bg-[#050505]" />
  }

  if (!user) {
    return <LoginPage />
  }

  if (!household) {
    return <OnboardingPage />
  }

  return <AppShell />
}

const SECTION_QUICK_ADD_KIND: Partial<Record<string, QuickAddKind>> = {
  deadlines: 'deadline',
  events: 'event',
  budget: 'expense',
  bills: 'bill',
}

function AppShell() {
  const [quickAddOpen, setQuickAddOpen] = useState(false)
  const { meta, colors } = useSection()

  return (
    <div className="relative mx-auto min-h-dvh w-full max-w-[480px] border-x border-white/5">
      <SectionBackground />
      <Header />
      <main>
        <SwipeNav>
          <Route path="/" element={<HomePage />} />
          <Route path="/hataridok" element={<DeadlinesPage />} />
          <Route path="/idopontok" element={<EventsPage />} />
          <Route path="/koltsegvetes" element={<BudgetPage />} />
          <Route path="/szamlak" element={<BillsPage />} />
          <Route path="/csaladtagok" element={<FamilyPage />} />
          <Route path="/beallitasok" element={<SettingsPage />} />
          <Route path="/kereses" element={<SearchPage />} />
        </SwipeNav>
      </main>
      <Fab accent={colors.accent} onClick={() => setQuickAddOpen(true)} />
      <QuickAddSheet
        open={quickAddOpen}
        onClose={() => setQuickAddOpen(false)}
        forcedKind={SECTION_QUICK_ADD_KIND[meta.key] ?? null}
      />
    </div>
  )
}

export default App
