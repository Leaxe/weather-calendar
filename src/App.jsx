import { useState } from 'react';
import WeekHeader from './components/WeekHeader';
import WeekGrid from './components/WeekGrid';
import DetailToggle from './components/DetailToggle';
import { weekData } from './data/mockWeather';
import { mockEvents } from './data/mockEvents';
import './styles/global.css';

export default function App() {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header__left">
          <h1 className="app-header__title">Weather Calendar</h1>
          <span className="app-header__subtitle">Apr 6 – 12, 2026</span>
        </div>
        <div className="app-header__right">
          <DetailToggle
            showDetails={showDetails}
            onToggle={() => setShowDetails((s) => !s)}
          />
        </div>
      </header>
      <WeekHeader weekData={weekData} />
      <WeekGrid
        weekData={weekData}
        events={mockEvents}
        showDetails={showDetails}
      />
    </div>
  );
}
