'use client';

import type { Location } from '@/lib/types/itinerary';
import type { EnhancedLocation } from '@/lib/utils/locationUtils';

interface StatsCardsProps {
  locations: (Location | EnhancedLocation)[];
}

export function StatsCards({ locations }: StatsCardsProps) {
  const stats = {
    restaurants: locations.filter(l => l.category === 'Restaurant' || l.category === 'Food' || l.category === 'Lunch' || l.category === 'Dinner').length,
    coffee: locations.filter(l => l.category === 'Coffee' || l.category === 'Cafe' || l.category === 'Breakfast').length,
    cultural: locations.filter(l => l.category === 'Cultural' || l.category === 'Temple' || l.category === 'Museum').length,
    total: locations.length,
  };

  return (
    <div className="stats-grid">
      <div className="stat-card">
        <div className="stat-number">{stats.total}</div>
        <div className="stat-label">📍 Total Places</div>
      </div>
      <div className="stat-card">
        <div className="stat-number">{stats.restaurants}</div>
        <div className="stat-label">🍜 Restaurants</div>
      </div>
      <div className="stat-card">
        <div className="stat-number">{stats.coffee}</div>
        <div className="stat-label">☕ Coffee/Breakfast</div>
      </div>
      <div className="stat-card">
        <div className="stat-number">{stats.cultural}</div>
        <div className="stat-label">⛩️ Cultural Sites</div>
      </div>
    </div>
  );
}
