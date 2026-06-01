"use client";

import { useCallback, useRef, useState, useEffect } from "react";
import { useAppStore } from "@/stores/app-store";
import { cn } from "@/lib/utils";
import { GripVertical, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DraggableWidgetProps {
  index: number;
  children: React.ReactNode;
  className?: string;
  onReorder: (from: number, to: number) => void;
  totalWidgets: number;
}

export function useWidgetReorder(
  widgets: { id: string; visible: boolean }[],
  onReorderComplete: (from: number, to: number) => void
) {
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [targetIndex, setTargetIndex] = useState<number | null>(null);
  const [pickedIndex, setPickedIndex] = useState<number | null>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);

  const enterReorderMode = useCallback(() => {
    setIsReorderMode(true);
  }, []);

  const exitReorderMode = useCallback(() => {
    setIsReorderMode(false);
    setActiveIndex(null);
    setTargetIndex(null);
    setPickedIndex(null);
  }, []);

  const confirmReorder = useCallback(() => {
    if (activeIndex !== null && targetIndex !== null && activeIndex !== targetIndex) {
      onReorderComplete(activeIndex, targetIndex);
    }
    exitReorderMode();
  }, [activeIndex, targetIndex, onReorderComplete, exitReorderMode]);

  const handlePointerDown = useCallback(
    (index: number, e: React.PointerEvent) => {
      if (!isReorderMode) {
        startPosRef.current = { x: e.clientX, y: e.clientY };
        longPressTimerRef.current = setTimeout(() => {
          setIsReorderMode(true);
          setActiveIndex(index);
          setPickedIndex(index);
          e.currentTarget.setPointerCapture(e.pointerId);
        }, 500);
      } else {
        if (pickedIndex !== null) {
          setTargetIndex(index);
          if (pickedIndex !== index) {
            setActiveIndex(index);
          }
        }
      }
    },
    [isReorderMode, pickedIndex]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!startPosRef.current || !isReorderMode) return;

      const dx = Math.abs(e.clientX - startPosRef.current.x);
      const dy = Math.abs(e.clientY - startPosRef.current.y);

      if (dx > 10 || dy > 10) {
        if (longPressTimerRef.current) {
          clearTimeout(longPressTimerRef.current);
          longPressTimerRef.current = null;
        }
        if (!isReorderMode && pickedIndex === null) {
        }
      }
    },
    [isReorderMode, pickedIndex]
  );

  const handlePointerUp = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    startPosRef.current = null;
  }, []);

  const selectForReorder = useCallback((index: number) => {
    if (pickedIndex === null) {
      setPickedIndex(index);
      setActiveIndex(index);
    } else if (pickedIndex !== index) {
      setTargetIndex(index);
      const from = Math.min(pickedIndex, index);
      const to = Math.max(pickedIndex, index);
      onReorderComplete(from, to);
      exitReorderMode();
    }
  }, [pickedIndex, onReorderComplete, exitReorderMode]);

  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

  return {
    isReorderMode,
    activeIndex,
    targetIndex,
    pickedIndex,
    enterReorderMode,
    exitReorderMode,
    confirmReorder,
    selectForReorder,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
  };
}

interface ReorderOverlayProps {
  isActive: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  message?: string;
}

export function ReorderOverlay({ isActive, onConfirm, onCancel, message }: ReorderOverlayProps) {
  if (!isActive) return null;

  return (
    <div className="fixed inset-x-0 top-0 z-50 bg-primary/90 text-primary-foreground px-4 py-3 flex items-center justify-between animate-slide-down">
      <div className="flex items-center gap-3">
        <GripVertical className="h-5 w-5" />
        <span className="text-sm font-medium">
          {message || "Modo reorder - pulsa un widget para moverlo"}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
          onClick={onCancel}
        >
          <X className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
          onClick={onConfirm}
        >
          <Check className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}