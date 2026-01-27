'use client';

const categories = [
  { emoji: '🏨', label: 'Hotel', color: '#FF1744' },
  { emoji: '☕', label: 'Coffee', color: '#8B4513' },
  { emoji: '🍜', label: 'Restaurant', color: '#4CAF50' },
  { emoji: '🥐', label: 'Bakery', color: '#FF9800' },
  { emoji: '⛩️', label: 'Cultural', color: '#9C27B0' },
  { emoji: '🛍️', label: 'Shopping', color: '#2196F3' },
  { emoji: '🍺', label: 'Nightlife', color: '#FF9800' },
];

export function MapLegend() {
  return (
    <div className="map-legend">
      {categories.map(cat => (
        <div key={cat.label} className="legend-item">
          <div className="legend-dot" style={{ backgroundColor: cat.color }} />
          <span>{cat.emoji} {cat.label}</span>
        </div>
      ))}
    </div>
  );
}
