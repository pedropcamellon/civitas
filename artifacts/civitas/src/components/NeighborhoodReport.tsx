import React, { useEffect, useRef, useCallback } from "react";
import { X, Shield, Droplets, MessageSquare, RefreshCw, MapPin, Wrench, TriangleAlert } from "lucide-react";
import { useColors } from "@/hooks/useColors";
import { useMapContext, type NeighborhoodReport as ReportType } from "@/context/MapContext";

interface Props {
  report: ReportType | null;
  isLoading: boolean;
  onRefresh: () => void;
}

function ScoreCard({ Icon, label, value, sub, color }: { Icon: React.ElementType; label: string; value: string; sub: string; color: string }) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "14px 8px", borderRadius: 16, border: `1px solid ${color}40`, backgroundColor: color + "18" }}>
      <Icon size={18} color={color} style={{ marginBottom: 6 }} />
      <span style={{ fontSize: 22, fontWeight: 700, color, lineHeight: 1.2 }}>{value}</span>
      <span style={{ fontSize: 11, fontWeight: 600, color, textTransform: "uppercase" as const, letterSpacing: "0.8px", opacity: 0.85, marginBottom: 2 }}>{sub}</span>
      <span style={{ fontSize: 11, color: "#8B9DC3", marginTop: 2 }}>{label}</span>
    </div>
  );
}

export function NeighborhoodReport({ report, isLoading, onRefresh }: Props) {
  const colors = useColors();
  const { isReportOpen, setIsReportOpen, setSelectedIncident } = useMapContext();
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef<{ y: number; time: number } | null>(null);

  const close = useCallback(() => setIsReportOpen(false), [setIsReportOpen]);

  const onPointerDown = (e: React.PointerEvent) => {
    dragStart.current = { y: e.clientY, time: Date.now() };
  };

  useEffect(() => {
    if (isReportOpen) setSelectedIncident(null);
  }, [isReportOpen, setSelectedIncident]);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!dragStart.current || !sheetRef.current) return;
      const dy = e.clientY - dragStart.current.y;
      if (dy > 0) sheetRef.current.style.transform = `translateY(${dy}px)`;
    };
    const onUp = (e: PointerEvent) => {
      if (!dragStart.current) return;
      const dy = e.clientY - dragStart.current.y;
      const dt = Date.now() - dragStart.current.time;
      if (dy > 80 || dy / dt > 0.5) close();
      else if (sheetRef.current) sheetRef.current.style.transform = "";
      dragStart.current = null;
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => { window.removeEventListener("pointermove", onMove); window.removeEventListener("pointerup", onUp); };
  }, [close]);

  if (!isReportOpen) return null;

  return (
    <div
      ref={sheetRef}
      className="sheet-open"
      style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        backgroundColor: colors.card, borderTop: `1px solid ${colors.border}`,
        borderRadius: "24px 24px 0 0", zIndex: 500, maxHeight: "75vh",
        display: "flex", flexDirection: "column",
        boxShadow: "0 -6px 24px rgba(0,0,0,0.45)",
        paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 8px)",
        transition: "transform 220ms ease-out", willChange: "transform",
      }}
    >
      {/* Handle */}
      <div onPointerDown={onPointerDown} style={{ padding: "10px 20px 0", cursor: "grab" }}>
        <div style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.mutedForeground + "50", margin: "0 auto 14px" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <MapPin size={16} color={colors.primary} />
            <span style={{ fontSize: 16, fontWeight: 700, color: colors.foreground }}>{report?.neighborhood ?? "Locating…"}</span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={onRefresh} style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 8, border: `1px solid ${colors.border}`, backgroundColor: "transparent", cursor: "pointer", color: colors.primary, fontSize: 13 }}>
              {isLoading ? <span style={{ width: 13, height: 13, border: `2px solid ${colors.primary}`, borderTopColor: "transparent", borderRadius: "50%", display: "inline-block", animation: "spin 0.8s linear infinite" }} /> : <RefreshCw size={13} />}
              Update
            </button>
            <button onClick={close} style={{ padding: 4, background: "none", border: "none", cursor: "pointer", color: colors.mutedForeground }}>
              <X size={18} />
            </button>
          </div>
        </div>
      </div>

      {isLoading && !report ? (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, color: colors.mutedForeground }}>
          <div style={{ width: 24, height: 24, border: `3px solid ${colors.primary}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          <span style={{ fontSize: 14 }}>Analyzing your area…</span>
        </div>
      ) : report ? (
        <div style={{ overflowY: "auto", padding: "0 20px" }}>
          {report.waterAdvisory && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: 10, backgroundColor: "#FF453A20", border: "1px solid #FF453A40", marginBottom: 14 }}>
              <TriangleAlert size={14} color="#FF453A" />
              <span style={{ fontSize: 13, color: "#FF453A" }}>{report.waterAdvisory} in effect for this area</span>
            </div>
          )}

          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <ScoreCard Icon={Shield}       label="Crime"    value={String(report.crimeCount)}        sub={report.crimeLabel}  color={report.crimeColor} />
            <ScoreCard Icon={Droplets}     label="Water"    value={report.waterGrade}                sub={report.waterLabel}  color={report.waterColor} />
            <ScoreCard Icon={MessageSquare} label="311 Open" value={String(report.requests311Count)} sub={report.requests311Count === 1 ? "Request" : "Requests"} color={colors.requests311} />
          </div>

          {report.topCrimeTypes.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: colors.mutedForeground, textTransform: "uppercase", letterSpacing: "0.8px", margin: "0 0 10px" }}>TOP CRIME TYPES THIS MONTH</p>
              {report.topCrimeTypes.map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <div style={{ width: 22, height: 22, borderRadius: 6, backgroundColor: colors.muted, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: colors.mutedForeground }}>{i + 1}</div>
                  <span style={{ flex: 1, fontSize: 14, color: colors.foreground }}>{item.title}</span>
                  <div style={{ padding: "2px 8px", borderRadius: 6, backgroundColor: colors.crime + "20", fontSize: 12, fontWeight: 600, color: colors.crime }}>×{item.count}</div>
                </div>
              ))}
            </div>
          )}

          {report.permitsCount > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 0", borderTop: `1px solid ${colors.border}`, marginBottom: 14 }}>
              <Wrench size={14} color={colors.permits} />
              <span style={{ fontSize: 13, color: colors.mutedForeground }}>
                <strong style={{ color: colors.permits }}>{report.permitsCount}</strong> active building permits in your neighborhood
              </span>
            </div>
          )}

          <p style={{ fontSize: 11, color: colors.mutedForeground, textAlign: "center", marginBottom: 8 }}>Data is pulled on demand · No storage used</p>
        </div>
      ) : null}
    </div>
  );
}
