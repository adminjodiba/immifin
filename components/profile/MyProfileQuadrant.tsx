import type { ReactNode } from "react";

export type MyProfileQuadrantAccent = "personal" | "immigration" | "greencard" | "notifications";

type MyProfileQuadrantProps = {
  accent: MyProfileQuadrantAccent;
  id: string;
  title: string;
  subtitle: string;
  icon: ReactNode;
  children: ReactNode;
};

function QuadrantWatermark({ accent }: { accent: MyProfileQuadrantAccent }) {
  if (accent === "personal") {
    return (
      <svg viewBox="0 0 200 126" className="ds2-profile-quad-watermark-svg" fill="none">
        <rect x="8" y="10" width="184" height="106" rx="12" fill="currentColor" opacity="0.2" />
        <rect x="8" y="10" width="184" height="106" rx="12" stroke="currentColor" strokeWidth="3.25" />
        <path d="M8 34h184" stroke="currentColor" strokeWidth="3.25" opacity="0.7" />
        <rect x="8" y="10" width="184" height="24" rx="12" fill="currentColor" opacity="0.28" />
        <rect x="8" y="22" width="184" height="12" fill="currentColor" opacity="0.28" />
        <rect x="22" y="44" width="46" height="54" rx="6" fill="currentColor" opacity="0.42" />
        <circle cx="45" cy="62" r="10" fill="currentColor" opacity="0.7" />
        <path
          d="M29 92c2.4-10 8.2-15 16-15s13.6 5 16 15"
          stroke="currentColor"
          strokeWidth="3.5"
          strokeLinecap="round"
          opacity="0.85"
        />
        <path d="M82 52h88M82 66h72M82 80h56" stroke="currentColor" strokeWidth="5" strokeLinecap="round" opacity="0.6" />
        <rect x="148" y="90" width="28" height="14" rx="3" fill="currentColor" opacity="0.42" />
      </svg>
    );
  }

  if (accent === "immigration") {
    return (
      <svg viewBox="0 0 128 168" className="ds2-profile-quad-watermark-svg" fill="none">
        <rect x="14" y="8" width="100" height="152" rx="12" fill="currentColor" opacity="0.2" />
        <rect x="14" y="8" width="100" height="152" rx="12" stroke="currentColor" strokeWidth="3.5" />
        <rect x="14" y="8" width="100" height="32" rx="12" fill="currentColor" opacity="0.28" />
        <rect x="14" y="24" width="100" height="16" fill="currentColor" opacity="0.28" />
        <text x="64" y="30" textAnchor="middle" fill="currentColor" fontSize="13" fontWeight="700">
          VISA
        </text>
        <circle cx="64" cy="78" r="22" fill="currentColor" opacity="0.16" />
        <circle cx="64" cy="78" r="22" stroke="currentColor" strokeWidth="3" opacity="0.75" />
        <path
          d="M42 78h44M64 56c8 8 12 14 12 22s-4 14-12 22M64 56c-8 8-12 14-12 22s4 14 12 22"
          stroke="currentColor"
          strokeWidth="2.75"
          opacity="0.7"
        />
        <rect x="34" y="110" width="28" height="22" rx="4" fill="currentColor" opacity="0.42" />
        <path d="M72 116h28M72 128h22" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" opacity="0.6" />
        <path d="M34 146h60" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" opacity="0.45" />
      </svg>
    );
  }

  if (accent === "greencard") {
    return (
      <svg viewBox="0 0 200 126" className="ds2-profile-quad-watermark-svg" fill="none">
        <rect x="8" y="10" width="184" height="106" rx="12" fill="currentColor" opacity="0.2" />
        <rect x="8" y="10" width="184" height="106" rx="12" stroke="currentColor" strokeWidth="3.25" />
        <path d="M8 34h184" stroke="currentColor" strokeWidth="3.25" opacity="0.7" />
        <rect x="8" y="10" width="184" height="24" rx="12" fill="currentColor" opacity="0.28" />
        <rect x="8" y="22" width="184" height="12" fill="currentColor" opacity="0.28" />
        <text x="100" y="26" textAnchor="middle" fill="currentColor" fontSize="9.5" fontWeight="700">
          PERMANENT RESIDENT
        </text>
        <rect x="22" y="44" width="46" height="54" rx="6" fill="currentColor" opacity="0.42" />
        <circle cx="45" cy="62" r="10" fill="currentColor" opacity="0.7" />
        <path
          d="M29 92c2.4-10 8.2-15 16-15s13.6 5 16 15"
          stroke="currentColor"
          strokeWidth="3.5"
          strokeLinecap="round"
          opacity="0.85"
        />
        <path d="M82 52h88M82 66h72M82 80h56" stroke="currentColor" strokeWidth="5" strokeLinecap="round" opacity="0.6" />
        <rect x="148" y="90" width="28" height="14" rx="3" fill="currentColor" opacity="0.42" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 180 180" className="ds2-profile-quad-watermark-svg" fill="none">
      <path
        d="M90 24a38 38 0 0 1 38 38v30l16 24H36l16-24V62A38 38 0 0 1 90 24Z"
        fill="currentColor"
        opacity="0.28"
      />
      <path
        d="M90 24a38 38 0 0 1 38 38v30l16 24H36l16-24V62A38 38 0 0 1 90 24Z"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinejoin="round"
      />
      <circle cx="90" cy="48" r="5" fill="currentColor" opacity="0.7" />
      <path d="M72 152a18 18 0 0 0 36 0" stroke="currentColor" strokeWidth="7" strokeLinecap="round" />
      <path
        d="M148 62c12 12 18 26 18 40M32 62C20 74 14 88 14 102"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
        opacity="0.7"
      />
    </svg>
  );
}

export function MyProfileQuadrant({
  accent,
  id,
  title,
  subtitle,
  icon,
  children,
}: MyProfileQuadrantProps) {
  const headerWatermark = accent === "personal" || accent === "immigration";
  const wellWatermark = accent === "greencard";
  const layerWatermark = accent === "notifications";

  return (
    <section className={`ds2-profile-quad ds2-profile-quad-${accent}`} id={id}>
      {layerWatermark ? (
        <div className="ds2-profile-quad-watermark ds2-profile-quad-watermark-layer" aria-hidden="true">
          <QuadrantWatermark accent={accent} />
        </div>
      ) : null}

      <div className="ds2-profile-quad-content">
        <header className="ds2-profile-quad-header">
          <span className="ds2-profile-quad-icon" aria-hidden="true">
            {icon}
          </span>
          <div className="ds2-profile-quad-heading">
            <h2 className="ds2-profile-quad-title">{title}</h2>
            <p className="ds2-profile-quad-subtitle">{subtitle}</p>
          </div>
          {headerWatermark ? (
            <div className="ds2-profile-quad-watermark ds2-profile-quad-watermark-header" aria-hidden="true">
              <QuadrantWatermark accent={accent} />
            </div>
          ) : null}
        </header>

        {children}

        {wellWatermark ? (
          <div className="ds2-profile-quad-watermark ds2-profile-quad-watermark-well" aria-hidden="true">
            <QuadrantWatermark accent={accent} />
          </div>
        ) : null}
      </div>
    </section>
  );
}
