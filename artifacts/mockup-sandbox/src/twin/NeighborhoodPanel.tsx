import { X, RefreshCw, TriangleAlert, Droplets, ShieldAlert, Package, Building2 } from "lucide-react";
import type { Theme, NeighborhoodReport } from "./types";

interface NeighborhoodPanelProps {
  report: NeighborhoodReport;
  loading: boolean;
  onClose: () => void;
  onRefresh: () => void;
  c: Theme;
}

export function NeighborhoodPanel({ report, loading, onClose, onRefresh, c }: NeighborhoodPanelProps) {
  const panel: React.CSSProperties = {
    position: "fixed",
    right: 16,
    top: 80,
    width: "min(340px, calc(100vw - 32px))",
    background: c.panel,
    border: `1px solid ${c.border}`,
    borderRadius: 20,
    padding: 18,
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    zIndex: 900,
    boxShadow: "0 8px 40px rgba(0,0,0,0.45)",
    maxHeight: "calc(100vh - 120px)",
    overflowY: "auto",
  };

  return (
    <div style={panel}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: c.muted, marginBottom: 4 }}>
            Neighborhood Report
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: c.text, lineHeight: 1.2 }}>{report.neighborhood}</div>
          <div style={{ fontSize: 11, color: c.muted, marginTop: 3 }}>Last 30 days · Updated just now</div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={onRefresh} style={{ background: "none", border: `1px solid ${c.border}`, borderRadius: 8, padding: 6, cursor: "pointer", color: c.muted }}>
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
          <button onClick={onClose} style={{ background: "none", border: `1px solid ${c.border}`, borderRadius: 8, padding: 6, cursor: "pointer", color: c.muted }}>
            <X size={14} />
          </button>
        </div>
      </div>

      {report.waterAdvisory && (
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "10px 12px", borderRadius: 12,
          background: "#FF453A18", border: "1px solid #FF453A44",
          marginBottom: 14,
        }}>
          <TriangleAlert size={16} color="#FF453A" />
          <span style={{ fontSize: 12, color: "#FF453A", fontWeight: 600 }}>
            {report.waterAdvisory}
          </span>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
        <StatCard label="Crime Level" value={report.crimeLabel} sub={`${report.crimeCount} incidents`} color={report.crimeColor} icon={<ShieldAlert size={14} />} c={c} />
        <StatCard label="Water Quality" value={`${report.waterGrade} · ${report.waterLabel}`} sub={`${report.waterIncidents} issues`} color={report.waterColor} icon={<Droplets size={14} />} c={c} />
        <StatCard label="311 Open" value={String(report.requests311Count)} sub="Service requests" color={c.requests311} icon={<Building2 size={14} />} c={c} />
        <StatCard label="Permits" value={String(report.permitsCount)} sub="Active permits" color={c.permits} icon={<Package size={14} />} c={c} />
      </div>

      {report.topCrimeTypes.length > 0 && (
        <div>
          <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: c.muted, marginBottom: 8 }}>
            Top Crime Types
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {report.topCrimeTypes.map((t, i) => (
              <div key={t.title} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ fontSize: 11, color: c.muted, width: 16, textAlign: "right", flexShrink: 0 }}>
                  {i + 1}.
                </div>
                <div style={{ flex: 1, fontSize: 12, color: c.text }}>{t.title}</div>
                <div style={{
                  fontSize: 11, fontWeight: 700, color: c.crime,
                  background: c.crime + "18", padding: "1px 8px", borderRadius: 99,
                }}>
                  {t.count}
                </div>
                <div style={{
                  width: `${Math.min((t.count / (report.topCrimeTypes[0]?.count ?? 1)) * 60, 60)}px`,
                  height: 4, borderRadius: 99, background: c.crime + "55",
                  flexShrink: 0,
                }} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, sub, color, icon, c, }: { label: string; value: string; sub: string; color: string; icon: React.ReactNode; c: Theme; }) {
  return (
    <div style={{ padding: "10px 12px", borderRadius: 12, background: color + "12", border: `1px solid ${color}30` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 5 }}>
        <span style={{ color }}>{icon}</span>
        <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: c.muted }}>{label}</span>
      </div>
      <div style={{ fontSize: 14, fontWeight: 800, color, lineHeight: 1.2, marginBottom: 2 }}>{value}</div>
      <div style={{ fontSize: 10, color: c.muted }}>{sub}</div>
    </div>
  );
}
