import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './LandingPage';
import TeamHome from './pages/TeamHome';
import PNLCalendar from './pages/PNLCalendar';
import NarrativeBoard from './pages/NarrativeBoard';
import RiskManager from './pages/RiskManager';
import KabalKredo from './pages/KabalKredo';
import WarRoom from './pages/WarRoom';
import CRMAngel from './pages/CRMAngel';
import SprintBoard from './pages/SprintBoard';
import OpsBoard from './pages/OpsBoard';
import Arsenal from './pages/Arsenal';
import DieInTheJungle from './pages/DieInTheJungle';
import DieInTheJunglePromo from './pages/DieInTheJunglePromo';
import DieInTheJungleAdmin from './pages/DieInTheJungleAdmin';
import DieInTheJungleVisualGuide from './pages/DieInTheJungleVisualGuide';
import KabalAcademyMVP from './pages/KabalAcademyMVP';
import KabalAcademyAdmin from './pages/KabalAcademyAdmin';
import TrackRecord from './pages/TrackRecord';
import TrophyRoom from './pages/TrophyRoom';
import KabalCheckout from './pages/KabalCheckout';
import TelegramMiniApp from './pages/TelegramMiniApp';
import AngelOpsDashboard from './pages/AngelOpsDashboard';
import CoinFactory from './pages/CoinFactory';
import SignalBoard from './pages/SignalBoard';
import KKMDashboard from './pages/KKMDashboard';
import AuthGate from './components/AuthGate';
import WeeklyReport from './pages/WeeklyReport';
import PriceAlerts from './pages/PriceAlerts';

const isTeamContext =
  typeof window !== 'undefined' &&
  (
    window.location.hostname.startsWith('team.') ||
    ['localhost', '127.0.0.1'].includes(window.location.hostname) ||
    window.location.pathname.startsWith('/finance/') ||
    window.location.pathname.startsWith('/telegram/')
  );

export default function App() {
  if (isTeamContext) {
    return (
      <AuthGate>
      <BrowserRouter>
        <Routes>
          {/* Home */}
          <Route path="/"                         element={<TeamHome />} />

          {/* TRADING */}
          <Route path="/finance/pnl-calendar"     element={<PNLCalendar />} />
          <Route path="/finance/track-record"     element={<TrackRecord />} />
          <Route path="/narrative-board"          element={<NarrativeBoard />} />
          <Route path="/risk-manager"             element={<RiskManager />} />
          <Route path="/trading/kredo"            element={<KabalKredo />} />

          {/* FINANCES */}
          <Route path="/war-room"                 element={<WarRoom />} />

          {/* SALES */}
          <Route path="/crm-angel"                element={<CRMAngel />} />
          <Route path="/finance/angel-ops"        element={<AngelOpsDashboard />} />
          <Route path="/telegram/angel-ops"       element={<AngelOpsDashboard />} />

          {/* INTERNAL */}
          <Route path="/sprint-board"             element={<SprintBoard />} />
          <Route path="/ops-board"               element={<OpsBoard />} />
          <Route path="/coin-factory"             element={<CoinFactory />} />
          <Route path="/signal-board"             element={<SignalBoard />} />
          <Route path="/kkm-dashboard"            element={<KKMDashboard />} />
          <Route path="/weekly-report"            element={<WeeklyReport />} />
          <Route path="/price-alerts"             element={<PriceAlerts />} />

          {/* ARSENAL */}
          <Route path="/arsenal"                  element={<Arsenal />} />

          {/* ACADEMY */}
          <Route path="/academy"                  element={<KabalAcademyMVP />} />
          <Route path="/academy/admin"            element={<KabalAcademyAdmin />} />
          <Route path="/academy/checkout"         element={<KabalCheckout />} />
          <Route path="/telegram-miniapp"          element={<TelegramMiniApp />} />

          {/* Die in the Jungle */}
          <Route path="/diejungle"                element={<DieInTheJungle />} />
          <Route path="/diejungle/promo"          element={<DieInTheJunglePromo />} />
          <Route path="/diejungle/admin"          element={<DieInTheJungleAdmin />} />

          {/* Fallback */}
          <Route path="*"                         element={<TeamHome />} />
        </Routes>
      </BrowserRouter>
      </AuthGate>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/diejungle" element={<DieInTheJungle />} />
        <Route path="/diejungle/promo" element={<DieInTheJunglePromo />} />
        <Route path="/diejungle/admin" element={<DieInTheJungleAdmin />} />
        <Route path="/diejungle-visual-guide" element={<DieInTheJungleVisualGuide />} />
        <Route path="/trophy-room" element={<TrophyRoom />} />
        <Route path="/telegram-miniapp" element={<TelegramMiniApp />} />
        <Route path="*"          element={<LandingPage />} />
      </Routes>
    </BrowserRouter>
  );
}
