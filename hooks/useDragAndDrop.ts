'use client';

import { useCallback, useRef } from 'react';

interface UseDragAndDropOptions {
  onMove: (activityId: string, targetDayId: string, targetType: 'main' | 'alternative', targetIndex?: number) => void;
  setDraggingId: (id: string | null) => void;
}

export function useDragAndDrop({ onMove, setDraggingId }: UseDragAndDropOptions) {
  const draggedIdRef = useRef<string | null>(null);

  const handleDragStart = useCallback((e: React.DragEvent, activityId: string) => {
    draggedIdRef.current = activityId;
    setDraggingId(activityId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', activityId);

    // Create sparkle effect
    createSparkle(e.clientX, e.clientY);
  }, [setDraggingId]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    // Set dropEffect based on what's allowed (move for activities, copy for AI suggestions)
    const allowed = e.dataTransfer.effectAllowed;
    if (allowed === 'copy' || allowed === 'copyMove') {
      e.dataTransfer.dropEffect = 'copy';
    } else {
      e.dataTransfer.dropEffect = 'move';
    }

    const target = e.currentTarget as HTMLElement;
    target.classList.add('drag-over');
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    const target = e.currentTarget as HTMLElement;
    target.classList.remove('drag-over');
  }, []);

  const handleDrop = useCallback((
    e: React.DragEvent,
    dayId: string,
    containerType: 'main' | 'alternative'
  ) => {
    e.preventDefault();
    const target = e.currentTarget as HTMLElement;
    target.classList.remove('drag-over');

    const activityId = draggedIdRef.current || e.dataTransfer.getData('text/plain');
    if (!activityId) return;

    // Calculate drop index based on mouse position
    const container = e.currentTarget as HTMLElement;
    const items = container.querySelectorAll('[data-id]');
    let targetIndex = items.length;

    const rect = container.getBoundingClientRect();
    const y = e.clientY - rect.top;

    for (let i = 0; i < items.length; i++) {
      const item = items[i] as HTMLElement;
      const itemRect = item.getBoundingClientRect();
      const itemY = itemRect.top - rect.top + itemRect.height / 2;

      if (y < itemY) {
        targetIndex = i;
        break;
      }
    }

    onMove(activityId, dayId, containerType, targetIndex);

    draggedIdRef.current = null;
    setDraggingId(null);

    // Create sparkle at drop location
    createSparkle(e.clientX, e.clientY);
  }, [onMove, setDraggingId]);

  const handleDragEnd = useCallback(() => {
    draggedIdRef.current = null;
    setDraggingId(null);

    // Remove any lingering drag-over classes
    document.querySelectorAll('.drag-over').forEach(el => {
      el.classList.remove('drag-over');
    });
  }, [setDraggingId]);

  return {
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
  };
}

function createSparkle(x: number, y: number) {
  const sparkles = ['✨', '⭐', '🌟', '💫'];
  const sparkle = document.createElement('div');
  sparkle.className = 'sparkle';
  sparkle.textContent = sparkles[Math.floor(Math.random() * sparkles.length)];
  sparkle.style.left = `${x}px`;
  sparkle.style.top = `${y}px`;
  document.body.appendChild(sparkle);

  setTimeout(() => sparkle.remove(), 800);
}
