// Realistic civic incident data seeded across Miami neighborhoods.
// MVP: static in-memory data generated at startup (zero storage cost).
// Future: swap proxyFetch calls to Miami-Dade ArcGIS REST API on demand.

export interface RawIncident {
  id: string;
  type: "crime" | "311" | "permit" | "water";
  lat: number;
  lon: number;
  title: string;
  description: string;
  date: string; // ISO
  status: string;
  address: string;
  neighborhood: string;
}

export const NEIGHBORHOODS = [
  { name: "Downtown Miami",    lat: 25.7685, lon: -80.1937 },
  { name: "Brickell",          lat: 25.7617, lon: -80.1918 },
  { name: "Coconut Grove",     lat: 25.7550, lon: -80.2100 },
  { name: "Wynwood",           lat: 25.7959, lon: -80.1997 },
  { name: "Edgewater",         lat: 25.8050, lon: -80.1913 },
  { name: "Midtown",           lat: 25.7882, lon: -80.1840 },
  { name: "Little Havana",     lat: 25.7653, lon: -80.2278 },
  { name: "Coral Gables",      lat: 25.7215, lon: -80.2684 },
  { name: "South Beach",       lat: 25.7725, lon: -80.1330 },
  { name: "Miami Beach",       lat: 25.7907, lon: -80.1300 },
  { name: "North Beach",       lat: 25.8150, lon: -80.1220 },
  { name: "Design District",   lat: 25.8140, lon: -80.1978 },
  { name: "Liberty City",      lat: 25.8320, lon: -80.2100 },
  { name: "Overtown",          lat: 25.7888, lon: -80.2098 },
  { name: "Allapattah",        lat: 25.8012, lon: -80.2338 },
  { name: "Doral",             lat: 25.8196, lon: -80.3568 },
  { name: "Fontainebleau",     lat: 25.7738, lon: -80.3412 },
  { name: "Hialeah",           lat: 25.8576, lon: -80.2781 },
  { name: "Kendall",           lat: 25.6847, lon: -80.4178 },
  { name: "South Miami",       lat: 25.7063, lon: -80.2892 },
  { name: "Homestead",         lat: 25.4750, lon: -80.4773 },
  { name: "North Miami",       lat: 25.8893, lon: -80.1867 },
  { name: "North Miami Beach", lat: 25.9215, lon: -80.1578 },
];

const CRIME_TYPES = [
  { title: "Burglary",         desc: "Break-in reported at residence" },
  { title: "Vehicle Theft",    desc: "Motor vehicle stolen from street" },
  { title: "Vandalism",        desc: "Property damage reported" },
  { title: "Robbery",          desc: "Armed robbery reported" },
  { title: "Assault",          desc: "Physical altercation reported" },
  { title: "Theft",            desc: "Petty theft from vehicle or person" },
  { title: "Drug Offense",     desc: "Narcotics possession or distribution" },
  { title: "Fraud",            desc: "Identity theft or financial fraud" },
  { title: "Battery",          desc: "Battery on a person" },
  { title: "Disorderly Conduct", desc: "Public disturbance reported" },
];

const CRIME_STATUSES = ["Under Investigation", "Case Closed", "Arrested", "Reported", "No Action"];

const REQUESTS_311 = [
  { title: "Trash Pickup Delay",    desc: "Missed waste collection at residential property" },
  { title: "Pothole Repair",        desc: "Large pothole causing vehicle damage" },
  { title: "Broken Street Light",   desc: "Street light not functioning, safety hazard" },
  { title: "Illegal Dumping",       desc: "Bulk waste dumped on public property" },
  { title: "Graffiti Removal",      desc: "Graffiti on public infrastructure" },
  { title: "Flooded Road",          desc: "Standing water blocking road access" },
  { title: "Noise Complaint",       desc: "Excessive noise from construction or business" },
  { title: "Abandoned Vehicle",     desc: "Vehicle abandoned for more than 72 hours" },
  { title: "Overgrown Vegetation",  desc: "Overgrown trees blocking signage or sidewalk" },
  { title: "Sidewalk Damage",       desc: "Cracked sidewalk, trip hazard" },
  { title: "Animal Control",        desc: "Stray animal complaint" },
  { title: "Sewer Backup",          desc: "Sewer system backup reported" },
  { title: "Traffic Signal",        desc: "Traffic light malfunctioning" },
  { title: "Rodent Activity",       desc: "Rodent sighting near residential property" },
  { title: "Water Main Leak",       desc: "Suspected leak on public water main" },
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
  { title: "Water Main Break",       desc: "Active water main break causing service disruption",         status: "Emergency Response", weight: 3 },
  { title: "Boil Water Advisory",    desc: "Precautionary boil water advisory issued for this block",    status: "Advisory Active",    weight: 4 },
  { title: "Discolored Water",       desc: "Residents reporting brown or discolored tap water",          status: "Under Investigation", weight: 2 },
  { title: "Low Water Pressure",     desc: "Reduced water pressure reported by multiple residents",      status: "Investigating",       weight: 1 },
  { title: "Lead Test — Failed",     desc: "Water sample failed lead compliance threshold (>15 ppb)",   status: "Action Required",    weight: 5 },
  { title: "Contamination Notice",   desc: "Precautionary contamination notice — do not drink",         status: "Notice Active",      weight: 5 },
  { title: "Service Interruption",   desc: "Planned maintenance causing water service interruption",    status: "Scheduled",          weight: 1 },
  { title: "Pressure Test Failure",  desc: "Infrastructure pressure test failed — repairs scheduled",   status: "Repair Scheduled",   weight: 2 },
];

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
  const streets = ["NW 7th Ave", "SW 8th St", "Biscayne Blvd", "Flagler St", "US-1",
                   "NE 2nd Ave", "SW 27th Ave", "Bird Rd", "NW 36th St", "NE 79th St"];
  return `${num} ${pick(streets)}, ${nbName}, FL`;
}

function generate(): RawIncident[] {
  const incidents: RawIncident[] = [];

  for (let i = 0; i < 180; i++) {
    const nb = pick(NEIGHBORHOODS);
    const t = pick(REQUESTS_311);
    incidents.push({
      id: `311-${i + 1}`,
      type: "311",
      lat: jitter(nb.lat),
      lon: jitter(nb.lon),
      title: t.title,
      description: t.desc,
      date: randomPast(30 * 24),
      status: pick(REQUEST_STATUSES),
      address: streetAddress(nb.name),
      neighborhood: nb.name,
    });
  }

  for (let i = 0; i < 150; i++) {
    const nb = pick(NEIGHBORHOODS);
    const t = pick(CRIME_TYPES);
    incidents.push({
      id: `crime-${i + 1}`,
      type: "crime",
      lat: jitter(nb.lat),
      lon: jitter(nb.lon),
      title: t.title,
      description: t.desc,
      date: randomPast(30 * 24),
      status: pick(CRIME_STATUSES),
      address: streetAddress(nb.name),
      neighborhood: nb.name,
    });
  }

  for (let i = 0; i < 120; i++) {
    const nb = pick(NEIGHBORHOODS);
    const t = pick(PERMIT_TYPES);
    incidents.push({
      id: `permit-${i + 1}`,
      type: "permit",
      lat: jitter(nb.lat),
      lon: jitter(nb.lon),
      title: t.title,
      description: t.desc,
      date: randomPast(30 * 24),
      status: pick(PERMIT_STATUSES),
      address: streetAddress(nb.name),
      neighborhood: nb.name,
    });
  }

  for (let i = 0; i < 90; i++) {
    const nb = pick(NEIGHBORHOODS);
    const t = pick(WATER_TYPES);
    incidents.push({
      id: `water-${i + 1}`,
      type: "water",
      lat: jitter(nb.lat, 0.006),
      lon: jitter(nb.lon, 0.006),
      title: t.title,
      description: t.desc,
      date: randomPast(30 * 24),
      status: t.status,
      address: streetAddress(nb.name),
      neighborhood: nb.name,
    });
  }

  return incidents;
}

export const MIAMI_INCIDENTS: RawIncident[] = generate();
