'use client';

import { useState } from 'react';
import type { Day, Activity } from '@/lib/types/itinerary';
import { ActivityCard } from './ActivityCard';
import { AlternativeCard } from './AlternativeCard';
import { RemovedSection } from './RemovedSection';
import { ActivityEditModal } from './ActivityEditModal';

interface DayCardProps {
  day: Day;
  draggingId: string | null;
  justDroppedId: string | null;
  onRemove: (activityId: string) => void;
  onRestore: (activityId: string) => void;
  onUpdate: (activityId: string, data: Partial<Activity>) => Promise<void>;
  onAdd: (dayId: string, data: Omit<Activity, 'id' | 'dayId' | 'sortOrder'>) => Promise<void>;
  onDragStart: (e: React.DragEvent, activityId: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, dayId: string, containerType: 'main' | 'alternative') => void;
}

export function DayCard({
  day,
  draggingId,
  justDroppedId,
  onRemove,
  onRestore,
  onUpdate,
  onAdd,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
}: DayCardProps) {
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const handleEdit = (activity: Activity) => {
    setEditingActivity(activity);
  };

  const handleSaveEdit = async (data: Partial<Activity>) => {
    if (editingActivity) {
      await onUpdate(editingActivity.id, data);
      setEditingActivity(null);
    }
  };

  const handleAdd = async (data: Partial<Activity>) => {
    await onAdd(day.id, {
      type: 'main',
      source: 'custom',
      time: data.time || '12:00 PM',
      emoji: data.emoji || '⭐',
      title: data.title || '',
      details: data.details || '',
      rating: data.rating,
      price: data.price,
      mapUrl: data.mapUrl,
    });
    setShowAddModal(false);
  };
  return (
    <div className="day-card">
      <div className="day-header">
        <div className="day-number">{day.dayNumber}</div>
        <div className="day-title">
          <h2>{day.title}</h2>
          <p>{day.description}</p>
        </div>
      </div>

      <div
        className="activities-container"
        data-day={day.dayNumber}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={(e) => onDrop(e, day.id, 'main')}
      >
        {day.activities.map(activity => (
          <div
            key={activity.id}
            onDragStart={(e) => onDragStart(e, activity.id)}
          >
            <ActivityCard
              activity={activity}
              onRemove={onRemove}
              onEdit={() => handleEdit(activity)}
              isDragging={draggingId === activity.id}
              justDropped={justDroppedId === activity.id}
            />
          </div>
        ))}
        <button
          className="btn add-activity-btn"
          onClick={() => setShowAddModal(true)}
        >
          + Add Activity
        </button>
      </div>

      {day.alternatives.length > 0 && (
        <div className="alternatives-section">
          <h3>🌟 Alternative Options</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--ghibli-grey)', marginBottom: '1rem' }}>
            Drag these into the schedule above to swap them in
          </p>
          <div
            className="alternatives-grid"
            data-day={`${day.dayNumber}-alt`}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={(e) => onDrop(e, day.id, 'alternative')}
          >
            {day.alternatives.map(activity => (
              <div
                key={activity.id}
                onDragStart={(e) => onDragStart(e, activity.id)}
              >
                <AlternativeCard
                  activity={activity}
                  onRemove={onRemove}
                  onEdit={() => handleEdit(activity)}
                  isDragging={draggingId === activity.id}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <RemovedSection
        items={day.removed}
        onRestore={onRestore}
      />

      {editingActivity && (
        <ActivityEditModal
          activity={editingActivity}
          onSave={handleSaveEdit}
          onClose={() => setEditingActivity(null)}
        />
      )}

      {showAddModal && (
        <ActivityEditModal
          activity={null}
          isNew
          onSave={handleAdd}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
}
