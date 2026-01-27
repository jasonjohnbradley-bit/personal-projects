'use client';

// Ghibli-themed category colors
const categories = [
  { emoji: '🏨', label: 'Hotel', color: '#D4A5A5' },      // Blossom dark
  { emoji: '☕', label: 'Coffee', color: '#8B7355' },     // Wood
  { emoji: '🍜', label: 'Restaurant', color: '#A8B89C' }, // Sage dark
  { emoji: '🥐', label: 'Bakery', color: '#E8B4B8' },     // Blossom
  { emoji: '⛩️', label: 'Cultural', color: '#6B5344' },   // Wood dark
  { emoji: '🛍️', label: 'Shopping', color: '#C5D4B8' },   // Sage
  { emoji: '🍺', label: 'Nightlife', color: '#A89880' },  // Wood light
];

export function MapLegend() {
  return (
    <div className="map-legend-card">
      <h3 className="legend-title">Map Legend</h3>
      <div className="map-legend">
        {categories.map(cat => (
          <div key={cat.label} className="legend-item">
            <div className="legend-dot" style={{ backgroundColor: cat.color }} />
            <span>{cat.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
