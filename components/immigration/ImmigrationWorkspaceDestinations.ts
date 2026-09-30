export type ImmigrationWorkspaceDestinations = {
  home: string;
  currentVisaBulletin: string;
  visaBulletinHistory: string;
  movementTracker: string;
  greenCardWait: string;
  citizenship: string;
  h1bWage: string;
  h1bLottery: string;
  visaStamping: string;
  aiAdvisor: string;
};

export const IMMIGRATION_WORKSPACE_PROTOTYPE_DESTINATIONS: ImmigrationWorkspaceDestinations = {
  home: "/immigration-v4",
  currentVisaBulletin: "/immigration-v4/visa-bulletin",
  visaBulletinHistory: "/immigration-v4/visa-bulletin-history",
  movementTracker: "/immigration-v4/visa-bulletin-movement",
  greenCardWait: "/immigration-v4/green-card-wait-time",
  citizenship: "/immigration-v4/citizenship-eligibility",
  h1bWage: "/immigration-v4/h1b-wage-level-estimator",
  h1bLottery: "/immigration-v4/h1b-lottery-odds-calculator",
  visaStamping: "/immigration-v4/visa-stamping-wait-map",
  aiAdvisor: "/immigration-v4/ai-advisor",
};

export const IMMIGRATION_WORKSPACE_PRODUCTION_DESTINATIONS: ImmigrationWorkspaceDestinations = {
  home: "/immigration",
  currentVisaBulletin: "/immigration/visa-bulletin",
  visaBulletinHistory: "/immigration/visa-bulletin-history",
  movementTracker: "/immigration/visa-bulletin-movement",
  greenCardWait: "/calculators/green-card-wait-time",
  citizenship: "/calculators/citizenship-eligibility",
  h1bWage: "/immigration/h1b-wage-level-estimator",
  h1bLottery: "/immigration/h1b-lottery-odds-calculator",
  visaStamping: "/immigration/visa-stamping-wait-map",
  aiAdvisor: "/intelligence",
};