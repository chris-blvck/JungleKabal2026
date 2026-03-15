import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import DieInTheJungle from './pages/DieInTheJungle';
import DieInTheJungleAdmin from './pages/DieInTheJungleAdmin';
import DieInTheJungleVisualGuide from './pages/DieInTheJungleVisualGuide';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"       element={<DieInTheJungle />} />
        <Route path="/admin"  element={<DieInTheJungleAdmin />} />
        <Route path="/guide"  element={<DieInTheJungleVisualGuide />} />
        <Route path="*"       element={<DieInTheJungle />} />
      </Routes>
    </BrowserRouter>
  );
}
