'use client';

import type { Location } from '@/lib/types/itinerary';

interface StatsCardsProps {
  locations: Location[];
  numDays: number;
}

export function StatsCards({ locations, numDays }: StatsCardsProps) {
  const stats = {
    restaurants: locations.filter(l => l.category === 'Restaurant' || l.category === 'Food').length,
    coffee: locations.filter(l => l.category === 'Coffee' || l.category === 'Cafe').length,
    cultural: locations.filter(l => l.category === 'Cultural' || l.category === 'Temple' || l.category === 'Museum').length,
    days: numDays,
  };

  return (
    <div className="stats-grid">
      <div className="stat-card">
        <div className="stat-number">{stats.restaurants}</div>
        <div className="stat-label">🍜 Restaurants</div>
      </div>
      <div className="stat-card">
        <div className="stat-number">{stats.coffee}</div>
        <div className="stat-label">☕ Coffee Spots</div>
      </div>
      <div className="stat-card">
        <div className="stat-number">{stats.cultural}</div>
        <div className="stat-label">⛩️ Cultural Sites</div>
      </div>
      <div className="stat-card">
        <div className="stat-number">{stats.days}</div>
        <div className="stat-label">📅 Days</div>
      </div>
    </div>
  );
}
