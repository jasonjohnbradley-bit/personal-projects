'use client';

import { getColorForCategory } from '@/lib/utils/locationUtils';

interface MapFiltersProps {
  categories: string[];
  days: number[];
  selectedCategories: string[];
  selectedDays: number[];
  onCategoryChange: (categories: string[]) => void;
  onDayChange: (days: number[]) => void;
}

export function MapFilters({
  categories,
  days,
  selectedCategories,
  selectedDays,
  onCategoryChange,
  onDayChange,
}: MapFiltersProps) {
  const toggleCategory = (category: string) => {
    if (selectedCategories.includes(category)) {
      onCategoryChange(selectedCategories.filter(c => c !== category));
    } else {
      onCategoryChange([...selectedCategories, category]);
    }
  };

  const toggleDay = (day: number) => {
    if (selectedDays.includes(day)) {
      onDayChange(selectedDays.filter(d => d !== day));
    } else {
      onDayChange([...selectedDays, day]);
    }
  };

  const clearFilters = () => {
    onCategoryChange([]);
    onDayChange([]);
  };

  const hasActiveFilters = selectedCategories.length > 0 || selectedDays.length > 0;

  return (
    <div className="map-filters-card">
      <div className="map-filters-header">
        <h3 className="legend-title">Filter Map</h3>
        {hasActiveFilters && (
          <button
            className="filter-clear-btn"
            onClick={clearFilters}
            aria-label="Clear all filters"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Day filters */}
      <div className="filter-section">
        <h4 className="filter-section-title">By Day</h4>
        <div className="filter-chips">
          {days.map(day => (
            <button
              key={day}
              className={`filter-chip day-chip ${selectedDays.includes(day) ? 'active' : ''}`}
              onClick={() => toggleDay(day)}
              aria-pressed={selectedDays.includes(day)}
            >
              Day {day}
            </button>
          ))}
        </div>
      </div>

      {/* Category filters */}
      <div className="filter-section">
        <h4 className="filter-section-title">By Type</h4>
        <div className="filter-chips">
          {categories.map(category => (
            <button
              key={category}
              className={`filter-chip category-chip ${selectedCategories.includes(category) ? 'active' : ''}`}
              onClick={() => toggleCategory(category)}
              aria-pressed={selectedCategories.includes(category)}
              style={{
                '--chip-color': getColorForCategory(category),
              } as React.CSSProperties}
            >
              <span
                className="chip-dot"
                style={{ backgroundColor: getColorForCategory(category) }}
              />
              {category}
            </button>
          ))}
        </div>
      </div>

      {hasActiveFilters && (
        <p className="filter-status">
          Showing {selectedDays.length > 0 ? `Day ${selectedDays.join(', ')}` : 'all days'}
          {selectedCategories.length > 0 && ` • ${selectedCategories.join(', ')}`}
        </p>
      )}
    </div>
  );
}
