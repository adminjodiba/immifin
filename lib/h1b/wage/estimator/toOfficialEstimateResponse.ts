import type { OfficialOccupationDisplayEnricher } from "@/lib/h1b/occupations/officialOccupationDisplayEnrichment";
import type { OfficialWageLookupApiResponse } from "@/lib/h1b/wage/officialWageLookup.types";
import type { OfficialEstimatorResult } from "@/lib/h1b/wage/v2/estimateOfficialWageLevel";
import type {
  OfficialEstimateApiResponse,
  OfficialEstimateOccupationView,
  OfficialEstimateRequest,
} from "@/lib/h1b/wage/estimator/officialEstimate.types";

function toOccupationView(
  socCode: string,
  title: string,
  query: string,
  enricher: OfficialOccupationDisplayEnricher,
): OfficialEstimateOccupationView {
  const enrichment = enricher.enrich({ socCode, query });
  return {
    soc_code: socCode,
    title,
    group: enrichment.group,
    common_job_titles: enrichment.common_job_titles,
    typical_h1b: enrichment.typical_h1b,
    match_confidence: enrichment.match_confidence,
  };
}

export function toOfficialEstimateResponse(input: {
  request: OfficialEstimateRequest;
  wageLookup: OfficialWageLookupApiResponse;
  estimate: OfficialEstimatorResult | null;
  enricher: OfficialOccupationDisplayEnricher;
}): OfficialEstimateApiResponse {
  const officialTitle = input.wageLookup.wage?.occupation_title ?? null;
  const occupation = officialTitle
    ? toOccupationView(input.request.socCode, officialTitle, officialTitle, input.enricher)
    : null;

  if (input.wageLookup.outcome !== "AUTO" || !input.wageLookup.wage) {
    return {
      outcome: input.wageLookup.outcome,
      occupation,
      wage: null,
      estimate: null,
      estimate_error: null,
    };
  }

  const wage = input.wageLookup.wage;
  const wageView = {
    soc_code: wage.soc_code,
    occupation_title: wage.occupation_title,
    label: wage.label,
    level1: wage.level1,
    level2: wage.level2,
    level3: wage.level3,
    level4: wage.level4,
    average: wage.average,
  };

  if (!input.estimate || !input.estimate.ok) {
    return {
      outcome: "AUTO",
      occupation,
      wage: wageView,
      estimate: null,
      estimate_error: input.estimate
        ? { code: input.estimate.code, message: input.estimate.message }
        : null,
    };
  }

  return {
    outcome: "AUTO",
    occupation,
    wage: wageView,
    estimate: {
      estimated_level: input.estimate.estimatedLevel,
      confidence: input.estimate.confidence,
      location_label: input.estimate.locationLabel,
      used_annual_equivalent: input.estimate.usedAnnualEquivalent,
      salary_comparison: input.estimate.salaryComparison.map((row) => ({
        level: row.level,
        official_hourly: row.officialHourly,
        annual_wage: row.annualWage,
        position: row.position,
      })),
      reasoning: input.estimate.reasoning,
    },
    estimate_error: null,
  };
}
