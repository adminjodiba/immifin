/**
 * O*NET-SOC 2019 major group labels keyed by two-digit SOC prefix.
 * Used when importing or generating occupation seed records.
 */
export const SOC_MAJOR_GROUP_BY_PREFIX: Record<string, string> = {
  "11": "Management Occupations",
  "13": "Business & Financial Operations Occupations",
  "15": "Computer & Mathematical Occupations",
  "17": "Architecture & Engineering Occupations",
  "19": "Life, Physical, & Social Science Occupations",
  "21": "Community & Social Service Occupations",
  "23": "Legal Occupations",
  "25": "Educational Instruction & Library Occupations",
  "27": "Arts, Design, Entertainment, Sports, & Media Occupations",
  "29": "Healthcare Practitioners & Technical Occupations",
  "31": "Healthcare Support Occupations",
  "33": "Protective Service Occupations",
  "35": "Food Preparation & Serving Related Occupations",
  "37": "Building & Grounds Cleaning & Maintenance Occupations",
  "39": "Personal Care & Service Occupations",
  "41": "Sales & Related Occupations",
  "43": "Office & Administrative Support Occupations",
  "45": "Farming, Fishing, & Forestry Occupations",
  "47": "Construction & Extraction Occupations",
  "49": "Installation, Maintenance, & Repair Occupations",
  "51": "Production Occupations",
  "53": "Transportation & Material Moving Occupations",
  "55": "Military Specific Occupations",
};

export function groupFromSocCode(code: string): string {
  const prefix = code.trim().slice(0, 2);
  return SOC_MAJOR_GROUP_BY_PREFIX[prefix] ?? "Other Occupations";
}
