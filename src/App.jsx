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
import Arsenal from './pages/Arsenal';
import DieInTheJungle from './pages/DieInTheJungle';
import KabalAcademyMVP from './pages/KabalAcademyMVP';
import KabalAcademyAdmin from './pages/KabalAcademyAdmin';
import TrackRecord from './pages/TrackRecord';
import TrophyRoom from './pages/TrophyRoom';
import KabalCheckout from './pages/KabalCheckout';
import TeamUrlDirectory from './pages/TeamUrlDirectory';

function isTeamHost() {
  if (typeof window === 'undefined') return false;
  const hostname = window.location.hostname.toLowerCase();
  const normalized = hostname.startsWith('www.') ? hostname.slice(4) : hostname;
  return normalized.startsWith('team.') || normalized.includes('.team.');
}

export default function App() {
  if (isTeamHost()) {
    return (
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

          {/* INTERNAL */}
          <Route path="/sprint-board"             element={<SprintBoard />} />

          {/* ARSENAL */}
          <Route path="/arsenal"                  element={<Arsenal />} />

          {/* ACADEMY */}
          <Route path="/academy"                  element={<KabalAcademyMVP />} />
          <Route path="/academy/admin"            element={<KabalAcademyAdmin />} />
          <Route path="/academy/checkout"         element={<KabalCheckout />} />
          <Route path="/telegram-miniapp"          element={<TelegramMiniApp />} />

          {/* DIRECTORY */}
          <Route path="/url"                      element={<TeamUrlDirectory />} />

          {/* DIRECTORY */}
          <Route path="/url"                      element={<TeamUrlDirectory />} />

          {/* DIRECTORY */}
          <Route path="/url"                      element={<TeamUrlDirectory />} />

          {/* DIRECTORY */}
          <Route path="/url"                      element={<TeamUrlDirectory />} />

          {/* Fallback */}
          <Route path="*"                         element={<TeamHome />} />
        </Routes>
      </BrowserRouter>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/diejungle" element={<DieInTheJungle />} />
        <Route path="/trophy-room" element={<TrophyRoom />} />
        <Route path="/telegram-miniapp" element={<TelegramMiniApp />} />
        <Route path="*"          element={<LandingPage />} />
      </Routes>
    </BrowserRouter>
  );
}
