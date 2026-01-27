'use client';

import type { Activity } from '@/lib/types/itinerary';

interface ActivityCardProps {
  activity: Activity;
  onRemove: (id: string) => void;
  onEdit: () => void;
  isDragging?: boolean;
  justDropped?: boolean;
}

export function ActivityCard({ activity, onRemove, onEdit, isDragging, justDropped }: ActivityCardProps) {
  return (
    <div
      className={`activity ${isDragging ? 'dragging' : ''} ${justDropped ? 'just-dropped' : ''}`}
      draggable="true"
      data-id={activity.id}
      data-type={activity.type}
    >
      <div className="drag-handle">
        <span className="ghibli-icon">⋮⋮</span>
      </div>
      <button
        className="edit-btn"
        onClick={(e) => {
          e.stopPropagation();
          onEdit();
        }}
        aria-label="Edit activity"
      >
        ✎
      </button>
      <button
        className="remove-btn"
        onClick={(e) => {
          e.stopPropagation();
          onRemove(activity.id);
        }}
        aria-label="Remove activity"
      >
        ✕
      </button>
      <div className="activity-emoji">
        <span className="ghibli-marker">{activity.emoji}</span>
      </div>
      <div className="activity-content">
        <div className="activity-time">{activity.time}</div>
        <div className="activity-title">{activity.title}</div>
        <div className="activity-details">{activity.details}</div>
        <div className="activity-meta">
          {activity.rating && (
            <span className="badge badge-rating">★ {activity.rating}</span>
          )}
          {activity.price && (
            <span className="badge badge-price">{activity.price}</span>
          )}
          {activity.mapUrl && (
            <a
              href={activity.mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="activity-link"
              onClick={(e) => e.stopPropagation()}
            >
              ⌖ Map
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
