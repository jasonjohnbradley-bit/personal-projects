'use client';

import type { Activity } from '@/lib/types/itinerary';

interface AlternativeCardProps {
  activity: Activity;
  onRemove: (id: string) => void;
  onEdit: () => void;
  isDragging?: boolean;
}

export function AlternativeCard({ activity, onRemove, onEdit, isDragging }: AlternativeCardProps) {
  return (
    <div
      className={`alternative-item ${isDragging ? 'dragging' : ''}`}
      draggable="true"
      data-id={activity.id}
      data-type="alternative"
    >
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
      <div className="alternative-header">
        <span className="ghibli-marker small">{activity.emoji}</span>
        <div className="activity-time">{activity.time}</div>
      </div>
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
  );
}
