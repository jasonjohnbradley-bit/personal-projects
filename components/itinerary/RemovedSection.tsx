'use client';

import type { Activity } from '@/lib/types/itinerary';

interface RemovedSectionProps {
  items: Activity[];
  onRestore: (id: string) => void;
}

export function RemovedSection({ items, onRestore }: RemovedSectionProps) {
  if (items.length === 0) return null;

  return (
    <div className="removed-section has-items">
      <h4>🗑️ Removed Items</h4>
      <div className="removed-grid">
        {items.map(item => (
          <div key={item.id} className="removed-item">
            <span>{item.title}</span>
            <button
              className="restore-btn"
              onClick={() => onRestore(item.id)}
            >
              ↩ Restore
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
