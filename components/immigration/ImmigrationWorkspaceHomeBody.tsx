import { ProtectedLink } from "@/components/auth/ProtectedLink";
import { DashboardCloseAction } from "@/components/dashboard/DashboardCloseAction";
import type { ImmigrationWorkspaceDestinations } from "@/components/immigration/ImmigrationWorkspaceDestinations";

function getJourneyCards(destinations: ImmigrationWorkspaceDestinations) {
  return [
  {
    key: "gc",
    title: "Green Card",
    copy: "IMMIFIN helps employment-based immigrants understand Visa Bulletin status, priority-date progress, and movement.",
    tools: [
      { href: destinations.currentVisaBulletin, label: "Current Visa Bulletin", icon: "doc" },
      { href: destinations.greenCardWait, label: "Green Card Wait Time", icon: "clock" },
      { href: destinations.movementTracker, label: "Movement Tracker", icon: "trend" },
      { href: destinations.visaBulletinHistory, label: "Visa Bulletin History", icon: "doc" },
    ],
  },
  {
    key: "h1b",
    title: "H-1B",
    copy: "Estimate likely H-1B wage level, lottery odds, and visa stamping wait times.",
    tools: [
      { href: destinations.h1bWage, label: "H-1B Wage Level Estimator", icon: "dollar" },
      { href: destinations.h1bLottery, label: "H-1B Lottery Odds Calculator", icon: "chart" },
      { href: destinations.visaStamping, label: "Visa Stamping Wait Times", icon: "pin" },
    ],
  },
  {
    key: "cit",
    title: "Citizenship",
    copy: "Check eligibility requirements for your U.S. citizenship journey.",
    tools: [{ href: destinations.citizenship, label: "Citizenship Calculator", icon: "doc" }],
  },
] as const;
}

function getPopularTools(destinations: ImmigrationWorkspaceDestinations) {
  return [
  {
    key: "bulletin",
    href: destinations.currentVisaBulletin,
    title: "Current Visa Bulletin",
    copy: "Live employment-based filing and final action dates.",
    icon: "doc",
  },
  {
    key: "wait",
    href: destinations.greenCardWait,
    title: "Green Card Wait Time",
    copy: "Estimate wait time from your priority date and category.",
    icon: "clock",
  },
  {
    key: "movement",
    href: destinations.movementTracker,
    title: "Movement Tracker",
    copy: "Month-over-month Visa Bulletin date movement.",
    icon: "trend",
  },
  {
    key: "wage",
    href: destinations.h1bWage,
    title: "H-1B Wage Level Estimator",
    copy: "Estimate likely H-1B wage level from role, location, and salary.",
    icon: "dollar",
  },
  {
    key: "lottery",
    href: destinations.h1bLottery,
    title: "H-1B Lottery Odds Calculator",
    copy: "Estimate lottery odds using wage level and master’s cap eligibility.",
    icon: "chart",
  },
  {
    key: "stamping",
    href: destinations.visaStamping,
    title: "Visa Stamping Wait Times",
    copy: "Compare approximate U.S. visa appointment wait times.",
    icon: "pin",
  },
  {
    key: "citizenship",
    href: destinations.citizenship,
    title: "Citizenship Calculator",
    copy: "Check eligibility requirements for U.S. citizenship.",
    icon: "person",
  },
] as const;
}

type GlyphName = "doc" | "clock" | "trend" | "dollar" | "chart" | "pin" | "person";

function IconLines() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h10M4 12h16M4 18h8" />
    </svg>
  );
}

function IconDoc() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 4.5h10A1.5 1.5 0 0 1 18.5 6v12A1.5 1.5 0 0 1 17 19.5H7A1.5 1.5 0 0 1 5.5 18V6A1.5 1.5 0 0 1 7 4.5Z" />
      <path strokeLinecap="round" d="M8.5 9h7M8.5 12.5h5" />
    </svg>
  );
}

function IconBriefcase() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 10V8.2A3.2 3.2 0 0 1 11.2 5h1.6A3.2 3.2 0 0 1 16 8.2V10" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M5.5 10.5h13v8A1.5 1.5 0 0 1 17 20H7a1.5 1.5 0 0 1-1.5-1.5v-8Z" />
    </svg>
  );
}

function IconPerson() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <circle cx="12" cy="8" r="2.6" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.8 18.5c.7-3 2.7-4.5 5.2-4.5s4.5 1.5 5.2 4.5" />
    </svg>
  );
}

function IconChart() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 19V10M12 19V5M19 19v-7" />
    </svg>
  );
}

function IconTrend() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16.5 9.2 11l3.4 3.2L20 7.5" />
      <path strokeLinecap="round" d="M14.5 7.5H20V13" />
    </svg>
  );
}

function IconClock() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <circle cx="12" cy="12" r="7.2" />
      <path strokeLinecap="round" d="M12 8.2V12l2.6 1.6" />
    </svg>
  );
}

function IconDollar() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path strokeLinecap="round" d="M12 5.5v13" />
      <path strokeLinecap="round" d="M15.2 8.2c-.6-1.1-1.7-1.7-3.2-1.7-1.8 0-3 1-3 2.4 0 3.4 6.2 1.6 6.2 5 0 1.5-1.3 2.6-3.2 2.6-1.6 0-2.8-.7-3.4-1.8" />
    </svg>
  );
}

function IconPin() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s6-5.1 6-10a6 6 0 1 0-12 0c0 4.9 6 10 6 10Z" />
      <circle cx="12" cy="11" r="1.8" />
    </svg>
  );
}

function IconBell() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.8 16.5h10.4l-.8-1.2V11a4.6 4.6 0 0 0-9.2 0v4.3l-.4 1.2Z" />
      <path strokeLinecap="round" d="M10.4 16.6a1.6 1.6 0 0 0 3.2 0" />
    </svg>
  );
}

function IconArrow() {
  return (
    <svg className="ds2-imm-v4-tool-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

function Glyph({ name }: { name: GlyphName }) {
  if (name === "clock") return <IconClock />;
  if (name === "trend") return <IconTrend />;
  if (name === "dollar") return <IconDollar />;
  if (name === "chart") return <IconChart />;
  if (name === "pin") return <IconPin />;
  if (name === "person") return <IconPerson />;
  return <IconDoc />;
}

function JourneyGlyph({ name }: { name: "gc" | "h1b" | "cit" }) {
  if (name === "gc") return <IconDoc />;
  if (name === "h1b") return <IconBriefcase />;
  return <IconPerson />;
}

function DecoResidentCard() {
  return (
    <svg className="ds2-imm-v4-deco-svg ds2-imm-v4-deco-card" viewBox="0 0 180 118" aria-hidden="true">
      <rect x="6" y="10" width="168" height="98" rx="10" fill="rgba(255,255,255,0.55)" stroke="currentColor" strokeWidth="1.2" />
      <rect x="6" y="10" width="168" height="18" rx="10" fill="currentColor" opacity="0.18" />
      <rect x="18" y="40" width="38" height="46" rx="5" fill="currentColor" opacity="0.16" />
      <rect x="66" y="42" width="86" height="6" rx="3" fill="currentColor" opacity="0.2" />
      <rect x="66" y="54" width="72" height="5" rx="2.5" fill="currentColor" opacity="0.14" />
      <rect x="66" y="65" width="78" height="5" rx="2.5" fill="currentColor" opacity="0.12" />
      <rect x="66" y="76" width="54" height="5" rx="2.5" fill="currentColor" opacity="0.1" />
    </svg>
  );
}

function JourneyDeco({ name }: { name: "gc" | "h1b" | "cit" }) {
  if (name === "gc") return <DecoResidentCard />;
  return null;
}

export function ImmigrationWorkspaceHomeBody({ destinations }: { destinations: ImmigrationWorkspaceDestinations }) {
  const journeyCards = getJourneyCards(destinations);
  const popularTools = getPopularTools(destinations);
  return (
    <div className="ds2-imm-v4-body">
      <section className="ds2-imm-v4-section ds2-imm-v4-section-journey" aria-labelledby="imm-v4-journey-heading">
        <div className="ds2-imm-v4-section-head">
          <span className="ds2-imm-v4-section-icon">
            <IconLines />
          </span>
          <div className="ds2-imm-v4-section-head-copy">
            <h2 id="imm-v4-journey-heading" className="ds2-imm-v4-heading">
              Explore Your Immigration Journey
            </h2>
            <p className="ds2-imm-v4-lead">
              Find which path applies to you, then open the IMMIFIN tool that answers the next question.
            </p>
          </div>
          <DashboardCloseAction href="/" />
        </div>
        <div className="ds2-imm-v4-journey-grid">
          {journeyCards.map((card) => (
            <article
              key={card.key}
              className={`ds2-imm-v4-journey ds2-imm-v4-journey-${card.key}`}
            >
              <div className="ds2-imm-v4-journey-deco" aria-hidden="true">
                <JourneyDeco name={card.key} />
              </div>
              <div className="ds2-imm-v4-journey-head">
                <span className="ds2-imm-v4-journey-icon">
                  <JourneyGlyph name={card.key} />
                </span>
                <h3 className="ds2-imm-v4-journey-title">{card.title}</h3>
              </div>
              <p className="ds2-imm-v4-journey-copy">{card.copy}</p>
              <ul className="ds2-imm-v4-journey-tools">
                {card.tools.map((tool) => (
                  <li key={tool.href}>
                    <ProtectedLink href={tool.href} className="ds2-imm-v4-inline-link">
                      <span className="ds2-imm-v4-inline-link-icon">
                        <Glyph name={tool.icon} />
                      </span>
                      <span className="ds2-imm-v4-inline-link-label">{tool.label}</span>
                      <IconArrow />
                    </ProtectedLink>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="ds2-imm-v4-section ds2-imm-v4-section-discover" aria-labelledby="imm-v4-tools-heading" id="imm-v4-tools">
        <div className="ds2-imm-v4-section-head">
          <span className="ds2-imm-v4-section-icon">
            <IconChart />
          </span>
          <div>
            <h2 id="imm-v4-tools-heading" className="ds2-imm-v4-heading">
              Popular Immigration Tools
            </h2>
            <p className="ds2-imm-v4-lead">
              Open the IMMIFIN tool that answers the next question.
            </p>
          </div>
        </div>
        <div className="ds2-imm-v4-tools-grid">
          {popularTools.map((tool) => (
            <ProtectedLink
              key={tool.href}
              href={tool.href}
              className={`ds2-imm-v4-toolcard ds2-imm-v4-toolcard-${tool.key}`}
            >
              <span className="ds2-imm-v4-toolcard-icon">
                <Glyph name={tool.icon} />
              </span>
              <span className="ds2-imm-v4-toolcard-text">
                <span className="ds2-imm-v4-toolcard-title">{tool.title}</span>
                <span className="ds2-imm-v4-toolcard-copy">{tool.copy}</span>
              </span>
              <span className="ds2-imm-v4-toolcard-chevron" aria-hidden="true">
                ›
              </span>
            </ProtectedLink>
          ))}
        </div>
      </section>

      <section className="ds2-imm-v4-informed" aria-labelledby="imm-v4-informed-heading">
        <div className="ds2-imm-v4-informed-deco" aria-hidden="true" />
        <div className="ds2-imm-v4-informed-inner">
          <span className="ds2-imm-v4-informed-mark">
            <IconBell />
          </span>
          <div>
            <h2 id="imm-v4-informed-heading" className="ds2-imm-v4-informed-title">
              Stay Informed
            </h2>
            <p className="ds2-imm-v4-informed-text">
              Know where you stand. Stay informed when things change.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
