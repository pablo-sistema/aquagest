import { useEffect, useRef, useState } from "react";
import { T, font, fontSans } from "../App";
import { Btn, Chip } from "./Compartidos";
import { STATUS_CLIENT } from "./Compartidos";

const SECTOR_COLORS = { A: "#1A8FE3", B: "#00C48C", C: "#FFB020", D: "#FF4757", E: "#A78BFA" };

export default function Mapa({ clients, packages, bills }) {
  const mapRef     = useRef(null);
  const leafletRef = useRef(null);
  // Inicializar listo=true si Leaflet ya estaba cargado (visita previa al módulo)
  const [listo,  setListo]  = useState(() => !!window.L);
  const [error,  setError]  = useState(false);
  const [filtro, setFiltro] = useState("all");
  const [sector, setSector] = useState("all");

  const conCoordenadas = clients.filter(c => c.lat && c.lng);
  const sinCoordenadas = clients.filter(c => !c.lat || !c.lng);

  const clientesFiltrados = clients.filter(c => {
    if (filtro !== "all" && c.status !== filtro) return false;
    if (sector !== "all" && c.sector !== sector) return false;
    return true;
  });

  // Cargar Leaflet desde CDN solo si no está ya disponible
  useEffect(() => {
    if (window.L) return;

    const link = document.createElement("link");
    link.rel   = "stylesheet";
    link.href  = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    link.id    = "leaflet-css";
    if (!document.getElementById("leaflet-css")) document.head.appendChild(link);

    const script   = document.createElement("script");
    script.src     = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload  = () => setListo(true);
    script.onerror = () => setError(true);
    document.head.appendChild(script);
  }, []);

  // Inicializar mapa cuando Leaflet está listo
  useEffect(() => {
    if (!listo || !mapRef.current || leafletRef.current) return;

    const L = window.L;
    const coords = clients.filter(c => c.lat && c.lng);
    const lat = coords.length ? coords.reduce((s, c) => s + parseFloat(c.lat), 0) / coords.length : -12.046374;
    const lng = coords.length ? coords.reduce((s, c) => s + parseFloat(c.lng), 0) / coords.length : -77.042793;

    const map = L.map(mapRef.current).setView([lat, lng], coords.length ? 13 : 10);
    leafletRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map);

    return () => {
      map.remove();
      leafletRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listo]);

  // Actualizar marcadores cuando cambian filtros o clientes
  useEffect(() => {
    if (!listo || !leafletRef.current) return;
    const L   = window.L;
    const map = leafletRef.current;

    map.eachLayer(layer => { if (layer instanceof L.Marker) map.removeLayer(layer); });

    clientesFiltrados.filter(c => c.lat && c.lng).forEach(c => {
      const sc    = STATUS_CLIENT[c.status];
      const color = sc?.color || "#6B8FAF";
      const icon  = L.divIcon({
        className: "",
        html: `<div style="width:28px;height:28px;border-radius:50%;background:${color};border:3px solid white;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:900;color:white;box-shadow:0 2px 8px rgba(0,0,0,.4);cursor:pointer;">${c.sector}</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const pkg  = packages.find(p => p.id === c.packageId);
      const deuda = bills.filter(b => b.clientId === c.id && b.status !== "pagado")
                         .reduce((s, b) => s + b.total, 0);

      L.marker([parseFloat(c.lat), parseFloat(c.lng)], { icon })
        .addTo(map)
        .bindPopup(`
          <div style="font-family:sans-serif;min-width:180px">
            <div style="font-weight:800;font-size:14px;margin-bottom:4px">${c.name}</div>
            <div style="color:#666;font-size:12px">${c.code} · Sector ${c.sector}</div>
            <div style="font-size:12px;margin-top:4px">${c.address}</div>
            <div style="margin-top:8px;padding:6px;background:#f5f5f5;border-radius:6px">
              <div style="font-size:11px;color:#999">Paquete</div>
              <div style="font-weight:700;color:${pkg?.color || '#333'}">${pkg?.name || "—"}</div>
            </div>
            ${deuda > 0 ? `<div style="margin-top:6px;color:#FF4757;font-weight:700;font-size:12px">⚠️ Deuda: S/ ${deuda.toFixed(2)}</div>` : ""}
            <div style="margin-top:8px">
              <a href="https://www.google.com/maps?q=${c.lat},${c.lng}" target="_blank" style="font-size:11px;color:#1A8FE3">🗺️ Ver en Google Maps</a>
            </div>
          </div>
        `);
    });
  }, [listo, clientesFiltrados, packages, bills]);

  const stats = [
    { label: "Activos",  n: clients.filter(c => c.status === "activo").length,  color: T.success },
    { label: "Morosos",  n: clients.filter(c => c.status === "moroso").length,  color: T.danger  },
    { label: "Cortados", n: clients.filter(c => c.status === "cortado").length, color: T.warning },
    { label: "En mapa",  n: conCoordenadas.length,                              color: T.primary },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
        <div>
          <h1 style={{ margin: "0 0 2px", fontSize: 22, fontWeight: 800, fontFamily: fontSans }}>
            🗺️ Mapa de Clientes
          </h1>
          <p style={{ margin: 0, color: T.textMuted, fontSize: 13 }}>
            {conCoordenadas.length} de {clients.length} clientes tienen coordenadas GPS
          </p>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {stats.map(s => (
          <div key={s.label} style={{
            background: T.card, border: `1px solid ${s.color}30`,
            borderRadius: 10, padding: "10px 18px",
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <span style={{ fontSize: 20, fontWeight: 900, color: s.color, fontFamily: font }}>{s.n}</span>
            <span style={{ fontSize: 12, color: T.textMuted }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {["all","activo","moroso","cortado","inactivo"].map(s => (
          <Btn key={s} size="sm" variant={filtro === s ? "primary" : "ghost"} onClick={() => setFiltro(s)}>
            {s === "all" ? "Todos" : STATUS_CLIENT[s]?.label}
          </Btn>
        ))}
        <div style={{ width: 1, background: T.border, margin: "0 4px" }} />
        {["all","A","B","C","D","E"].map(s => (
          <Btn key={s} size="sm"
            variant={sector === s ? "primary" : "ghost"}
            onClick={() => setSector(s)}
            style={sector !== s && s !== "all" ? { color: SECTOR_COLORS[s], borderColor: SECTOR_COLORS[s] + "60" } : {}}
          >
            {s === "all" ? "Todos sectores" : `Sector ${s}`}
          </Btn>
        ))}
      </div>

      {/* Mapa */}
      {error ? (
        <div style={{ background: T.dangerDim, border: `1px solid ${T.danger}40`, borderRadius: 12, padding: 40, textAlign: "center", color: T.danger }}>
          ❌ No se pudo cargar el mapa. Verifica tu conexión a internet.
        </div>
      ) : !listo ? (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 60, textAlign: "center", color: T.textMuted }}>
          ⏳ Cargando mapa...
        </div>
      ) : (
        <div style={{ borderRadius: 14, overflow: "hidden", border: `1px solid ${T.border}` }}>
          <div ref={mapRef} style={{ height: 480, width: "100%", background: T.surface }} />
        </div>
      )}

      {/* Sin coordenadas */}
      {sinCoordenadas.length > 0 && (
        <div style={{ background: T.card, borderRadius: 12, padding: 16, border: `1px solid ${T.border}` }}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10, color: T.textMuted }}>
            📍 {sinCoordenadas.length} clientes sin coordenadas GPS
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {sinCoordenadas.slice(0, 20).map(c => (
              <Chip key={c.id} label={`${c.code} — ${c.name.split(" ")[0]}`} color={T.textMuted} />
            ))}
            {sinCoordenadas.length > 20 && (
              <Chip label={`+${sinCoordenadas.length - 20} más`} color={T.textDim} />
            )}
          </div>
          <div style={{ fontSize: 11, color: T.textDim, marginTop: 8 }}>
            Edita cada cliente y usa "📡 Mi GPS" para capturar su ubicación.
          </div>
        </div>
      )}
    </div>
  );
}
