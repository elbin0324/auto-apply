/**
 * Fixed industry taxonomy values from the Active Jobs DB API.
 * These are the only valid values for ai_taxonomies_a_filter.
 */
export const INDUSTRY_TAXONOMY = [
  "Technology",
  "Healthcare",
  "Management & Leadership",
  "Finance & Accounting",
  "Human Resources",
  "Sales",
  "Marketing",
  "Customer Service & Support",
  "Education",
  "Legal",
  "Engineering",
  "Science & Research",
  "Trades",
  "Construction",
  "Manufacturing",
  "Logistics",
  "Creative & Media",
  "Hospitality",
  "Environmental & Sustainability",
  "Retail",
  "Data & Analytics",
  "Software",
  "Energy",
  "Agriculture",
  "Social Services",
  "Administrative",
  "Government & Public Sector",
  "Art & Design",
  "Food & Beverage",
  "Transportation",
  "Consulting",
  "Sports & Recreation",
  "Security & Safety",
] as const;

export type IndustryTaxonomy = (typeof INDUSTRY_TAXONOMY)[number];

export const EMPLOYMENT_TYPES = [
  { value: "full_time", label: "Full Time" },
  { value: "part_time", label: "Part Time" },
  { value: "contract", label: "Contract" },
  { value: "internship", label: "Internship" },
] as const;
