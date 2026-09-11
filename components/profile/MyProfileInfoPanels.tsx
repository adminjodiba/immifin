export function MyProfileSidePanel() {
  return (
    <aside className="ds2-profile-aside" aria-labelledby="ds2-profile-aside-heading">
      <div className="ds2-profile-aside-geometry" aria-hidden="true" />
      <div className="ds2-profile-aside-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" className="h-10 w-10" fill="none" stroke="currentColor" strokeWidth="1.6">
          <circle cx="12" cy="8" r="3.2" />
          <path d="M5 19.2c.7-3.4 3.4-5.4 7-5.4s6.3 2 7 5.4" strokeLinecap="round" />
        </svg>
      </div>
      <h2 id="ds2-profile-aside-heading" className="ds2-profile-aside-title">
        Your Profile
      </h2>
      <p className="ds2-profile-aside-copy">
        Your information helps IMMIFIN provide personalized insights, Visa Bulletin analysis, and
        relevant next steps.
      </p>
      <ul className="ds2-profile-aside-list">
        <li>
          <span className="ds2-profile-aside-row-icon ds2-profile-aside-row-icon-secure" aria-hidden="true">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M12 3.5 5.5 6.2v5.1c0 4 2.7 6.8 6.5 8.2 3.8-1.4 6.5-4.2 6.5-8.2V6.2L12 3.5Z" />
              <path d="m9.2 12 1.8 1.8 3.8-3.9" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span>
            <span className="ds2-profile-aside-row-title">Your data is secure</span>
            <span className="ds2-profile-aside-row-copy">
              Profile details stay in your IMMIFIN account and are used only for the tools you use.
            </span>
          </span>
        </li>
        <li>
          <span className="ds2-profile-aside-row-icon ds2-profile-aside-row-icon-control" aria-hidden="true">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
              <rect x="6" y="10" width="12" height="9" rx="1.6" />
              <path d="M8.5 10V8.2a3.5 3.5 0 0 1 7 0V10" strokeLinecap="round" />
            </svg>
          </span>
          <span>
            <span className="ds2-profile-aside-row-title">You&apos;re in control</span>
            <span className="ds2-profile-aside-row-copy">Update your information anytime.</span>
          </span>
        </li>
        <li>
          <span className="ds2-profile-aside-row-icon ds2-profile-aside-row-icon-insights" aria-hidden="true">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M6 16.5V12M12 16.5V8M18 16.5v-3" strokeLinecap="round" />
            </svg>
          </span>
          <span>
            <span className="ds2-profile-aside-row-title">Better insights</span>
            <span className="ds2-profile-aside-row-copy">
              Get more accurate calculator defaults and bulletin context.
            </span>
          </span>
        </li>
      </ul>
    </aside>
  );
}

export function MyProfileWhyUpdateCard() {
  return (
    <section className="ds2-profile-why-card" aria-labelledby="ds2-profile-why-heading">
      <span className="ds2-profile-why-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.7">
          <path d="M9 18h6M10 21h4" strokeLinecap="round" />
          <path d="M12 3a6.5 6.5 0 0 0-3.6 11.9c.5.4.9 1 .9 1.6V17h5.4v-.5c0-.6.4-1.2.9-1.6A6.5 6.5 0 0 0 12 3Z" />
        </svg>
      </span>
      <div className="ds2-profile-why-copy">
        <h2 id="ds2-profile-why-heading">Why keep your profile updated?</h2>
        <p>
          An up-to-date profile helps IMMIFIN provide more relevant immigration information,
          calculator defaults, Visa Bulletin context, and the notifications you enable.
        </p>
      </div>
      <div className="ds2-profile-why-visual" aria-hidden="true">
        <p className="ds2-profile-why-message">
          Stay informed.
          <br />
          Move forward.
        </p>
      </div>
    </section>
  );
}
