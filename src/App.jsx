import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './LandingPage';
import TeamHome from './pages/TeamHome';
import PNLCalendar from './pages/PNLCalendar';
import Watchlist from './pages/Watchlist';
import RiskManager from './pages/RiskManager';
import SprintBoard from './pages/SprintBoard';
import Arsenal from './pages/Arsenal';
import CRMAngel from './pages/CRMAngel';

const isTeamSubdomain =
  typeof window !== 'undefined' &&
  window.location.hostname.startsWith('team.');

export default function App() {
  if (isTeamSubdomain) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/"                      element={<TeamHome />} />
          <Route path="/finance/pnl-calendar"  element={<PNLCalendar />} />
          <Route path="/watchlist"             element={<Watchlist />} />
          <Route path="/risk-manager"          element={<RiskManager />} />
          <Route path="/sprint-board"          element={<SprintBoard />} />
          <Route path="/arsenal"               element={<Arsenal />} />
          <Route path="/crm-angel"             element={<CRMAngel />} />
          <Route path="*"                      element={<TeamHome />} />
        </Routes>
      </BrowserRouter>
    );
  }

  return <LandingPage />;
}
