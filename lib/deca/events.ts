// DECA competitive events catalog.
// Ported from the DECA Study Hub design (deca-events.js).

export interface DecaEvent {
  code: string
  name: string
  format: 'roleplay' | 'written'
  team: boolean
  cluster: string
  category: string
}

export const EVENTS: DecaEvent[] = [
  { code: "PBM", name: "Principles of Business Management and Administration", format: "roleplay", team: false, cluster: "core", category: "Principles" },
  { code: "PFN", name: "Principles of Finance", format: "roleplay", team: false, cluster: "fi", category: "Principles" },
  { code: "PHT", name: "Principles of Hospitality and Tourism", format: "roleplay", team: false, cluster: "ht", category: "Principles" },
  { code: "PMK", name: "Principles of Marketing", format: "roleplay", team: false, cluster: "mk", category: "Principles" },
  { code: "PFL", name: "Personal Financial Literacy", format: "roleplay", team: false, cluster: "fi", category: "Personal Financial Literacy" },
  { code: "BLTDM", name: "Business Law and Ethics Team Decision Making", format: "roleplay", team: true, cluster: "bm", category: "Team Decision Making" },
  { code: "BTDM", name: "Buying and Merchandising Team Decision Making", format: "roleplay", team: true, cluster: "mk", category: "Team Decision Making" },
  { code: "ETDM", name: "Entrepreneurship Team Decision Making", format: "roleplay", team: true, cluster: "en", category: "Team Decision Making" },
  { code: "FTDM", name: "Financial Services Team Decision Making", format: "roleplay", team: true, cluster: "fi", category: "Team Decision Making" },
  { code: "HTDM", name: "Hospitality Services Team Decision Making", format: "roleplay", team: true, cluster: "ht", category: "Team Decision Making" },
  { code: "MTDM", name: "Marketing Management Team Decision Making", format: "roleplay", team: true, cluster: "mk", category: "Team Decision Making" },
  { code: "STDM", name: "Sports and Entertainment Marketing Team Decision Making", format: "roleplay", team: true, cluster: "mk", category: "Team Decision Making" },
  { code: "TTDM", name: "Travel and Tourism Team Decision Making", format: "roleplay", team: true, cluster: "ht", category: "Team Decision Making" },
  { code: "ACT", name: "Accounting Applications Series", format: "roleplay", team: false, cluster: "fi", category: "Individual Series" },
  { code: "AAM", name: "Apparel and Accessories Marketing Series", format: "roleplay", team: false, cluster: "mk", category: "Individual Series" },
  { code: "ASM", name: "Automotive Services Marketing Series", format: "roleplay", team: false, cluster: "mk", category: "Individual Series" },
  { code: "BFS", name: "Business Finance Series", format: "roleplay", team: false, cluster: "fi", category: "Individual Series" },
  { code: "BSM", name: "Business Services Marketing Series", format: "roleplay", team: false, cluster: "mk", category: "Individual Series" },
  { code: "ENT", name: "Entrepreneurship Series", format: "roleplay", team: false, cluster: "en", category: "Individual Series" },
  { code: "FMS", name: "Food Marketing Series", format: "roleplay", team: false, cluster: "mk", category: "Individual Series" },
  { code: "HLM", name: "Hotel and Lodging Management Series", format: "roleplay", team: false, cluster: "ht", category: "Individual Series" },
  { code: "HRM", name: "Human Resources Management Series", format: "roleplay", team: false, cluster: "bm", category: "Individual Series" },
  { code: "MMS", name: "Marketing Management Series", format: "roleplay", team: false, cluster: "mk", category: "Individual Series" },
  { code: "QSRM", name: "Quick Serve Restaurant Management Series", format: "roleplay", team: false, cluster: "ht", category: "Individual Series" },
  { code: "RFSM", name: "Restaurant and Food Service Management Series", format: "roleplay", team: false, cluster: "ht", category: "Individual Series" },
  { code: "RMS", name: "Retail Merchandising Series", format: "roleplay", team: false, cluster: "mk", category: "Individual Series" },
  { code: "SEM", name: "Sports and Entertainment Marketing Series", format: "roleplay", team: false, cluster: "mk", category: "Individual Series" },
  { code: "PSE", name: "Professional Selling", format: "roleplay", team: false, cluster: "mk", category: "Professional Selling" },
  { code: "HTPS", name: "Hospitality and Tourism Professional Selling", format: "roleplay", team: false, cluster: "ht", category: "Professional Selling" },
  { code: "BOR-F", name: "Business Operations Research – Finance", format: "written", team: true, cluster: "fi", category: "Business Operations Research" },
  { code: "BOR-H", name: "Business Operations Research – Hospitality", format: "written", team: true, cluster: "ht", category: "Business Operations Research" },
  { code: "BOR-M", name: "Business Operations Research – Marketing", format: "written", team: true, cluster: "mk", category: "Business Operations Research" },
  { code: "BOR-I", name: "Business Operations Research – International", format: "written", team: true, cluster: "core", category: "Business Operations Research" },
  { code: "EBG", name: "Business Growth Plan", format: "written", team: true, cluster: "en", category: "Business Plans" },
  { code: "EFB", name: "Franchise Business Plan", format: "written", team: true, cluster: "en", category: "Business Plans" },
  { code: "EIB", name: "Independent Business Plan", format: "written", team: true, cluster: "en", category: "Business Plans" },
  { code: "EIP", name: "Innovation Plan", format: "written", team: true, cluster: "en", category: "Business Plans" },
  { code: "IBP", name: "International Business Plan", format: "written", team: true, cluster: "en", category: "Business Plans" },
  { code: "ESB", name: "Start-Up Business Plan", format: "written", team: true, cluster: "en", category: "Business Plans" },
  { code: "FCE", name: "Financial Consulting", format: "written", team: true, cluster: "fi", category: "Business Plans" },
  { code: "IMC", name: "Integrated Marketing Campaign – Event", format: "written", team: true, cluster: "mk", category: "Integrated Marketing Campaign" },
  { code: "IMCP", name: "Integrated Marketing Campaign – Product", format: "written", team: true, cluster: "mk", category: "Integrated Marketing Campaign" },
  { code: "IMCS", name: "Integrated Marketing Campaign – Service", format: "written", team: true, cluster: "mk", category: "Integrated Marketing Campaign" },
  { code: "PMBS", name: "Business Solutions Project", format: "written", team: true, cluster: "bm", category: "Project Management" },
  { code: "PMCD", name: "Career Development Project", format: "written", team: true, cluster: "bm", category: "Project Management" },
  { code: "PMCA", name: "Community Awareness Project", format: "written", team: true, cluster: "mk", category: "Project Management" },
  { code: "PMCG", name: "Community Giving Project", format: "written", team: true, cluster: "mk", category: "Project Management" },
  { code: "PMFL", name: "Financial Literacy Project", format: "written", team: true, cluster: "fi", category: "Project Management" },
  { code: "PMSP", name: "Sales Project", format: "written", team: true, cluster: "mk", category: "Project Management" },
]

export const CLUSTER_LABEL: Record<string, string> = {
  core: "Business Administration Core",
  mk: "Marketing",
  fi: "Finance",
  ht: "Hospitality & Tourism",
  bm: "Business Management",
  en: "Entrepreneurship",
}
