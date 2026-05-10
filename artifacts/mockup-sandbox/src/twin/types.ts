export type ThemeName = "dark" | "light" | "neon";

export type LayerKey = "crime" | "requests311" | "permits" | "water" | "cargo";

export interface Incident {
  id: string;
  type: "crime" | "311" | "permit" | "water";
  lat: number;
  lon: number;
  title: string;
  description: string;
  date: string;
  status: string;
  address: string;
  neighborhood: string;
}

export interface NeighborhoodReport {
  neighborhood: string;
  lat: number;
  lon: number;
  crimeCount: number;
  crimeScore: number;
  crimeLabel: string;
  crimeColor: string;
  waterScore: number;
  waterGrade: string;
  waterLabel: string;
  waterColor: string;
  waterIncidents: number;
  waterAdvisory: string | null;
  requests311Count: number;
  permitsCount: number;
  topCrimeTypes: { title: string; count: number }[];
  lastUpdated: string;
}

export interface Theme {
  bg: string;
  panel: string;
  panel2: string;
  text: string;
  muted: string;
  border: string;
  primary: string;
  crime: string;
  requests311: string;
  permits: string;
  water: string;
  cargo: string;
  accent: string;
  tileUrl: string;
  tileAttribution: string;
}

export const THEMES: Record<ThemeName, Theme> = {
  dark: {
    bg: "#07111F",
    panel: "rgba(10,22,40,0.92)",
    panel2: "rgba(18,34,65,0.85)",
    text: "#F4F7FF",
    muted: "#8AA0C7",
    border: "rgba(34,52,84,0.9)",
    primary: "#00B4D8",
    crime: "#FF453A",
    requests311: "#FFD60A",
    permits: "#32D74B",
    water: "#4FC3F7",
    cargo: "#FF9500",
    accent: "#7C5CFF",
    tileUrl: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    tileAttribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
  light: {
    bg: "#EEF5FF",
    panel: "rgba(255,255,255,0.95)",
    panel2: "rgba(240,247,255,0.9)",
    text: "#0A1628",
    muted: "#58708F",
    border: "rgba(180,200,220,0.8)",
    primary: "#0077B6",
    crime: "#E63946",
    requests311: "#C58A00",
    permits: "#1E8A3C",
    water: "#0077B6",
    cargo: "#D4700A",
    accent: "#7849F7",
    tileUrl: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    tileAttribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
  neon: {
    bg: "#090913",
    panel: "rgba(15,10,35,0.95)",
    panel2: "rgba(25,18,55,0.9)",
    text: "#FFF7FF",
    muted: "#A793C8",
    border: "rgba(52,35,95,0.9)",
    primary: "#FF2D78",
    crime: "#FF2D78",
    requests311: "#FFD60A",
    permits: "#00FFD1",
    water: "#4FC3F7",
    cargo: "#FF9500",
    accent: "#00FFD1",
    tileUrl: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    tileAttribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
};

export const CARGO_ROUTE: [number, number][] = [
  [25.7728, -80.1686],
  [25.7742, -80.1760],
  [25.7735, -80.1850],
  [25.7722, -80.1960],
  [25.7718, -80.2095],
  [25.7728, -80.2280],
  [25.7748, -80.2510],
  [25.7790, -80.2730],
  [25.7905, -80.2950],
  [25.8045, -80.3130],
  [25.8145, -80.3360],
  [25.8196, -80.3568],
];

export const SF_CENTER: [number, number] = [25.77, -80.22];
export const SF_ZOOM = 11;

export const LAYER_CONFIG: {
  key: LayerKey;
  label: string;
  description: string;
  colorKey: keyof Theme;
}[] = [
  { key: "crime",       label: "Crime",    description: "Incidents & arrests",   colorKey: "crime"       },
  { key: "requests311", label: "311 Calls", description: "Service requests",      colorKey: "requests311" },
  { key: "permits",     label: "Permits",   description: "Building permits",       colorKey: "permits"     },
  { key: "water",       label: "Water",     description: "Water quality & alerts", colorKey: "water"       },
  { key: "cargo",       label: "Cargo",     description: "Port-to-Doral route",    colorKey: "cargo"       },
];

export const COMING_SOON_LAYERS = [
  { label: "Traffic Flow",   description: "Real-time congestion" },
  { label: "Flood Zones",    description: "FEMA risk areas" },
  { label: "Transit",        description: "Bus & Metrorail routes" },
  { label: "Power Grid",     description: "Utility infrastructure" },
];
