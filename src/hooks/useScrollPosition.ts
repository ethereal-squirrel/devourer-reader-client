import { useEffect, useRef, useCallback } from "react";

export interface UseScrollPositionOptions {
  onPositionChange: (position: number) => void;
  debounceMs?: number;
  throttleMs?: number;
  element?: HTMLElement | Window;
}

export interface UseScrollPositionResult {
  scrollToPosition: (position: number) => void;
  getCurrentPosition: () => number;
}

export function useScrollPosition({
  onPositionChange,
  debounceMs = 150,
  throttleMs = 16, // ~60fps
  element = window,
}: UseScrollPositionOptions): UseScrollPositionResult {
  const debounceTimerRef = useRef<NodeJS.Timeout>();
  const throttleTimerRef = useRef<NodeJS.Timeout>();
  const isThrottledRef = useRef(false);

  const getCurrentPosition = useCallback((): number => {
    if (element === window) {
      return window.scrollY;
    }
    return (element as HTMLElement).scrollTop;
  }, [element]);

  const scrollToPosition = useCallback((position: number) => {
    if (element === window) {
      window.scrollTo(0, position);
    } else {
      (element as HTMLElement).scrollTop = position;
    }
  }, [element]);

  const handleScroll = useCallback(() => {
    if (!isThrottledRef.current) {
      isThrottledRef.current = true;
      
      throttleTimerRef.current = setTimeout(() => {
        const currentPosition = getCurrentPosition();
        
        // Clear existing debounce timer
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
        
        // Debounce the position change callback
        debounceTimerRef.current = setTimeout(() => {
          onPositionChange(currentPosition);
        }, debounceMs);
        
        isThrottledRef.current = false;
      }, throttleMs);
    }
  }, [getCurrentPosition, onPositionChange, debounceMs, throttleMs]);

  useEffect(() => {
    const targetElement = element === window ? window : element;
    
    if (!targetElement) return;

    targetElement.addEventListener("scroll", handleScroll, { passive: true });
    
    return () => {
      targetElement.removeEventListener("scroll", handleScroll);
      
      // Clear timers on cleanup
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (throttleTimerRef.current) {
        clearTimeout(throttleTimerRef.current);
      }
    };
  }, [element, handleScroll]);

  return {
    scrollToPosition,
    getCurrentPosition,
  };
}