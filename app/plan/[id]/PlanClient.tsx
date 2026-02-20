'use client';

import { useState, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import type { Plan, AISuggestion } from '@/lib/types/itinerary';
import { useItinerary } from '@/hooks/useItinerary';
import { useDragAndDrop } from '@/hooks/useDragAndDrop';
import { ControlBar } from '@/components/itinerary/ControlBar';
import { DayCard } from '@/components/itinerary/DayCard';
import { AISuggestionsPanel } from '@/components/itinerary/AISuggestionsPanel';
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
  const [activeTab, setActiveTab] = useState(1); // Start on Day 1, not Map
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);

  const {
    days,
    aiSuggestions,
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
    addSuggestionToDay,
    refreshSuggestions,
    removeSuggestion,
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

  // Handle drag from AI suggestions panel
  const handleSuggestionDragStart = useCallback((e: React.DragEvent, suggestion: AISuggestion) => {
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'ai-suggestion',
      suggestion,
    }));
    e.dataTransfer.effectAllowed = 'copy';
  }, []);


  // Extended drop handler that handles activities, AI suggestions, and unused places
  const handleExtendedDrop = useCallback((
    e: React.DragEvent,
    dayId: string,
    containerType: 'main' | 'alternative'
  ) => {
    try {
      const data = e.dataTransfer.getData('application/json');
      if (data) {
        const parsed = JSON.parse(data);

        // Handle AI suggestion drop
        if (parsed.type === 'ai-suggestion' && parsed.suggestion) {
          e.preventDefault();
          e.stopPropagation();

          const container = e.currentTarget as HTMLElement;
          const cards = container.querySelectorAll('.activity, .alternative-item');
          let targetIndex = cards.length;

          cards.forEach((card, index) => {
            const rect = card.getBoundingClientRect();
            const midY = rect.top + rect.height / 2;
            if (e.clientY < midY && index < targetIndex) {
              targetIndex = index;
            }
          });

          addSuggestionToDay(parsed.suggestion, dayId, targetIndex);
          showToast('✨ Added AI suggestion to schedule');
          return;
        }

      }
    } catch {
      // Not JSON data, proceed with normal drop
    }

    // Fall back to normal activity drop handling
    handleDrop(e, dayId, containerType);
  }, [addSuggestionToDay, addActivity, handleDrop, showToast]);

  // Get active day number for suggestions panel
  const activeDayNumber = activeTab > 0 ? activeTab : 1;

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

      <div className="content-with-panel">
        <div className="main-content">
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
                  <strong>Tip:</strong> Your places (★) are guaranteed in the schedule.
                  Drag AI suggestions from the panel to add them. Click ✎ to edit or ✕ to remove.
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
                onDrop={handleExtendedDrop}
              />
            </div>
          ))}
        </div>

        {/* Side Panels - only show on day tabs */}
        {activeTab > 0 && (
          <div className="side-panels">
            <AISuggestionsPanel
              planId={plan.id}
              activeDayNumber={activeDayNumber}
              suggestions={aiSuggestions}
              onSuggestionDragStart={handleSuggestionDragStart}
              onRefreshSuggestions={refreshSuggestions}
              onRemoveSuggestion={removeSuggestion}
            />
          </div>
        )}
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
