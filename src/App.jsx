import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './LandingPage';
import TeamHome from './pages/TeamHome';
import PNLCalendar from './pages/PNLCalendar';

const isTeamSubdomain =
  typeof window !== 'undefined' &&
  window.location.hostname.startsWith('team.');

export default function App() {
  if (isTeamSubdomain) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<TeamHome />} />
          <Route path="/finance/pnl-calendar" element={<PNLCalendar />} />
          <Route path="*" element={<TeamHome />} />
        </Routes>
      </BrowserRouter>
    );
  }

  return <LandingPage />;
}
