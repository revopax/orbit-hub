'use client';
import React from "react";

interface IcpChipsProps {
  esCuentaObjetivo?: boolean;
  tier?: string;
  icpIndustriaMatch?: boolean;
}

const TIER_COLOR: Record<string, { bg: string; text: string; border: string }> = {
  "Tier 1":          { bg: "#FFF7ED", text: "#B45309", border: "#FCD34D" },
  "Tier 2":          { bg: "#EFF6FF", text: "#1D4ED8", border: "#BFDBFE" },
  "Tier 3":          { bg: "#F0FDF4", text: "#15803D", border: "#BBF7D0" },
  "Cuenta Objetivo": { bg: "#FFF7ED", text: "#B45309", border: "#FCD34D" },
};

export const IcpChips: React.FC<IcpChipsProps> = ({
  esCuentaObjetivo,
  tier,
  icpIndustriaMatch,
}) => {
  if (!esCuentaObjetivo && !icpIndustriaMatch) return null;

  const label  = tier || "Cuenta Objetivo";
  const colors = TIER_COLOR[label] ?? TIER_COLOR["Cuenta Objetivo"];

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, marginLeft: 5, verticalAlign: "middle" }}>
      {esCuentaObjetivo && (
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 3,
          padding: "1px 6px", borderRadius: 999, fontSize: 10, fontWeight: 700,
          lineHeight: "15px", background: colors.bg, color: colors.text,
          border: `1px solid ${colors.border}`, whiteSpace: "nowrap",
        }}>
          ⭐ {label}
        </span>
      )}
      {!esCuentaObjetivo && icpIndustriaMatch && (
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 3,
          padding: "1px 6px", borderRadius: 999, fontSize: 10, fontWeight: 700,
          lineHeight: "15px", background: "#F0FDF4", color: "#15803D",
          border: "1px solid #BBF7D0", whiteSpace: "nowrap",
        }}>
          ICP ✓
        </span>
      )}
    </span>
  );
};
