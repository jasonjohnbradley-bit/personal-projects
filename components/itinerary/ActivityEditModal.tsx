'use client';

import { useState } from 'react';
import type { Activity } from '@/lib/types/itinerary';

interface ActivityEditModalProps {
  activity: Activity | null;
  isNew?: boolean;
  onSave: (data: Partial<Activity>) => void;
  onClose: () => void;
}

const emojiOptions = ['☕', '🍜', '🍽️', '🍣', '🥐', '🍵', '⛩️', '🏛️', '🛍️', '🎮', '💆', '🍷', '🌆', '🌳', '🎭'];

export function ActivityEditModal({
  activity,
  isNew = false,
  onSave,
  onClose,
}: ActivityEditModalProps) {
  const [formData, setFormData] = useState({
    time: activity?.time || '12:00 PM',
    emoji: activity?.emoji || '⭐',
    title: activity?.title || '',
    details: activity?.details || '',
    rating: activity?.rating || '',
    price: activity?.price || '',
    mapUrl: activity?.mapUrl || '',
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    setIsSaving(true);
    try {
      await onSave(formData);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>{isNew ? 'Add Activity' : 'Edit Activity'}</h2>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Time</label>
            <input
              type="text"
              className="form-input"
              value={formData.time}
              onChange={(e) => setFormData((p) => ({ ...p, time: e.target.value }))}
              placeholder="e.g., 9:00 AM"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Emoji</label>
            <div className="emoji-picker">
              {emojiOptions.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  className={`emoji-btn ${formData.emoji === emoji ? 'selected' : ''}`}
                  onClick={() => setFormData((p) => ({ ...p, emoji }))}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Title *</label>
            <input
              type="text"
              className="form-input"
              value={formData.title}
              onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
              placeholder="e.g., Senso-ji Temple"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Details</label>
            <textarea
              className="form-input form-textarea"
              value={formData.details}
              onChange={(e) => setFormData((p) => ({ ...p, details: e.target.value }))}
              placeholder="Description of the activity..."
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Rating</label>
              <input
                type="text"
                className="form-input"
                value={formData.rating}
                onChange={(e) => setFormData((p) => ({ ...p, rating: e.target.value }))}
                placeholder="e.g., 4.5"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Price</label>
              <input
                type="text"
                className="form-input"
                value={formData.price}
                onChange={(e) => setFormData((p) => ({ ...p, price: e.target.value }))}
                placeholder="e.g., $$"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Google Maps URL</label>
            <input
              type="url"
              className="form-input"
              value={formData.mapUrl}
              onChange={(e) => setFormData((p) => ({ ...p, mapUrl: e.target.value }))}
              placeholder="https://maps.google.com/..."
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSaving}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSaving || !formData.title.trim()}>
              {isSaving ? 'Saving...' : isNew ? 'Add Activity' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
