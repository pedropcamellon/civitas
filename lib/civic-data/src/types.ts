export interface RawIncident {
  id: string;
  type: "crime" | "311" | "permit" | "water";
  subtype?: "infrastructure";   // fixed infrastructure vs. transient events
  lat: number;
  lon: number;
  title: string;
  description: string;
  date: string; // ISO
  status: string;
  address: string;
  neighborhood: string;
}

export interface Neighborhood {
  name: string;
  lat: number;
  lon: number;
}
