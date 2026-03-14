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

const isTeamSubdomain =
  typeof window !== 'undefined' &&
  window.location.hostname.startsWith('team.');

export default function App() {
  if (isTeamSubdomain) {
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

          {/* INTERNAL */}
          <Route path="/sprint-board"             element={<SprintBoard />} />

          {/* ARSENAL */}
          <Route path="/arsenal"                  element={<Arsenal />} />

          {/* ACADEMY */}
          <Route path="/academy"                  element={<KabalAcademyMVP />} />
          <Route path="/academy/admin"            element={<KabalAcademyAdmin />} />
          <Route path="/academy/checkout"         element={<KabalCheckout />} />

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
        <Route path="*"          element={<LandingPage />} />
      </Routes>
    </BrowserRouter>
  );
}
