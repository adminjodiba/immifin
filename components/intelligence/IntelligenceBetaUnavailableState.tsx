import Link from "next/link";



type IntelligenceBetaUnavailableStateProps = {

  embedded?: boolean;

};



/**

 * Power user who is not invited to the Intelligence controlled beta.

 * Does not call the Intelligence API or imply self-service enrollment.

 */

export function IntelligenceBetaUnavailableState({

  embedded = false,

}: IntelligenceBetaUnavailableStateProps) {

  const content = (

    <div className={embedded ? "space-y-5" : "mx-auto w-full max-w-xl space-y-6"}>

      <header>

        <p className="ds2-workspace-kicker">Limited beta</p>

        <h2 className={`${embedded ? "ds2-workspace-heading text-lg" : "ds2-workspace-heading"} mt-2`}>

          IMMIFIN AI Advisor is in limited beta

        </h2>

        <p className="mt-3 text-sm leading-relaxed text-[var(--immifin-ds2-text-muted)] sm:text-base">

          IMMIFIN AI Advisor is currently available to a small group of invited Power members

          while we complete final validation.

        </p>

      </header>



      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">

        <Link href="/dashboard" className="btn-primary">

          Back to Immigration Dashboard

        </Link>

        <a href="mailto:support@immifin.com" className="btn-secondary">

          Contact support

        </a>

      </div>

    </div>

  );



  if (embedded) {

    return content;

  }



  return (

    <section className="workspace-section" aria-labelledby="intelligence-beta-title">

      <div className="container-main py-6 sm:py-8">

        <h1 id="intelligence-beta-title" className="sr-only">

          IMMIFIN AI Advisor

        </h1>

        {content}

      </div>

    </section>

  );

}


