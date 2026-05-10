import type { IncidentLayer, SourceAdapter } from "./adapter.js";

class SourceRegistry {
  private readonly adapters: SourceAdapter[] = [];

  register(adapter: SourceAdapter): void {
    this.adapters.push(adapter);
  }

  getForLayer(layer: IncidentLayer): SourceAdapter[] {
    return this.adapters.filter((a) => a.meta.layer === layer);
  }

  all(): SourceAdapter[] {
    return [...this.adapters];
  }
}

export const registry = new SourceRegistry();
