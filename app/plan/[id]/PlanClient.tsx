'use client';

import { useState, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import type { Plan } from '@/lib/types/itinerary';
import { useItinerary } from '@/hooks/useItinerary';
import { useDragAndDrop } from '@/hooks/useDragAndDrop';
import { ControlBar } from '@/components/itinerary/ControlBar';
import { DayCard } from '@/components/itinerary/DayCard';
import { MapFilters } from '@/components/map/MapFilters';
import { StatsCards } from '@/components/map/StatsCards';
import { Toast } from '@/components/ui/Toast';
import {
  deriveLocationsFromDays,
  getUniqueCategories,
  getUniqueDays,
  filterLocations,
} from '@/lib/utils/locationUtils';

// Dynamic import for map (SSR disabled)
const ItineraryMap = dynamic(
  () => import('@/components/map/ItineraryMap').then(mod => mod.ItineraryMap),
  { ssr: false, loading: () => <div style={{ height: '500px', background: '#f5f5f0', borderRadius: '15px' }} /> }
);

interface PlanClientProps {
  plan: Plan;
}

export function PlanClient({ plan }: PlanClientProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);

  const {
    days,
    isSaving,
    lastSaved,
    draggingId,
    justDroppedId,
    setDraggingId,
    removeActivity,
    restoreActivity,
    moveActivity,
    updateActivity,
    addActivity,
    resetToOriginal,
    exportItinerary,
  } = useItinerary(plan);

  const { handleDragStart, handleDragOver, handleDragLeave, handleDrop, handleDragEnd } = useDragAndDrop({
    onMove: moveActivity,
    setDraggingId,
  });

  // Derive enhanced locations from days and existing locations
  const enhancedLocations = useMemo(() => {
    return deriveLocationsFromDays(days, plan.locations);
  }, [days, plan.locations]);

  // Get unique filter options
  const availableCategories = useMemo(() => getUniqueCategories(enhancedLocations), [enhancedLocations]);
  const availableDays = useMemo(() => getUniqueDays(enhancedLocations), [enhancedLocations]);

  // Apply filters
  const filteredLocations = useMemo(() => {
    return filterLocations(enhancedLocations, selectedCategories, selectedDays);
  }, [enhancedLocations, selectedCategories, selectedDays]);

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
  }, []);

  const handleReset = useCallback(() => {
    resetToOriginal();
    showToast('🌿 Reset to original itinerary');
  }, [resetToOriginal, showToast]);

  const handleExport = useCallback(() => {
    exportItinerary();
    showToast('📥 Itinerary exported!');
  }, [exportItinerary, showToast]);

  return (
    <div onDragEnd={handleDragEnd}>
      <div className="header">
        <Link href="/dashboard" className="btn btn-secondary" style={{ position: 'absolute', left: '1rem', top: '1rem' }}>
          ← My Itineraries
        </Link>
        <h1>🍃 {plan.destination} {plan.numDays}-Day Adventure 🍃</h1>
        <p>Drag activities to customize • Click ✕ to remove • Auto-saves</p>
      </div>

      <ControlBar
        isSaving={isSaving}
        lastSaved={lastSaved}
        onReset={handleReset}
        onExport={handleExport}
      />

      <div className="tabs">
        <button
          className={`tab ${activeTab === 0 ? 'active' : ''}`}
          onClick={() => setActiveTab(0)}
        >
          🗺️ Map
        </button>
        {days.map((day, index) => (
          <button
            key={day.id}
            className={`tab ${activeTab === index + 1 ? 'active' : ''}`}
            onClick={() => setActiveTab(index + 1)}
          >
            Day {day.dayNumber}
          </button>
        ))}
      </div>

      <div className="container">
        {/* Map Tab */}
        <div className={`tab-content ${activeTab === 0 ? 'active' : ''}`}>
          <StatsCards locations={enhancedLocations} />
          <MapFilters
            categories={availableCategories}
            days={availableDays}
            selectedCategories={selectedCategories}
            selectedDays={selectedDays}
            onCategoryChange={setSelectedCategories}
            onDayChange={setSelectedDays}
          />
          <ItineraryMap locations={filteredLocations} />
        </div>

        {/* Day Tabs */}
        {days.map((day, index) => (
          <div
            key={day.id}
            className={`tab-content ${activeTab === index + 1 ? 'active' : ''}`}
          >
            <div className="tip-card">
              <span className="tip-icon">💡</span>
              <div className="tip-content">
                <strong>Tip:</strong> Drag activities to reorder them, or drag alternatives
                into the main schedule. Click ✎ to edit or ✕ to remove items.
              </div>
            </div>

            <DayCard
              day={day}
              draggingId={draggingId}
              justDroppedId={justDroppedId}
              onRemove={removeActivity}
              onRestore={restoreActivity}
              onUpdate={updateActivity}
              onAdd={addActivity}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            />
          </div>
        ))}
      </div>

      {toastMessage && (
        <Toast
          message={toastMessage}
          onClose={() => setToastMessage(null)}
        />
      )}
    </div>
  );
}
