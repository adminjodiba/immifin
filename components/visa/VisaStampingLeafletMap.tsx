"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, Tooltip, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import {
  formatDisplayDate,
  getMapBoundsForCountry,
  getMapViewForCountry,
  getPinColorBand,
  getWaitTrend,
  INDIA_MAP_VIEW,
  PIN_COLOR_STYLES,
  PIN_MARKER_HEX,
  type PinColorBand,
  type VisaStampingPost,
} from "@/lib/visa/visaStampingWaitTimes";

const ENGLISH_MAP_TILE_URL = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
const ENGLISH_MAP_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

type CountryFilter = string | "Worldwide";

type VisaStampingLeafletMapProps = {
  posts: VisaStampingPost[];
  countryFilter: CountryFilter;
  selectedPostId: string | null;
  mapFocusPostId: string | null;
  onSelectPost: (postId: string) => void;
};

function createDotIcon(waitDays: number, isSelected: boolean): L.DivIcon {
  const band = getPinColorBand(waitDays);
  const color = PIN_MARKER_HEX[band];
  const size = isSelected ? 14 : 12;
  const ring = isSelected ? `0 0 0 3px ${color}88` : `0 0 0 2px ${color}`;

  return L.divIcon({
    className: "",
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:${ring};"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2)],
  });
}

function PinLegendOverlay() {
  const bands: PinColorBand[] = ["green", "yellow", "orange", "red"];

  return (
    <div className="pointer-events-none absolute bottom-3 left-3 z-[1000] rounded-lg border border-white/80 bg-white/95 p-2.5 shadow-sm backdrop-blur-sm">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Wait time</p>
      <ul className="mt-1.5 space-y-1">
        {bands.map((band) => (
          <li key={band} className="flex items-center gap-2 text-[11px] text-slate-700">
            <span
              className="h-2.5 w-2.5 rounded-full ring-1 ring-white"
              style={{ backgroundColor: PIN_MARKER_HEX[band] }}
              aria-hidden="true"
            />
            {PIN_COLOR_STYLES[band].label}
          </li>
        ))}
      </ul>
    </div>
  );
}

function MapViewController({
  countryFilter,
  mapFocusPostId,
  posts,
}: {
  countryFilter: CountryFilter;
  mapFocusPostId: string | null;
  posts: VisaStampingPost[];
}) {
  const map = useMap();

  useEffect(() => {
    if (countryFilter === "Worldwide") {
      const view = getMapViewForCountry("Worldwide");
      map.flyTo(view.center, view.zoom, { duration: 0.85 });
      return;
    }

    const countryBounds = getMapBoundsForCountry(countryFilter);
    if (countryBounds) {
      map.flyToBounds(countryBounds, {
        padding: [36, 36],
        maxZoom: countryFilter === "Singapore" ? 12 : 7,
        duration: 0.85,
      });
      return;
    }

    if (posts.length > 0) {
      const bounds = L.latLngBounds(posts.map((post) => [post.latitude, post.longitude] as [number, number]));
      map.flyToBounds(bounds.pad(0.5), { padding: [36, 36], maxZoom: 7, duration: 0.85 });
      return;
    }

    const view = getMapViewForCountry(countryFilter);
    map.flyTo(view.center, view.zoom, { duration: 0.85 });
  }, [countryFilter, map, posts]);

  useEffect(() => {
    if (!mapFocusPostId) {
      return;
    }

    const post = posts.find((entry) => entry.id === mapFocusPostId);
    if (!post) {
      return;
    }

    // Zoom into the selected consulate, but keep city-level framing.
    const targetZoom = countryFilter === "Worldwide" ? 4 : Math.min(Math.max(map.getZoom(), 6), 10);
    map.flyTo([post.latitude, post.longitude], targetZoom, { duration: 0.65 });
  }, [mapFocusPostId, posts, countryFilter, map]);

  return null;
}

function PostMarker({
  post,
  isSelected,
  isFocused,
  onSelect,
}: {
  post: VisaStampingPost;
  isSelected: boolean;
  isFocused: boolean;
  onSelect: (postId: string) => void;
}) {
  const markerRef = useRef<L.Marker>(null);
  const trend = getWaitTrend(post.waitDays, post.previousWaitDays);
  const band = getPinColorBand(post.waitDays);
  const markerColor = PIN_MARKER_HEX[band];

  useEffect(() => {
    if (isFocused) {
      markerRef.current?.openPopup();
    } else {
      markerRef.current?.closePopup();
    }
  }, [isFocused]);

  return (
    <Marker
      ref={markerRef}
      position={[post.latitude, post.longitude]}
      icon={createDotIcon(post.waitDays, isSelected)}
      zIndexOffset={isSelected ? 1000 : 0}
      eventHandlers={{
        click: () => onSelect(post.id),
      }}
    >
      <Tooltip
        permanent
        direction="top"
        offset={[0, -10]}
        className={`visa-stamping-pin-tooltip${isSelected ? " visa-stamping-pin-tooltip--selected" : ""}`}
      >
        <span className="visa-stamping-pin-tooltip__content">
          <span
            className="visa-stamping-pin-tooltip__dot"
            style={{ backgroundColor: markerColor, boxShadow: `0 0 0 1px ${markerColor}` }}
            aria-hidden="true"
          />
          {post.city} — {post.waitDays} days
        </span>
      </Tooltip>
      <Popup className="visa-stamping-popup" minWidth={200}>
        <div className="space-y-1 text-sm text-slate-800">
          <p className="font-semibold text-slate-900">
            {post.city} / {post.postName}
          </p>
          <p>
            <span className="text-slate-500">Wait:</span> {post.waitDays} days
          </p>
          <p>
            <span className="text-slate-500">Visa type:</span> {post.visaType}
          </p>
          <p>
            <span className="text-slate-500">Appointment type:</span> {post.appointmentType}
          </p>
          <p>
            <span className="text-slate-500">Trend:</span> {trend}
          </p>
          <p>
            <span className="text-slate-500">Last updated:</span> {formatDisplayDate(post.lastUpdated)}
          </p>
        </div>
      </Popup>
    </Marker>
  );
}

export default function VisaStampingLeafletMap({
  posts,
  countryFilter,
  selectedPostId,
  mapFocusPostId,
  onSelectPost,
}: VisaStampingLeafletMapProps) {
  const initialView = getMapViewForCountry(countryFilter);
  const initialZoom = countryFilter === "India" ? INDIA_MAP_VIEW.zoom : initialView.zoom;

  if (posts.length === 0) {
    return (
      <div className="relative flex h-[360px] w-full items-center justify-center rounded-b-2xl bg-slate-50 p-6 text-center text-sm text-slate-600 xl:absolute xl:inset-0 xl:h-auto">
        No consulates match your filters. Try another country or clear search.
      </div>
    );
  }

  return (
    <div className="relative h-[360px] w-full overflow-hidden rounded-b-2xl xl:absolute xl:inset-0 xl:h-auto">
      <MapContainer
        center={initialView.center}
        zoom={initialZoom}
        scrollWheelZoom
        className="h-full w-full z-0"
        attributionControl
      >
        <TileLayer attribution={ENGLISH_MAP_ATTRIBUTION} url={ENGLISH_MAP_TILE_URL} />
        <MapViewController countryFilter={countryFilter} mapFocusPostId={mapFocusPostId} posts={posts} />
        {posts.map((post) => (
          <PostMarker
            key={post.id}
            post={post}
            isSelected={selectedPostId === post.id}
            isFocused={mapFocusPostId === post.id}
            onSelect={onSelectPost}
          />
        ))}
      </MapContainer>
      <PinLegendOverlay />
    </div>
  );
}
