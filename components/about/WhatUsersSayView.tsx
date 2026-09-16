"use client";

import Link from "next/link";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { landingV3ContentGridClass } from "@/components/landing-v3/landingV3Layout";
import type {
  PublicWhatUsersSayTestimonial,
  WhatUsersSayDailySnapshot,
} from "@/lib/feedback/whatUsersSay";

const ROW_META = [
  {
    title: "Planning with Confidence",
    hint: "Tools that make complex steps simple.",
    tone: "blue",
    direction: "left" as const,
    speedPx: 46,
  },
  {
    title: "Immigration Made Clear",
    hint: "Stay informed. Stay prepared.",
    tone: "green",
    direction: "right" as const,
    speedPx: 40,
  },
  {
    title: "Financial Confidence",
    hint: "Plan your future with confidence.",
    tone: "gold",
    direction: "left" as const,
    speedPx: 44,
  },
  {
    title: "Life Made Simpler",
    hint: "You're not alone on this journey.",
    tone: "violet",
    direction: "right" as const,
    speedPx: 38,
  },
] as const;

const AVATAR_COLORS = ["#2563eb", "#0f766e", "#b45309", "#7c3aed", "#be185d", "#0369a1"];
const CARD_READ_MORE_CHARS = 90;

function formatTestimonialDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric" }).format(date);
}

function initialsFor(name: string): string {
  const parts = name
    .replace(/[.]/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) {
    return "IU";
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}

function avatarColor(name: string): string {
  let hash = 0;
  for (let index = 0; index < name.length; index += 1) {
    hash = (hash + name.charCodeAt(index) * (index + 1)) % AVATAR_COLORS.length;
  }
  return AVATAR_COLORS[hash] ?? AVATAR_COLORS[0];
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="ds2-wus-stars" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, index) => (
        <span key={index} className={index < rating ? "is-on" : undefined} aria-hidden="true">
          ★
        </span>
      ))}
    </span>
  );
}

function TestimonialModal({
  item,
  onClose,
}: {
  item: PublicWhatUsersSayTestimonial;
  onClose: () => void;
}) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return (
    <div className="ds2-wus-modal-root">
      <button type="button" className="ds2-wus-modal-backdrop" aria-label="Close dialog" onClick={onClose} />
      <div className="ds2-wus-modal" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <Stars rating={item.rating} />
        <p id={titleId} className="ds2-wus-modal-quote">
          “{item.feedbackText}”
        </p>
        <p className="ds2-wus-modal-meta">
          <strong>{item.displayName}</strong>
          <span>{formatTestimonialDate(item.createdAt)}</span>
        </p>
        <button ref={closeRef} type="button" className="ds2-wus-modal-close" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}

function TestimonialCard({
  item,
  onReadMore,
}: {
  item: PublicWhatUsersSayTestimonial;
  onReadMore: (item: PublicWhatUsersSayTestimonial) => void;
}) {
  const needsReadMore = item.feedbackText.length > CARD_READ_MORE_CHARS;
  const dateLabel = formatTestimonialDate(item.createdAt);

  return (
    <article className="ds2-wus-card">
      <div className="ds2-wus-card-top">
        <Stars rating={item.rating} />
        <p className="ds2-wus-quote">“{item.feedbackText}”</p>
      </div>
      <footer className="ds2-wus-card-footer">
        <span className="ds2-wus-avatar" style={{ backgroundColor: avatarColor(item.displayName) }} aria-hidden="true">
          {initialsFor(item.displayName)}
        </span>
        <span className="ds2-wus-card-meta">
          <strong>{item.displayName}</strong>
          {dateLabel ? <span> · {dateLabel}</span> : null}
        </span>
        {needsReadMore ? (
          <button type="button" className="ds2-wus-readmore" onClick={() => onReadMore(item)}>
            Read more →
          </button>
        ) : null}
      </footer>
    </article>
  );
}

function TickerRow({
  items,
  meta,
  onReadMore,
}: {
  items: PublicWhatUsersSayTestimonial[];
  meta: (typeof ROW_META)[number];
  onReadMore: (item: PublicWhatUsersSayTestimonial) => void;
}) {
  const [paused, setPaused] = useState(false);
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!viewport || !track) {
      return;
    }

    function updateTravel() {
      if (!viewport || !track) {
        return;
      }
      const laneWidth = viewport.clientWidth;
      const trackWidth = track.scrollWidth;
      const fromPx = meta.direction === "left" ? laneWidth : -trackWidth;
      const toPx = meta.direction === "left" ? -trackWidth : laneWidth;
      track.style.setProperty("--ds2-wus-from", `${fromPx}px`);
      track.style.setProperty("--ds2-wus-to", `${toPx}px`);
      track.style.animationDuration = `${Math.max(16, (laneWidth + trackWidth) / meta.speedPx)}s`;
    }

    updateTravel();
    const observer = new ResizeObserver(updateTravel);
    observer.observe(viewport);
    observer.observe(track);
    return () => observer.disconnect();
  }, [items.length, meta.direction, meta.speedPx]);

  return (
    <section
      className={`ds2-wus-row ds2-wus-row-${meta.tone}${paused ? " is-paused" : ""}`}
      aria-label={meta.title}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setPaused(false);
        }
      }}
    >
      <div className={`${landingV3ContentGridClass} ds2-wus-row-inner`}>
        <div className="ds2-wus-row-label">
          <p>{meta.title}</p>
          <span>{meta.hint}</span>
        </div>
        <div className="ds2-wus-viewport" ref={viewportRef}>
          <div
            ref={trackRef}
            className={
              meta.direction === "left"
                ? "ds2-wus-track ds2-wus-track-left"
                : "ds2-wus-track ds2-wus-track-right"
            }
          >
            {items.length > 0 ? (
              <div className="ds2-wus-track-set">
                {items.map((item) => (
                  <TestimonialCard key={item.key} item={item} onReadMore={onReadMore} />
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

export function WhatUsersSayView({ snapshot }: { snapshot: WhatUsersSayDailySnapshot }) {
  const [openItem, setOpenItem] = useState<PublicWhatUsersSayTestimonial | null>(null);

  return (
    <div className="ds2-wus">
      {ROW_META.map((meta, index) => (
        <TickerRow
          key={meta.tone}
          items={snapshot.rows[index] ?? []}
          meta={meta}
          onReadMore={setOpenItem}
        />
      ))}

      <div className={`${landingV3ContentGridClass} ds2-wus-cta`}>
        <Link href="/about/share-feedback" className="ds2-wus-cta-button">
          Share Your Feedback →
        </Link>
        <p>Be part of the IMMIFIN community. We&apos;d love to hear your story.</p>
      </div>

      {openItem ? <TestimonialModal item={openItem} onClose={() => setOpenItem(null)} /> : null}
    </div>
  );
}
