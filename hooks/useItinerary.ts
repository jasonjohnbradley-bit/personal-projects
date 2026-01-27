'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type { Plan, Day, Activity, UpdateActivitiesInput } from '@/lib/types/itinerary';

interface UseItineraryReturn {
  days: Day[];
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
  resetToOriginal: () => void;
  exportItinerary: () => void;
}

export function useItinerary(plan: Plan): UseItineraryReturn {
  const [days, setDays] = useState<Day[]>(plan.days);
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
        };
      });
      day.alternatives.forEach((activity, index) => {
        updates[activity.id] = {
          type: 'alternative',
          dayId: day.id,
          sortOrder: index,
        };
      });
      day.removed.forEach((activity, index) => {
        updates[activity.id] = {
          type: 'removed',
          dayId: day.id,
          sortOrder: index,
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

      // Handle same-day reordering
      if (sourceDayIndex === targetDayIndex && found.type === targetType) {
        const day = newDays[targetDayIndex];
        const list = targetType === 'main' ? day.activities : day.alternatives;
        // Activity was already added, just need to ensure correct order
        const updatedList = list.map((a, idx) => ({ ...a, sortOrder: idx }));
        if (targetType === 'main') {
          newDays[targetDayIndex] = { ...day, activities: updatedList };
        } else {
          newDays[targetDayIndex] = { ...day, alternatives: updatedList };
        }
      }

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
  };
}
