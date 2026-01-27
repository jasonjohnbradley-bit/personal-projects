'use client';

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import type { Plan } from '@/lib/types/itinerary';
import { useItinerary } from '@/hooks/useItinerary';
import { useDragAndDrop } from '@/hooks/useDragAndDrop';
import { ControlBar } from '@/components/itinerary/ControlBar';
import { DayCard } from '@/components/itinerary/DayCard';
import { MapLegend } from '@/components/map/MapLegend';
import { StatsCards } from '@/components/map/StatsCards';
import { Toast } from '@/components/ui/Toast';

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
          <StatsCards locations={plan.locations} numDays={plan.numDays} />
          <MapLegend />
          <ItineraryMap locations={plan.locations} />
        </div>

        {/* Day Tabs */}
        {days.map((day, index) => (
          <div
            key={day.id}
            className={`tab-content ${activeTab === index + 1 ? 'active' : ''}`}
          >
            <div
              style={{
                background: 'var(--ghibli-sky-light)',
                padding: '1rem',
                borderRadius: 'var(--radius)',
                marginBottom: '1.5rem',
                fontSize: '0.9rem',
              }}
            >
              💡 <strong>Tip:</strong> Drag activities to reorder them, or drag alternatives
              into the main schedule. Click ✕ to remove items.
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
