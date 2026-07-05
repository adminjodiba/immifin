"use client";

import { useEffect, useState, type ReactNode, type RefObject } from "react";

export type HistoryDateRangeKey = "6" | "12" | "24" | "60" | "all";

/** Fallback per-month width when viewport is not measured yet. */
export const HISTORY_PX_PER_MONTH = 80;

/** Initial visible months for horizontally scrollable long ranges. */
export const HISTORY_INITIAL_VISIBLE_MONTHS = 12;

export const HISTORY_MIN_PX_PER_MONTH = 48;

export function isHistoryScrollableDateRange(range: HistoryDateRangeKey): boolean {
  return range === "24" || range === "60" || range === "all";
}

export function isHistoryHorizontallyScrollable(
  dateRange: HistoryDateRangeKey,
  monthCount: number,
): boolean {
  return isHistoryScrollableDateRange(dateRange) && monthCount > HISTORY_INITIAL_VISIBLE_MONTHS;
}

export function getHistoryPxPerMonth(viewportWidth: number): number {
  if (viewportWidth <= 0) return HISTORY_PX_PER_MONTH;
  return Math.max(
    HISTORY_MIN_PX_PER_MONTH,
    viewportWidth / HISTORY_INITIAL_VISIBLE_MONTHS,
  );
}

export function getHistoryScrollableChartWidth(monthCount: number, pxPerMonth: number, minWidth = 320): number {
  return Math.max(monthCount * pxPerMonth, minWidth);
}

export function useHistoryViewportWidth(
  viewportRef: RefObject<HTMLDivElement | null>,
  triggerKey: string | number,
): number {
  const [viewportWidth, setViewportWidth] = useState(0);

  useEffect(() => {
    const element = viewportRef.current;
    if (!element) return;

    const update = () => setViewportWidth(element.clientWidth);
    update();

    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, [viewportRef, triggerKey]);

  return viewportWidth;
}

export function useHistoryTimelineLayout(
  viewportRef: RefObject<HTMLDivElement | null>,
  monthCount: number,
  isScrollable: boolean,
  triggerKey: string | number,
) {
  const viewportWidth = useHistoryViewportWidth(viewportRef, triggerKey);
  const pxPerMonth = isScrollable && viewportWidth > 0
    ? getHistoryPxPerMonth(viewportWidth)
    : HISTORY_PX_PER_MONTH;
  const chartWidth = isScrollable
    ? getHistoryScrollableChartWidth(monthCount, pxPerMonth)
    : 0;

  return {
    viewportWidth,
    pxPerMonth,
    chartWidth,
    isLayoutReady: !isScrollable || viewportWidth > 0,
  };
}

export function useHistoryScrollToRecent(
  scrollRef: RefObject<HTMLDivElement | null>,
  enabled: boolean,
  triggerKey: string | number,
) {
  useEffect(() => {
    if (!enabled) return;

    const scrollToRecent = () => {
      const container = scrollRef.current;
      if (!container) return;
      container.scrollLeft = container.scrollWidth - container.clientWidth;
    };

    scrollToRecent();
    requestAnimationFrame(() => requestAnimationFrame(scrollToRecent));
  }, [enabled, triggerKey, scrollRef]);
}

export function useHistoryScrollToTop(
  scrollRef: RefObject<HTMLDivElement | null>,
  enabled: boolean,
  triggerKey: string | number,
) {
  useEffect(() => {
    if (!enabled) return;

    const scrollToTop = () => {
      const container = scrollRef.current;
      if (!container) return;
      container.scrollTop = 0;
    };

    scrollToTop();
    requestAnimationFrame(scrollToTop);
  }, [enabled, triggerKey, scrollRef]);
}

export function HistoryScrollableTimeline({
  scrollRef,
  chartWidth,
  chartHeight,
  ariaLabel,
  children,
}: {
  scrollRef: RefObject<HTMLDivElement | null>;
  chartWidth: number;
  chartHeight: number;
  ariaLabel: string;
  children: ReactNode;
}) {
  return (
    <div
      ref={scrollRef}
      className="w-full overflow-x-auto overflow-y-hidden overscroll-x-contain"
      aria-label={ariaLabel}
    >
      <div style={{ width: chartWidth, height: chartHeight, minWidth: chartWidth }}>
        {children}
      </div>
    </div>
  );
}
