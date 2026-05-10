import type { RawIncident } from "./types.js";
import { NEIGHBORHOODS } from "./neighborhoods.js";

// ── Fixed Miami-Dade water infrastructure ────────────────────────────────

const WATER_PLANTS: Array<{
  id: string; title: string; desc: string; lat: number; lon: number; address: string; neighborhood: string; status: string;
}> = [
  {
    id: "wtp-hialeah", title: "Hialeah Water Treatment Plant",
    desc: "Primary surface water treatment facility serving northern Miami-Dade. Capacity: 72 MGD.",
    lat: 25.8552, lon: -80.3099, address: "700 Palm Ave, Hialeah, FL", neighborhood: "Hialeah", status: "Operational",
  },
  {
    id: "wtp-john-e-preston", title: "John E. Preston Water Treatment Plant",
    desc: "Canal C-6 source water plant serving Downtown and Brickell. Capacity: 110 MGD.",
    lat: 25.8321, lon: -80.2947, address: "3575 NW 22nd Ave, Miami, FL", neighborhood: "Liberty City", status: "Operational",
  },
  {
    id: "wtp-alexander-orr", title: "Alexander Orr Jr. Water Treatment Plant",
    desc: "Largest WTP in Miami-Dade; groundwater source, Floridian Aquifer. Capacity: 255 MGD.",
    lat: 25.6830, lon: -80.4220, address: "14700 SW 168th St, Miami, FL", neighborhood: "Kendall", status: "Operational",
  },
  {
    id: "wtp-south-district", title: "South District Water Treatment Plant",
    desc: "Wastewater reclamation and reclaimed water distribution. Capacity: 112 MGD.",
    lat: 25.6295, lon: -80.3907, address: "24400 SW 142nd Ave, Homestead, FL", neighborhood: "Homestead", status: "Operational",
  },
  {
    id: "ps-brickell", title: "Brickell Pump Station",
    desc: "Main distribution pump station serving Brickell and Downtown corridors.",
    lat: 25.7609, lon: -80.1944, address: "300 SE 5th Ave, Brickell, FL", neighborhood: "Brickell", status: "Operational",
  },
  {
    id: "ps-south-beach", title: "South Beach Pump Station",
    desc: "Island pump station managing pressure for South Beach barrier island distribution.",
    lat: 25.7680, lon: -80.1341, address: "800 Alton Rd, Miami Beach, FL", neighborhood: "South Beach", status: "Under Maintenance",
  },
  {
    id: "ps-wynwood", title: "Wynwood Distribution Hub",
    desc: "Booster pump station for Wynwood, Edgewater and Design District.",
    lat: 25.7972, lon: -80.1980, address: "2200 NW 1st Ave, Miami, FL", neighborhood: "Wynwood", status: "Operational",
  },
  {
    id: "ps-hialeah-east", title: "Hialeah East Pump Station",
    desc: "Secondary pump station balancing pressure between Hialeah WTP and eastern service zones.",
    lat: 25.8610, lon: -80.2640, address: "1500 E 4th Ave, Hialeah, FL", neighborhood: "Hialeah", status: "Operational",
  },
  {
    id: "ps-kendall", title: "Kendall Booster Station",
    desc: "High-pressure booster for southern suburban service zones and South Dade.",
    lat: 25.6890, lon: -80.3800, address: "11050 SW 137th Ave, Miami, FL", neighborhood: "Kendall", status: "Operational",
  },
  {
    id: "ps-doral", title: "Doral Pump Station",
    desc: "Serves Doral and Fontainebleau residential and commercial expansion zones.",
    lat: 25.8190, lon: -80.3480, address: "8300 NW 107th Ct, Doral, FL", neighborhood: "Doral", status: "Operational",
  },
  {
    id: "res-north-miami", title: "North Miami Reservoir",
    desc: "Ground-level storage reservoir; 5 million gallon emergency capacity.",
    lat: 25.8940, lon: -80.1880, address: "620 NE 124th St, North Miami, FL", neighborhood: "North Miami", status: "Operational",
  },
  {
    id: "res-coral-gables", title: "Coral Gables Water Tower",
    desc: "Elevated storage tower, balances peak demand and maintains system pressure.",
    lat: 25.7200, lon: -80.2700, address: "401 Salzedo St, Coral Gables, FL", neighborhood: "Coral Gables", status: "Operational",
  },
];

const CRIME_TYPES = [
  { title: "Burglary",           desc: "Break-in reported at residence" },
  { title: "Vehicle Theft",      desc: "Motor vehicle stolen from street" },
  { title: "Vandalism",          desc: "Property damage reported" },
  { title: "Robbery",            desc: "Armed robbery reported" },
  { title: "Assault",            desc: "Physical altercation reported" },
  { title: "Theft",              desc: "Petty theft from vehicle or person" },
  { title: "Drug Offense",       desc: "Narcotics possession or distribution" },
  { title: "Fraud",              desc: "Identity theft or financial fraud" },
  { title: "Battery",            desc: "Battery on a person" },
  { title: "Disorderly Conduct", desc: "Public disturbance reported" },
];
const CRIME_STATUSES = ["Under Investigation", "Case Closed", "Arrested", "Reported", "No Action"];

// 60% of crime goes to historically higher-density neighborhoods
const CRIME_HOTSPOTS = ["Liberty City", "Overtown", "Little Havana", "Downtown Miami", "Allapattah", "Hialeah", "North Miami", "Homestead"];

const REQUESTS_311 = [
  { title: "Trash Pickup Delay",   desc: "Missed waste collection at residential property" },
  { title: "Pothole Repair",       desc: "Large pothole causing vehicle damage" },
  { title: "Broken Street Light",  desc: "Street light not functioning, safety hazard" },
  { title: "Illegal Dumping",      desc: "Bulk waste dumped on public property" },
  { title: "Graffiti Removal",     desc: "Graffiti on public infrastructure" },
  { title: "Flooded Road",         desc: "Standing water blocking road access" },
  { title: "Noise Complaint",      desc: "Excessive noise from construction or business" },
  { title: "Abandoned Vehicle",    desc: "Vehicle abandoned for more than 72 hours" },
  { title: "Overgrown Vegetation", desc: "Overgrown trees blocking signage or sidewalk" },
  { title: "Sidewalk Damage",      desc: "Cracked sidewalk, trip hazard" },
  { title: "Animal Control",       desc: "Stray animal complaint" },
  { title: "Sewer Backup",         desc: "Sewer system backup reported" },
  { title: "Traffic Signal",       desc: "Traffic light malfunctioning" },
  { title: "Rodent Activity",      desc: "Rodent sighting near residential property" },
  { title: "Water Main Leak",      desc: "Suspected leak on public water main" },
];
const REQUEST_STATUSES = ["Open", "In Progress", "Closed", "Pending Review", "Assigned"];

const PERMIT_TYPES = [
  { title: "Residential Renovation", desc: "Interior remodeling of single-family home" },
  { title: "Commercial Build-Out",   desc: "New commercial space interior construction" },
  { title: "Roof Replacement",       desc: "Full roof replacement — hurricane-compliant materials" },
  { title: "Electrical Upgrade",     desc: "Panel and wiring upgrade to code" },
  { title: "Plumbing Permit",        desc: "Water supply and drainage work" },
  { title: "Swimming Pool",          desc: "New pool construction with screen enclosure" },
  { title: "HVAC Installation",      desc: "Air conditioning system replacement" },
  { title: "New Construction",       desc: "Ground-up residential construction" },
  { title: "Fence Installation",     desc: "Privacy fence installation — 6ft masonry" },
  { title: "Solar Panel Install",    desc: "Rooftop photovoltaic solar system" },
  { title: "Addition / Extension",   desc: "Home addition increasing sq footage" },
  { title: "Demo Permit",            desc: "Structure demolition prior to new build" },
];
const PERMIT_STATUSES = ["Issued", "Approved", "Under Review", "Finaled", "Expired"];

const WATER_TYPES = [
  { title: "Water Main Break",      desc: "Active water main break causing service disruption",        status: "Emergency Response" },
  { title: "Boil Water Advisory",   desc: "Precautionary boil water advisory issued for this block",   status: "Advisory Active" },
  { title: "Discolored Water",      desc: "Residents reporting brown or discolored tap water",         status: "Under Investigation" },
  { title: "Low Water Pressure",    desc: "Reduced water pressure reported by multiple residents",     status: "Investigating" },
  { title: "Lead Test — Failed",    desc: "Water sample failed lead compliance threshold (>15 ppb)",   status: "Action Required" },
  { title: "Contamination Notice",  desc: "Precautionary contamination notice — do not drink",        status: "Notice Active" },
  { title: "Service Interruption",  desc: "Planned maintenance causing water service interruption",   status: "Scheduled" },
  { title: "Pressure Test Failure", desc: "Infrastructure pressure test failed — repairs scheduled",  status: "Repair Scheduled" },
];

// ── Generation helpers ────────────────────────────────────────────────────

function jitter(base: number, range = 0.009): number {
  return base + (Math.random() - 0.5) * 2 * range;
}

function randomPast(maxHoursAgo: number): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() - Math.floor(Math.random() * maxHoursAgo * 60));
  return d.toISOString();
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function streetAddress(nbName: string): string {
  const num = Math.floor(100 + Math.random() * 9900);
  const streets = [
    "NW 7th Ave", "SW 8th St", "Biscayne Blvd", "Flagler St", "US-1",
    "NE 2nd Ave", "SW 27th Ave", "Bird Rd", "NW 36th St", "NE 79th St",
  ];
  return `${num} ${pick(streets)}, ${nbName}, FL`;
}

// ── Generator ─────────────────────────────────────────────────────────────

export function generate(): RawIncident[] {
  const incidents: RawIncident[] = [];

  for (let i = 0; i < 180; i++) {
    const nb = pick(NEIGHBORHOODS);
    const t = pick(REQUESTS_311);
    incidents.push({
      id: `311-${i + 1}`, type: "311",
      lat: jitter(nb.lat), lon: jitter(nb.lon),
      title: t.title, description: t.desc,
      date: randomPast(30 * 24), status: pick(REQUEST_STATUSES),
      address: streetAddress(nb.name), neighborhood: nb.name,
    });
  }

  for (let i = 0; i < 150; i++) {
    // 60% chance: pick from hotspot neighborhoods; 40%: any neighborhood
    const useHotspot = Math.random() < 0.6;
    let nb: typeof NEIGHBORHOODS[number];
    if (useHotspot) {
      const hotspotName = pick(CRIME_HOTSPOTS);
      nb = NEIGHBORHOODS.find((n) => n.name === hotspotName) ?? pick(NEIGHBORHOODS);
    } else {
      nb = pick(NEIGHBORHOODS);
    }
    const t = pick(CRIME_TYPES);
    incidents.push({
      id: `crime-${i + 1}`, type: "crime",
      lat: jitter(nb.lat), lon: jitter(nb.lon),
      title: t.title, description: t.desc,
      date: randomPast(30 * 24), status: pick(CRIME_STATUSES),
      address: streetAddress(nb.name), neighborhood: nb.name,
    });
  }

  for (let i = 0; i < 120; i++) {
    const nb = pick(NEIGHBORHOODS);
    const t = pick(PERMIT_TYPES);
    incidents.push({
      id: `permit-${i + 1}`, type: "permit",
      lat: jitter(nb.lat), lon: jitter(nb.lon),
      title: t.title, description: t.desc,
      date: randomPast(30 * 24), status: pick(PERMIT_STATUSES),
      address: streetAddress(nb.name), neighborhood: nb.name,
    });
  }

  for (let i = 0; i < 90; i++) {
    const nb = pick(NEIGHBORHOODS);
    const t = pick(WATER_TYPES);
    incidents.push({
      id: `water-event-${i + 1}`, type: "water",
      lat: jitter(nb.lat, 0.006), lon: jitter(nb.lon, 0.006),
      title: t.title, description: t.desc,
      date: randomPast(30 * 24), status: t.status,
      address: streetAddress(nb.name), neighborhood: nb.name,
    });
  }

  // Fixed water infrastructure — always present, always current
  for (const plant of WATER_PLANTS) {
    incidents.push({
      id: plant.id, type: "water", subtype: "infrastructure",
      lat: plant.lat, lon: plant.lon,
      title: plant.title, description: plant.desc,
      date: new Date().toISOString(), status: plant.status,
      address: plant.address, neighborhood: plant.neighborhood,
    });
  }

  return incidents;
}

// Generated once at module load — all consumers share this snapshot
export const MIAMI_INCIDENTS: RawIncident[] = generate();
