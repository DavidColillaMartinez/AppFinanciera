"use client";

import { useCallback, useRef, useState } from "react";

export interface DragReorderState {
  activeIndex: number | null;
  targetIndex: number | null;
  isDragging: boolean;
}

export function useDragReorder<T>(items: T[], onReorder: (from: number, to: number) => void) {
  const [state, setState] = useState<DragReorderState>({
    activeIndex: null,
    targetIndex: null,
    isDragging: false,
  });

  const draggedIndexRef = useRef<number | null>(null);
  const elementPositionsRef = useRef<Map<number, DOMRect>>(new Map());
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);

  const updatePositions = useCallback(() => {
    elementPositionsRef.current.clear();
    document.querySelectorAll("[data-drag-item]").forEach((el) => {
      const idx = el.getAttribute("data-drag-item");
      if (idx !== null) {
        const rect = el.getBoundingClientRect();
        elementPositionsRef.current.set(parseInt(idx, 10), rect);
      }
    });
  }, []);

  const getIndexAtPosition = useCallback(
    (clientY: number): number => {
      const positions = elementPositionsRef.current;
      let closest: number | null = null;
      let minDist = Infinity;

      positions.forEach((rect, idx) => {
        if (idx === draggedIndexRef.current) return;

        const centerY = rect.top + rect.height / 2;
        const dist = Math.abs(clientY - centerY);

        if (clientY < centerY && dist < minDist) {
          minDist = dist;
          closest = idx;
        } else if (clientY >= centerY && dist < minDist) {
          minDist = dist;
          closest = idx;
        }
      });

      return closest ?? draggedIndexRef.current ?? 0;
    },
    []
  );

  const handleDragStart = useCallback(
    (index: number, e: React.PointerEvent) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      draggedIndexRef.current = index;
      pointerStartRef.current = { x: e.clientX, y: e.clientY };
      updatePositions();
      setState({ activeIndex: index, targetIndex: index, isDragging: true });
    },
    [updatePositions]
  );

  const handleDragMove = useCallback(
    (e: React.PointerEvent) => {
      if (!state.isDragging || draggedIndexRef.current === null) return;

      const currentIdx = draggedIndexRef.current;
      const targetIdx = getIndexAtPosition(e.clientY);

      if (targetIdx !== state.targetIndex) {
        setState((prev) => ({ ...prev, targetIndex: targetIdx }));
      }
    },
    [state.isDragging, state.targetIndex, getIndexAtPosition]
  );

  const handleDragEnd = useCallback(
    (e: React.PointerEvent) => {
      if (!state.isDragging || draggedIndexRef.current === null) return;

      const fromIdx = draggedIndexRef.current;
      const toIdx = state.targetIndex ?? fromIdx;

      if (fromIdx !== toIdx) {
        onReorder(fromIdx, toIdx);
      }

      draggedIndexRef.current = null;
      pointerStartRef.current = null;
      elementPositionsRef.current.clear();

      setState({ activeIndex: null, targetIndex: null, isDragging: false });
    },
    [state.isDragging, state.targetIndex, onReorder]
  );

  const handleDragCancel = useCallback(() => {
    draggedIndexRef.current = null;
    pointerStartRef.current = null;
    elementPositionsRef.current.clear();
    setState({ activeIndex: null, targetIndex: null, isDragging: false });
  }, []);

  return {
    ...state,
    handlers: {
      onPointerDown: handleDragStart,
      onPointerMove: handleDragMove,
      onPointerUp: handleDragEnd,
      onPointerCancel: handleDragCancel,
    },
  };
}