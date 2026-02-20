'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type { Plan, Day, Activity, UpdateActivitiesInput, AISuggestion } from '@/lib/types/itinerary';
import { recalculateActivityTimes } from '@/lib/utils/timeCalculation';

interface UseItineraryReturn {
  days: Day[];
  aiSuggestions: AISuggestion[];
  isSaving: boolean;
  lastSaved: Date | null;
  draggingId: string | null;
  justDroppedId: string | null;
  setDraggingId: (id: string | null) => void;
  removeActivity: (activityId: string) => void;
  restoreActivity: (activityId: string) => void;
  moveActivity: (activityId: string, targetDayId: string, targetType: 'main' | 'alternative', targetIndex?: number) => void;
  updateActivity: (activityId: string, data: Partial<Activity>) => Promise<void>;
  addActivity: (dayId: string, data: Omit<Activity, 'id' | 'dayId' | 'sortOrder'>) => Promise<void>;
  addSuggestionToDay: (suggestion: AISuggestion, dayId: string, targetIndex?: number) => Promise<void>;
  refreshSuggestions: (dayNumber: number) => Promise<void>;
  removeSuggestion: (suggestionId: string) => void;
  resetToOriginal: () => void;
  exportItinerary: () => void;
}

export function useItinerary(plan: Plan): UseItineraryReturn {
  const [days, setDays] = useState<Day[]>(plan.days);
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[]>(plan.aiSuggestions || []);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [justDroppedId, setJustDroppedId] = useState<string | null>(null);

  const originalDays = useRef<Day[]>(plan.days);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced save
  const saveToServer = useCallback(async (updatedDays: Day[]) => {
    setIsSaving(true);

    const updates: UpdateActivitiesInput['activities'] = {};

    updatedDays.forEach(day => {
      day.activities.forEach((activity, index) => {
        updates[activity.id] = {
          type: 'main',
          dayId: day.id,
          sortOrder: index,
          time: activity.time,
        };
      });
      day.alternatives.forEach((activity, index) => {
        updates[activity.id] = {
          type: 'alternative',
          dayId: day.id,
          sortOrder: index,
          time: activity.time,
        };
      });
      day.removed.forEach((activity, index) => {
        updates[activity.id] = {
          type: 'removed',
          dayId: day.id,
          sortOrder: index,
          time: activity.time,
        };
      });
    });

    try {
      await fetch(`/api/plans/${plan.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activities: updates }),
      });
      setLastSaved(new Date());
    } catch (error) {
      console.error('Failed to save:', error);
    } finally {
      setIsSaving(false);
    }
  }, [plan.id]);

  const scheduleSave = useCallback((updatedDays: Day[]) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      saveToServer(updatedDays);
    }, 1000);
  }, [saveToServer]);

  // Find activity across all days
  const findActivity = useCallback((activityId: string): { activity: Activity; dayIndex: number; type: 'main' | 'alternative' | 'removed' } | null => {
    for (let i = 0; i < days.length; i++) {
      const day = days[i];
      let activity = day.activities.find(a => a.id === activityId);
      if (activity) return { activity, dayIndex: i, type: 'main' };

      activity = day.alternatives.find(a => a.id === activityId);
      if (activity) return { activity, dayIndex: i, type: 'alternative' };

      activity = day.removed.find(a => a.id === activityId);
      if (activity) return { activity, dayIndex: i, type: 'removed' };
    }
    return null;
  }, [days]);

  const removeActivity = useCallback((activityId: string) => {
    const found = findActivity(activityId);
    if (!found) return;

    setDays(prevDays => {
      const newDays = prevDays.map((day, i) => {
        if (i !== found.dayIndex) return day;

        const removedActivity = { ...found.activity, type: 'removed' as const };

        return {
          ...day,
          activities: day.activities.filter(a => a.id !== activityId),
          alternatives: day.alternatives.filter(a => a.id !== activityId),
          removed: [...day.removed, removedActivity],
        };
      });

      scheduleSave(newDays);
      return newDays;
    });
  }, [findActivity, scheduleSave]);

  const restoreActivity = useCallback((activityId: string) => {
    const found = findActivity(activityId);
    if (!found || found.type !== 'removed') return;

    setDays(prevDays => {
      const newDays = prevDays.map((day, i) => {
        if (i !== found.dayIndex) return day;

        const restoredActivity = { ...found.activity, type: 'alternative' as const };

        return {
          ...day,
          removed: day.removed.filter(a => a.id !== activityId),
          alternatives: [...day.alternatives, restoredActivity],
        };
      });

      scheduleSave(newDays);
      return newDays;
    });
  }, [findActivity, scheduleSave]);

  const moveActivity = useCallback((
    activityId: string,
    targetDayId: string,
    targetType: 'main' | 'alternative',
    targetIndex?: number
  ) => {
    const found = findActivity(activityId);
    if (!found) return;

    setDays(prevDays => {
      const sourceDayIndex = found.dayIndex;
      const targetDayIndex = prevDays.findIndex(d => d.id === targetDayId);

      if (targetDayIndex === -1) return prevDays;

      // Create a copy of the activity with new type
      const movedActivity: Activity = { ...found.activity, type: targetType, dayId: targetDayId };

      const newDays = prevDays.map((day, i) => {
        // Remove from source day
        if (i === sourceDayIndex) {
          return {
            ...day,
            activities: day.activities.filter(a => a.id !== activityId),
            alternatives: day.alternatives.filter(a => a.id !== activityId),
            removed: day.removed.filter(a => a.id !== activityId),
          };
        }
        return day;
      }).map((day, i) => {
        // Add to target day
        if (i === targetDayIndex) {
          if (targetType === 'main') {
            const activities = [...day.activities];
            if (targetIndex !== undefined) {
              activities.splice(targetIndex, 0, movedActivity);
            } else {
              activities.push(movedActivity);
            }
            return { ...day, activities };
          } else {
            return { ...day, alternatives: [...day.alternatives, movedActivity] };
          }
        }
        return day;
      });

      // Recalculate times for affected days (main activities only)
      const affectedDayIndices = new Set([sourceDayIndex, targetDayIndex]);

      affectedDayIndices.forEach(dayIndex => {
        const day = newDays[dayIndex];
        // Only recalculate times for main activities
        const recalculatedActivities = recalculateActivityTimes(day.activities);
        newDays[dayIndex] = { ...day, activities: recalculatedActivities };
      });

      // Set just dropped for animation
      setJustDroppedId(activityId);
      setTimeout(() => setJustDroppedId(null), 500);

      scheduleSave(newDays);
      return newDays;
    });
  }, [findActivity, scheduleSave]);

  const resetToOriginal = useCallback(() => {
    setDays(originalDays.current);
    scheduleSave(originalDays.current);
  }, [scheduleSave]);

  const updateActivity = useCallback(async (activityId: string, data: Partial<Activity>) => {
    // Optimistic update
    setDays(prevDays => prevDays.map(day => ({
      ...day,
      activities: day.activities.map(a =>
        a.id === activityId ? { ...a, ...data } : a
      ),
      alternatives: day.alternatives.map(a =>
        a.id === activityId ? { ...a, ...data } : a
      ),
      removed: day.removed.map(a =>
        a.id === activityId ? { ...a, ...data } : a
      ),
    })));

    // Persist to server
    try {
      await fetch(`/api/activities/${activityId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      setLastSaved(new Date());
    } catch (error) {
      console.error('Failed to update activity:', error);
    }
  }, []);

  const addActivity = useCallback(async (dayId: string, data: Omit<Activity, 'id' | 'dayId' | 'sortOrder'>) => {
    const day = days.find(d => d.id === dayId);
    if (!day) return;

    try {
      const response = await fetch(`/api/days/${dayId}/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          type: data.type || 'main',
          sortOrder: day.activities.length,
        }),
      });

      const { id } = await response.json();

      setDays(prevDays => prevDays.map(d =>
        d.id === dayId
          ? {
              ...d,
              activities: [...d.activities, {
                id,
                dayId,
                sortOrder: d.activities.length,
                ...data,
              } as Activity],
            }
          : d
      ));

      setLastSaved(new Date());
    } catch (error) {
      console.error('Failed to add activity:', error);
    }
  }, [days]);

  const exportItinerary = useCallback(() => {
    let text = `🍃 ${plan.destination.toUpperCase()} ${plan.numDays}-DAY ADVENTURE 🍃\n`;
    text += '═'.repeat(50) + '\n\n';

    days.forEach(day => {
      text += `DAY ${day.dayNumber}: ${day.title}\n`;
      text += `${day.description}\n`;
      text += '─'.repeat(40) + '\n';

      day.activities.forEach(activity => {
        text += `\n${activity.emoji} ${activity.time}\n`;
        text += `${activity.title}\n`;
        text += `${activity.details}\n`;
        if (activity.rating) text += `⭐ ${activity.rating}`;
        if (activity.price) text += ` | ${activity.price}`;
        text += '\n';
      });

      text += '\n\n';
    });

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${plan.destination.toLowerCase().replace(/\s+/g, '_')}_itinerary.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [days, plan.destination, plan.numDays]);

  // AI Suggestions management
  const addSuggestionToDay = useCallback(async (
    suggestion: AISuggestion,
    dayId: string,
    targetIndex?: number
  ) => {
    const day = days.find(d => d.id === dayId);
    if (!day) return;

    try {
      // Call API to convert suggestion to activity
      const response = await fetch(`/api/suggestions/${plan.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          suggestionId: suggestion.id,
          dayId,
          sortOrder: targetIndex ?? day.activities.length,
        }),
      });

      const { activityId } = await response.json();

      // Create new activity from suggestion
      const newActivity: Activity = {
        id: activityId,
        dayId,
        type: 'main',
        source: 'ai',
        sortOrder: targetIndex ?? day.activities.length,
        time: '',
        emoji: suggestion.emoji || '⭐',
        title: suggestion.title,
        details: suggestion.details || '',
        rating: suggestion.rating,
        price: suggestion.price,
        mapUrl: suggestion.mapUrl,
        lat: suggestion.lat,
        lng: suggestion.lng,
      };

      // Update local state
      setDays(prevDays => prevDays.map(d => {
        if (d.id !== dayId) return d;

        const activities = [...d.activities];
        if (targetIndex !== undefined) {
          activities.splice(targetIndex, 0, newActivity);
        } else {
          activities.push(newActivity);
        }

        return {
          ...d,
          activities: recalculateActivityTimes(activities),
        };
      }));

      // Remove from suggestions
      setAiSuggestions(prev => prev.filter(s => s.id !== suggestion.id));

      // Set just dropped for animation
      setJustDroppedId(activityId);
      setTimeout(() => setJustDroppedId(null), 500);

      setLastSaved(new Date());
    } catch (error) {
      console.error('Failed to add suggestion:', error);
    }
  }, [days, plan.id]);

  const refreshSuggestions = useCallback(async (dayNumber: number) => {
    try {
      const response = await fetch(`/api/suggestions/${plan.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dayNumber }),
      });

      const { suggestions: newSuggestions } = await response.json();

      if (newSuggestions && Array.isArray(newSuggestions)) {
        setAiSuggestions(prev => [...prev, ...newSuggestions]);
      }
    } catch (error) {
      console.error('Failed to refresh suggestions:', error);
    }
  }, [plan.id]);

  const removeSuggestion = useCallback((suggestionId: string) => {
    setAiSuggestions(prev => prev.filter(s => s.id !== suggestionId));

    // Also delete from server (fire and forget)
    fetch(`/api/suggestions/${plan.id}?suggestionId=${suggestionId}`, {
      method: 'DELETE',
    }).catch(err => console.error('Failed to delete suggestion:', err));
  }, [plan.id]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return {
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
  };
}
