import { useRef } from "react";
import { T, font, fontSans } from "../App";

// ── BOTÓN ────────────────────────────────────────────────────────
export function Btn({ children, onClick, variant = "primary", size = "md", disabled, style: s = {} }) {
  const variants = {
    primary: { background: `linear-gradient(135deg, ${T.primary}, ${T.primaryDark})`, color: "#fff", border: "none" },
    ghost:   { background: "transparent", color: T.textMuted, border: `1px solid ${T.border}` },
    danger:  { background: T.dangerDim,   color: T.danger,    border: `1px solid ${T.danger}40` },
    success: { background: T.successDim,  color: T.success,   border: `1px solid ${T.success}40` },
    outline: { background: "transparent", color: T.primary,   border: `1px solid ${T.primary}` },
    warning: { background: T.warningDim,  color: T.warning,   border: `1px solid ${T.warning}40` },
  };
  const sizes = {
    sm: { padding: "4px 10px",  fontSize: 11 },
    md: { padding: "8px 16px",  fontSize: 13 },
    lg: { padding: "11px 22px", fontSize: 14 },
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{
      ...variants[variant], ...sizes[size],
      borderRadius: 8, cursor: disabled ? "not-allowed" : "pointer",
      fontFamily: fontSans, fontWeight: 600,
      transition: "all .15s", opacity: disabled ? .5 : 1, ...s,
    }}>
      {children}
    </button>
  );
}

// ── INPUT / SELECT / TEXTAREA ────────────────────────────────────
export function Input({ label, value, onChange, type = "text", placeholder, opts, required, disabled }) {
  const base = {
    background: T.surface, border: `1px solid ${T.border}`,
    borderRadius: 8, padding: "8px 10px",
    color: T.text, fontSize: 13, fontFamily: fontSans, width: "100%",
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      {label && (
        <label style={{ fontSize: 11, color: T.textMuted, fontFamily: font, textTransform: "uppercase", letterSpacing: 0.6, fontWeight: 600 }}>
          {label}{required && <span style={{ color: T.danger }}> *</span>}
        </label>
      )}
      {opts ? (
        <select value={value} onChange={e => onChange(e.target.value)} disabled={disabled} style={base}>
          {opts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : type === "textarea" ? (
        <textarea value={value} onChange={e => onChange(e.target.value)}
          placeholder={placeholder} rows={3} disabled={disabled}
          style={{ ...base, resize: "vertical" }} />
      ) : (
        <input type={type} value={value} onChange={e => onChange(e.target.value)}
          placeholder={placeholder} disabled={disabled} style={base} />
      )}
    </div>
  );
}

// ── CARD ─────────────────────────────────────────────────────────
export function Card({ children, style: s = {}, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: T.card, border: `1px solid ${T.border}`,
      borderRadius: 14, ...s, cursor: onClick ? "pointer" : undefined,
    }}>
      {children}
    </div>
  );
}

// ── MODAL ────────────────────────────────────────────────────────
export function Modal({ title, onClose, children, width = 560 }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,.75)",
      zIndex: 200, display: "flex", alignItems: "center",
      justifyContent: "center", padding: 16, backdropFilter: "blur(6px)",
    }} onClick={onClose}>
      <div style={{
        background: T.surface, border: `1px solid ${T.borderLight}`,
        borderRadius: 18, width: "100%", maxWidth: width,
        maxHeight: "90vh", overflowY: "auto", padding: 28,
      }} onClick={e => e.stopPropagation()}>

        {/* Header modal */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, fontFamily: fontSans, color: T.text }}>
            {title}
          </h2>
          <button onClick={onClose} style={{
            background: T.card, border: `1px solid ${T.border}`,
            borderRadius: 8, width: 30, height: 30,
            color: T.textMuted, cursor: "pointer", fontSize: 14,
          }}>✕</button>
        </div>

        {children}
      </div>
    </div>
  );
}

// ── CHIP / BADGE ─────────────────────────────────────────────────
export function Chip({ label, color, bg }) {
  return (
    <span style={{
      background: bg || color + "20", color,
      border: `1px solid ${color}40`,
      borderRadius: 20, padding: "2px 9px",
      fontSize: 11, fontWeight: 700,
      fontFamily: font, letterSpacing: 0.3,
      whiteSpace: "nowrap",
    }}>
      {label}
    </span>
  );
}

// ── STAT CARD ────────────────────────────────────────────────────
export function Stat({ label, value, icon, color, sub }) {
  return (
    <Card style={{ padding: "18px 20px", display: "flex", alignItems: "center", gap: 14, flex: "1 1 150px" }}>
      <div style={{
        width: 46, height: 46, borderRadius: 12,
        background: color + "20", display: "flex",
        alignItems: "center", justifyContent: "center",
        fontSize: 20, flexShrink: 0,
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 24, fontWeight: 800, color, fontFamily: font, lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 11, color: T.textMuted, marginTop: 3 }}>{label}</div>
        {sub && <div style={{ fontSize: 10, color: T.textDim, marginTop: 1 }}>{sub}</div>}
      </div>
    </Card>
  );
}

// ── PHOTO UPLOADER ───────────────────────────────────────────────
export function PhotoUploader({ photos, onChange }) {
  const ref = useRef();
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {photos.map((p, i) => (
        <div key={i} style={{ position: "relative" }}>
          <img src={p.url} alt="" style={{
            width: 72, height: 72, objectFit: "cover",
            borderRadius: 8, border: `1px solid ${T.border}`,
          }} />
          <button onClick={() => onChange(photos.filter((_, j) => j !== i))} style={{
            position: "absolute", top: -5, right: -5,
            width: 17, height: 17, borderRadius: "50%",
            background: T.danger, border: "none",
            color: "#fff", fontSize: 9, cursor: "pointer",
          }}>✕</button>
        </div>
      ))}
      <button onClick={() => ref.current.click()} style={{
        width: 72, height: 72, borderRadius: 8,
        border: `2px dashed ${T.border}`, background: "transparent",
        color: T.textMuted, cursor: "pointer",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 2, fontSize: 10,
      }}>
        <span style={{ fontSize: 18 }}>📷</span>Foto
      </button>
      <input ref={ref} type="file" accept="image/*" multiple style={{ display: "none" }}
        onChange={e => Array.from(e.target.files).forEach(f => {
          const r = new FileReader();
          r.onload = ev => onChange([...photos, { url: ev.target.result, name: f.name }]);
          r.readAsDataURL(f);
        })} />
    </div>
  );
}

// ── CONSTANTES COMPARTIDAS ───────────────────────────────────────
export const STATUS_BILL = {
  pagado:   { label: "Pagado",   color: "#00C48C", bg: "#00C48C20" },
  pendiente:{ label: "Pendiente",color: "#FFB020", bg: "#FFB02020" },
  vencido:  { label: "Vencido",  color: "#FF4757", bg: "#FF475720" },
};

export const STATUS_CLIENT = {
  activo:   { label: "Activo",   color: "#00C48C" },
  moroso:   { label: "Moroso",   color: "#FF4757" },
  inactivo: { label: "Inactivo", color: "#6B8FAF" },
  cortado:  { label: "Cortado",  color: "#FFB020" },
};

export const TYPE_REPORT = {
  averia:        { label: "Avería",        icon: "🔧", color: "#FF4757" },
  corte:         { label: "Corte",         icon: "✂️", color: "#FFB020" },
  visita:        { label: "Visita",        icon: "👷", color: "#1A8FE3" },
  mantenimiento: { label: "Mantenimiento", icon: "⚙️", color: "#00C48C" },
};

export const STATUS_REPORT = {
  pendiente:     { label: "Pendiente",   color: "#FFB020" },
  "en-progreso": { label: "En Progreso", color: "#1A8FE3" },
  completado:    { label: "Completado",  color: "#00C48C" },
};

// ── EXPORTAR CSV ─────────────────────────────────────────────────
export function exportarCSV(filas, columnas, nombreArchivo) {
  const headers = columnas.map(c => `"${c.label}"`).join(",");
  const rows = filas.map(f =>
    columnas.map(c => `"${String(c.valor(f) ?? "").replace(/"/g, '""')}"`).join(",")
  ).join("\n");
  const blob = new Blob(["﻿" + headers + "\n" + rows], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `${nombreArchivo}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}