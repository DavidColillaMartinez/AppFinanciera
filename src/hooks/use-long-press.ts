"use client";

import { useCallback, useRef, useState } from "react";

interface LongPressOptions {
  threshold?: number;
  onStart?: () => void;
  onCancel?: () => void;
}

export function useLongPress(
  callback: () => void,
  options: LongPressOptions = {}
) {
  const { threshold = 500, onStart, onCancel } = options;

  const [isPressed, setIsPressed] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);
  const triggeredRef = useRef(false);

  const start = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0 && e.pointerType === 'touch') return;

      startPosRef.current = { x: e.clientX, y: e.clientY };
      triggeredRef.current = false;

      timerRef.current = setTimeout(() => {
        setIsPressed(true);
        triggeredRef.current = true;
        onStart?.();
        callback();
      }, threshold);
    },
    [callback, threshold, onStart]
  );

  const move = useCallback(
    (e: React.PointerEvent) => {
      if (!startPosRef.current || !timerRef.current) return;

      const dx = Math.abs(e.clientX - startPosRef.current.x);
      const dy = Math.abs(e.clientY - startPosRef.current.y);

      if (dx > 10 || dy > 10) {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
        if (triggeredRef.current) {
          onCancel?.();
          triggeredRef.current = false;
        }
        setIsPressed(false);
      }
    },
    [onCancel]
  );

  const end = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (triggeredRef.current) {
      onCancel?.();
      triggeredRef.current = false;
    }
    setIsPressed(false);
    startPosRef.current = null;
  }, [onCancel]);

  return {
    isPressed,
    handlers: {
      onPointerDown: start,
      onPointerMove: move,
      onPointerUp: end,
      onPointerLeave: end,
      onPointerCancel: end,
    },
  };
}