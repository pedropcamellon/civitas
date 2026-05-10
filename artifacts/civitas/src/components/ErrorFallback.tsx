import React from "react";
import { TriangleAlert, RefreshCw } from "lucide-react";
import { useColors } from "@/hooks/useColors";

export type ErrorFallbackProps = { error: Error; resetError: () => void };

export function ErrorFallback({ error, resetError }: ErrorFallbackProps) {
  const colors = useColors();

  return (
    <div style={{ width: "100vw", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: colors.background, padding: 24 }}>
      <div style={{ maxWidth: 360, width: "100%", backgroundColor: colors.card, border: `1px solid ${colors.border}`, borderRadius: 20, padding: 28, textAlign: "center" }}>
        <TriangleAlert size={40} color={colors.destructive} style={{ marginBottom: 16 }} />
        <p style={{ fontSize: 18, fontWeight: 700, color: colors.foreground, margin: "0 0 8px" }}>Something went wrong</p>
        <p style={{ fontSize: 13, color: colors.mutedForeground, margin: "0 0 20px", lineHeight: 1.5 }}>{error.message}</p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <button onClick={resetError} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 10, border: `1px solid ${colors.border}`, backgroundColor: colors.muted, color: colors.foreground, cursor: "pointer", fontSize: 14 }}>
            <RefreshCw size={14} /> Try again
          </button>
          <button onClick={() => window.location.reload()} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 10, border: "none", backgroundColor: colors.primary, color: colors.primaryForeground, cursor: "pointer", fontSize: 14 }}>
            Reload page
          </button>
        </div>
      </div>
    </div>
  );
}
