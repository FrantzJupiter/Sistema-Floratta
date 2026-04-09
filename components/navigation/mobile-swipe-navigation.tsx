"use client";

import { useEffect, useEffectEvent, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

import {
  findMainNavigationIndex,
  mainNavigationItems,
} from "@/lib/navigation/main-navigation";

const INTERACTIVE_SELECTOR =
  "input, textarea, select, option, [contenteditable='true'], iframe, video, [data-swipe-nav-ignore]";
const MAX_DURATION_MS = 700;
const MAX_VERTICAL_DELTA = 112;
const MIN_HORIZONTAL_DELTA = 56;
const MOBILE_MEDIA_QUERY = "(max-width: 1023px) and (pointer: coarse)";
const MIN_HORIZONTAL_RATIO = 1.15;
const VERTICAL_CANCEL_DELTA = 32;
const VERTICAL_CANCEL_RATIO = 1.15;

type SwipeState = {
  isTracking: boolean;
  startTime: number;
  startX: number;
  startY: number;
};

function createInitialSwipeState(): SwipeState {
  return {
    isTracking: false,
    startTime: 0,
    startX: 0,
    startY: 0,
  };
}

function hasHorizontalScrollContext(element: HTMLElement | null) {
  let currentElement = element;

  while (currentElement && currentElement !== document.body) {
    const computedStyle = window.getComputedStyle(currentElement);
    const canScrollHorizontally =
      /(auto|scroll)/.test(computedStyle.overflowX) &&
      currentElement.scrollWidth > currentElement.clientWidth + 8;

    if (canScrollHorizontally) {
      return true;
    }

    currentElement = currentElement.parentElement;
  }

  return false;
}

function isSwipeNavigationEnabled() {
  return window.matchMedia(MOBILE_MEDIA_QUERY).matches;
}

function shouldIgnoreSwipeTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return true;
  }

  if (document.body.style.overflow === "hidden" || document.body.style.position === "fixed") {
    return true;
  }

  if (target.closest(INTERACTIVE_SELECTOR)) {
    return true;
  }

  return hasHorizontalScrollContext(target);
}

export function MobileSwipeNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const swipeStateRef = useRef<SwipeState>(createInitialSwipeState());
  const isNavigatingRef = useRef(false);

  const currentIndex = findMainNavigationIndex(pathname);

  const resetSwipeState = useEffectEvent(() => {
    swipeStateRef.current = createInitialSwipeState();
  });

  const navigateToSiblingTab = useEffectEvent((direction: "next" | "previous") => {
    if (currentIndex === -1 || isNavigatingRef.current) {
      return;
    }

    const nextIndex = direction === "next" ? currentIndex + 1 : currentIndex - 1;
    const nextItem = mainNavigationItems[nextIndex];

    if (!nextItem) {
      return;
    }

    isNavigatingRef.current = true;
    router.push(nextItem.href);
  });

  useEffect(() => {
    isNavigatingRef.current = false;
  }, [pathname]);

  useEffect(() => {
    if (currentIndex === -1) {
      return;
    }

    const previousItem = mainNavigationItems[currentIndex - 1];
    const nextItem = mainNavigationItems[currentIndex + 1];

    if (previousItem) {
      void router.prefetch(previousItem.href);
    }

    if (nextItem) {
      void router.prefetch(nextItem.href);
    }
  }, [currentIndex, router]);

  useEffect(() => {
    function handleTouchStart(event: TouchEvent) {
      if (
        currentIndex === -1 ||
        !isSwipeNavigationEnabled() ||
        event.touches.length !== 1 ||
        shouldIgnoreSwipeTarget(event.target)
      ) {
        resetSwipeState();
        return;
      }

      const touch = event.touches[0];

      swipeStateRef.current = {
        isTracking: true,
        startTime: Date.now(),
        startX: touch.clientX,
        startY: touch.clientY,
      };
    }

    function handleTouchMove(event: TouchEvent) {
      const swipeState = swipeStateRef.current;

      if (!swipeState.isTracking || event.touches.length !== 1) {
        return;
      }

      const touch = event.touches[0];
      const horizontalDelta = touch.clientX - swipeState.startX;
      const verticalDelta = touch.clientY - swipeState.startY;

      if (
        Math.abs(verticalDelta) > VERTICAL_CANCEL_DELTA &&
        Math.abs(verticalDelta) > Math.abs(horizontalDelta) * VERTICAL_CANCEL_RATIO
      ) {
        resetSwipeState();
      }
    }

    function handleTouchEnd(event: TouchEvent) {
      const swipeState = swipeStateRef.current;

      if (!swipeState.isTracking || event.changedTouches.length === 0) {
        resetSwipeState();
        return;
      }

      const touch = event.changedTouches[0];
      const horizontalDelta = touch.clientX - swipeState.startX;
      const verticalDelta = touch.clientY - swipeState.startY;
      const elapsedTime = Date.now() - swipeState.startTime;

      resetSwipeState();

      if (
        elapsedTime > MAX_DURATION_MS ||
        Math.abs(horizontalDelta) < MIN_HORIZONTAL_DELTA ||
        Math.abs(verticalDelta) > MAX_VERTICAL_DELTA ||
        Math.abs(horizontalDelta) < Math.abs(verticalDelta) * MIN_HORIZONTAL_RATIO
      ) {
        return;
      }

      navigateToSiblingTab(horizontalDelta < 0 ? "next" : "previous");
    }

    function handleTouchCancel() {
      resetSwipeState();
    }

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });
    window.addEventListener("touchcancel", handleTouchCancel, { passive: true });

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("touchcancel", handleTouchCancel);
    };
  }, [currentIndex]);

  return null;
}
