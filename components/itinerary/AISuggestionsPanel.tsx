'use client';

import { useState, useEffect, useCallback } from 'react';
import type { AISuggestion } from '@/lib/types/itinerary';

interface AISuggestionsPanelProps {
  planId: string;
  activeDayNumber: number;
  suggestions: AISuggestion[];
  onSuggestionDragStart: (e: React.DragEvent, suggestion: AISuggestion) => void;
  onRefreshSuggestions: (dayNumber: number) => Promise<void>;
  onRemoveSuggestion: (suggestionId: string) => void;
}

export function AISuggestionsPanel({
  planId,
  activeDayNumber,
  suggestions,
  onSuggestionDragStart,
  onRefreshSuggestions,
  onRemoveSuggestion,
}: AISuggestionsPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Filter suggestions for active day
  const daySuggestions = suggestions.filter(s => s.dayNumber === activeDayNumber);

  const handleGenerateMore = useCallback(async () => {
    setIsLoading(true);
    try {
      await onRefreshSuggestions(activeDayNumber);
    } finally {
      setIsLoading(false);
    }
  }, [activeDayNumber, onRefreshSuggestions]);

  const handleDragStart = useCallback((e: React.DragEvent, suggestion: AISuggestion) => {
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'ai-suggestion',
      suggestion,
    }));
    e.dataTransfer.effectAllowed = 'copy';
    onSuggestionDragStart(e, suggestion);
  }, [onSuggestionDragStart]);

  return (
    <aside className={`ai-suggestions-panel ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="panel-header">
        <h3>
          <span className="ai-badge-header">AI</span>
          {!isCollapsed && <span>Suggestions</span>}
        </h3>
        <button
          className="collapse-btn"
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-label={isCollapsed ? 'Expand panel' : 'Collapse panel'}
        >
          {isCollapsed ? '◀' : '▶'}
        </button>
      </div>

      {!isCollapsed && (
        <>
          <p className="panel-hint">
            Drag into your schedule for Day {activeDayNumber}
          </p>

          <div className="suggestions-list">
            {isLoading && (
              <div className="loading-suggestions">
                <div className="spinner-small"></div>
                <span>Finding suggestions...</span>
              </div>
            )}

            {!isLoading && daySuggestions.length === 0 && (
              <div className="no-suggestions">
                <p>No AI suggestions yet</p>
                <p className="hint">Click below to generate some!</p>
              </div>
            )}

            {daySuggestions.map(suggestion => (
              <div
                key={suggestion.id}
                className="suggestion-card"
                draggable="true"
                onDragStart={(e) => handleDragStart(e, suggestion)}
                data-suggestion-id={suggestion.id}
              >
                <button
                  className="suggestion-remove-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveSuggestion(suggestion.id);
                  }}
                  aria-label="Remove suggestion"
                >
                  ✕
                </button>
                <div className="suggestion-header">
                  <span className="suggestion-emoji">{suggestion.emoji}</span>
                  {suggestion.category && (
                    <span className="suggestion-category">{suggestion.category}</span>
                  )}
                </div>
                <div className="suggestion-title">{suggestion.title}</div>
                <div className="suggestion-details">{suggestion.details}</div>
                <div className="suggestion-meta">
                  {suggestion.rating && (
                    <span className="badge badge-rating">★ {suggestion.rating}</span>
                  )}
                  {suggestion.price && (
                    <span className="badge badge-price">{suggestion.price}</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <button
            className="btn btn-generate-more"
            onClick={handleGenerateMore}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="spinner-tiny"></span>
                Generating...
              </>
            ) : (
              <>✨ Generate More</>
            )}
          </button>
        </>
      )}
    </aside>
  );
}
