// Realistic civic incident data seeded across Miami neighborhoods.
// MVP approach: static JSON with real Miami coordinates.
// Replace with live ArcGIS / Socrata queries in future iterations.

export interface RawIncident {
  id: string;
  type: "crime" | "311" | "permit";
  lat: number;
  lon: number;
  title: string;
  description: string;
  date: string; // ISO
  status: string;
  address: string;
}

// Miami neighborhoods bounding boxes (lat, lon centers)
const LOCATIONS = [
  // Downtown / Brickell
  { lat: 25.7685, lon: -80.1937, name: "Downtown Miami" },
  { lat: 25.7617, lon: -80.1918, name: "Brickell" },
  { lat: 25.7729, lon: -80.1878, name: "Brickell" },
  { lat: 25.7550, lon: -80.2100, name: "Coconut Grove" },
  // Wynwood / Edgewater
  { lat: 25.7959, lon: -80.1997, name: "Wynwood" },
  { lat: 25.8050, lon: -80.1913, name: "Edgewater" },
  { lat: 25.7882, lon: -80.1840, name: "Midtown" },
  // Little Havana
  { lat: 25.7653, lon: -80.2278, name: "Little Havana" },
  { lat: 25.7701, lon: -80.2350, name: "Little Havana" },
  // Coral Gables
  { lat: 25.7215, lon: -80.2684, name: "Coral Gables" },
  { lat: 25.7190, lon: -80.2520, name: "Coral Gables" },
  // Miami Beach
  { lat: 25.7907, lon: -80.1300, name: "Miami Beach" },
  { lat: 25.8150, lon: -80.1220, name: "North Beach" },
  { lat: 25.7725, lon: -80.1330, name: "South Beach" },
  // Design District / Liberty City
  { lat: 25.8140, lon: -80.1978, name: "Design District" },
  { lat: 25.8320, lon: -80.2100, name: "Liberty City" },
  // Overtown / Allapattah
  { lat: 25.7888, lon: -80.2098, name: "Overtown" },
  { lat: 25.8012, lon: -80.2338, name: "Allapattah" },
  // Doral / Fontainebleau
  { lat: 25.8196, lon: -80.3568, name: "Doral" },
  { lat: 25.7738, lon: -80.3412, name: "Fontainebleau" },
  // Hialeah
  { lat: 25.8576, lon: -80.2781, name: "Hialeah" },
  { lat: 25.8720, lon: -80.3110, name: "Hialeah" },
  // Kendall / South Miami
  { lat: 25.6847, lon: -80.4178, name: "Kendall" },
  { lat: 25.7050, lon: -80.3830, name: "Kendall" },
  { lat: 25.7063, lon: -80.2892, name: "South Miami" },
  // Homestead
  { lat: 25.4750, lon: -80.4773, name: "Homestead" },
  // North Miami
  { lat: 25.8893, lon: -80.1867, name: "North Miami" },
  { lat: 25.9215, lon: -80.1578, name: "North Miami Beach" },
];

const CRIME_TYPES = [
  { title: "Burglary", desc: "Break-in reported at residence" },
  { title: "Vehicle Theft", desc: "Motor vehicle stolen from street" },
  { title: "Vandalism", desc: "Property damage reported" },
  { title: "Robbery", desc: "Armed robbery reported" },
  { title: "Assault", desc: "Physical altercation reported" },
  { title: "Theft", desc: "Petty theft from vehicle" },
  { title: "Drug Offense", desc: "Narcotics possession or distribution" },
  { title: "Fraud", desc: "Identity theft or financial fraud" },
  { title: "Battery", desc: "Battery on a person" },
  { title: "Disorderly Conduct", desc: "Disturbance reported" },
];

const CRIME_STATUSES = ["Under Investigation", "Case Closed", "Arrested", "Reported", "No Action"];

const REQUESTS_311 = [
  { title: "Trash Pickup Delay", desc: "Missed waste collection at residential property" },
  { title: "Pothole Repair", desc: "Large pothole causing vehicle damage" },
  { title: "Broken Street Light", desc: "Street light not functioning, safety hazard" },
  { title: "Illegal Dumping", desc: "Bulk waste dumped on public property" },
  { title: "Graffiti Removal", desc: "Graffiti on public infrastructure" },
  { title: "Flooded Road", desc: "Standing water blocking road access" },
  { title: "Noise Complaint", desc: "Excessive noise from construction or business" },
  { title: "Abandoned Vehicle", desc: "Vehicle abandoned for more than 72 hours" },
  { title: "Overgrown Vegetation", desc: "Overgrown trees blocking signage or sidewalk" },
  { title: "Water Main Leak", desc: "Water leak detected on public property" },
  { title: "Sidewalk Damage", desc: "Cracked or heaved sidewalk, trip hazard" },
  { title: "Animal Control", desc: "Stray animal complaint" },
  { title: "Sewer Backup", desc: "Sewer system backup reported" },
  { title: "Rodent Infestation", desc: "Rodent activity reported near property" },
  { title: "Traffic Signal", desc: "Traffic light malfunctioning" },
];

const REQUEST_STATUSES = ["Open", "In Progress", "Closed", "Pending Review", "Assigned"];

const PERMIT_TYPES = [
  { title: "Residential Renovation", desc: "Interior remodeling of single-family home" },
  { title: "Commercial Build-Out", desc: "New commercial space interior construction" },
  { title: "Roof Replacement", desc: "Full roof replacement — hurricane-compliant materials" },
  { title: "Electrical Upgrade", desc: "Panel and wiring upgrade to code" },
  { title: "Plumbing Permit", desc: "Water supply and drainage work" },
  { title: "Swimming Pool", desc: "New pool construction with screen enclosure" },
  { title: "HVAC Installation", desc: "Air conditioning system replacement" },
  { title: "New Construction", desc: "Ground-up residential construction" },
  { title: "Fence Installation", desc: "Privacy fence installation — 6ft masonry" },
  { title: "Solar Panel Install", desc: "Rooftop photovoltaic solar system" },
  { title: "Addition / Extension", desc: "Home addition increasing sq footage" },
  { title: "Demo Permit", desc: "Structure demolition prior to new build" },
];

const PERMIT_STATUSES = ["Issued", "Approved", "Under Review", "Finaled", "Expired"];

function jitter(base: number, range = 0.008): number {
  return base + (Math.random() - 0.5) * 2 * range;
}

function randomPast(maxDaysAgo: number): string {
  const d = new Date();
  d.setHours(d.getHours() - Math.floor(Math.random() * maxDaysAgo * 24));
  return d.toISOString();
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function streetAddress(loc: (typeof LOCATIONS)[number]): string {
  const num = Math.floor(100 + Math.random() * 9900);
  const streets = ["NW 7th Ave", "SW 8th St", "Biscayne Blvd", "Flagler St", "US-1", "NE 2nd Ave", "SW 27th Ave", "Bird Rd"];
  return `${num} ${pick(streets)}, ${loc.name}, FL`;
}

function generate(): RawIncident[] {
  const incidents: RawIncident[] = [];
  const now = new Date();

  // 311 requests — ~180 incidents over 30 days
  for (let i = 0; i < 180; i++) {
    const loc = pick(LOCATIONS);
    const type = pick(REQUESTS_311);
    const date = randomPast(30);
    // Weight recent data more
    incidents.push({
      id: `311-${i + 1}`,
      type: "311",
      lat: jitter(loc.lat),
      lon: jitter(loc.lon),
      title: type.title,
      description: type.desc,
      date,
      status: pick(REQUEST_STATUSES),
      address: streetAddress(loc),
    });
  }

  // Crime — ~150 incidents over 30 days
  for (let i = 0; i < 150; i++) {
    const loc = pick(LOCATIONS);
    const type = pick(CRIME_TYPES);
    incidents.push({
      id: `crime-${i + 1}`,
      type: "crime",
      lat: jitter(loc.lat),
      lon: jitter(loc.lon),
      title: type.title,
      description: type.desc,
      date: randomPast(30),
      status: pick(CRIME_STATUSES),
      address: streetAddress(loc),
    });
  }

  // Permits — ~120 issued over 30 days
  for (let i = 0; i < 120; i++) {
    const loc = pick(LOCATIONS);
    const type = pick(PERMIT_TYPES);
    incidents.push({
      id: `permit-${i + 1}`,
      type: "permit",
      lat: jitter(loc.lat),
      lon: jitter(loc.lon),
      title: type.title,
      description: type.desc,
      date: randomPast(30),
      status: pick(PERMIT_STATUSES),
      address: streetAddress(loc),
    });
  }

  return incidents;
}

// Generate once at startup, stable for the server's lifetime
export const MIAMI_INCIDENTS: RawIncident[] = generate();
