import { useState } from "react";
import { T, font, fontSans, uid, today, formatCurrency, formatDate, periodLabel } from "../App";
import { Btn, Input, Modal, Chip, PhotoUploader, Card, Stat, exportarCSV } from "./Compartidos";
import { STATUS_CLIENT, STATUS_BILL } from "./Compartidos";

// ── FORMULARIO CLIENTE ───────────────────────────────────────────
function ClienteForm({ initial, packages, onSave, onClose }) {
  const [f, setF] = useState(initial || {
    code:      `CLI-${uid().slice(0,6).toUpperCase()}`,
    name:      "",
    dni:       "",
    phone:     "",
    email:     "",
    address:   "",
    district:  "",
    sector:    "A",
    packageId: packages[0]?.id || 1,
    meterCode: "",
    lat:       "",
    lng:       "",
    status:    "activo",
    joinDate:  today(),
    photos:    [],
  });

  const [locating, setLocating] = useState(false);
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));

  const getGPS = () => {
    setLocating(true);
    navigator.geolocation?.getCurrentPosition(
      pos => {
        set("lat", pos.coords.latitude.toFixed(6));
        set("lng", pos.coords.longitude.toFixed(6));
        setLocating(false);
      },
      () => { alert("No se pudo obtener la ubicación. Activa el GPS."); setLocating(false); },
      { enableHighAccuracy: true }
    );
  };

  const guardar = () => {
    if (!f.name.trim()) return alert("El nombre es obligatorio");
    if (!f.dni.trim())  return alert("El DNI/RUC es obligatorio");
    onSave(f);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Input label="Código"           value={f.code}     onChange={v => set("code", v)}     required />
        <Input label="Estado"           value={f.status}   onChange={v => set("status", v)}
          opts={Object.entries(STATUS_CLIENT).map(([v, c]) => ({ value: v, label: c.label }))} />
        <Input label="Nombre Completo"  value={f.name}     onChange={v => set("name", v)}     required />
        <Input label="DNI / RUC"        value={f.dni}      onChange={v => set("dni", v)}      required />
        <Input label="Teléfono"         value={f.phone}    onChange={v => set("phone", v)} />
        <Input label="Correo"           value={f.email}    onChange={v => set("email", v)}    type="email" />
        <Input label="Dirección"        value={f.address}  onChange={v => set("address", v)}  required />
        <Input label="Distrito"         value={f.district} onChange={v => set("district", v)} />
        <Input label="Sector"           value={f.sector}   onChange={v => set("sector", v)}
          opts={["A","B","C","D","E"].map(s => ({ value: s, label: `Sector ${s}` }))} />
        <Input label="Código Medidor"   value={f.meterCode} onChange={v => set("meterCode", v)} />
        <Input label="Paquete de Servicio" value={f.packageId}
          onChange={v => set("packageId", parseInt(v))}
          opts={packages.filter(p => p.active).map(p => ({ value: p.id, label: `${p.name} — S/ ${p.price}/mes` }))} />
        <Input label="Fecha de Alta"    value={f.joinDate} onChange={v => set("joinDate", v)} type="date" />
      </div>

      {/* GPS */}
      <div>
        <label style={{ fontSize: 11, color: T.textMuted, fontFamily: font, textTransform: "uppercase", letterSpacing: 0.6, fontWeight: 600, display: "block", marginBottom: 6 }}>
          📍 Ubicación GPS
        </label>
        <div style={{ display: "flex", gap: 8 }}>
          <input value={f.lat} onChange={e => set("lat", e.target.value)} placeholder="Latitud  (ej: -12.0970)"
            style={{ flex: 1, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: "8px 10px", color: T.text, fontSize: 13, fontFamily: fontSans }} />
          <input value={f.lng} onChange={e => set("lng", e.target.value)} placeholder="Longitud (ej: -77.0360)"
            style={{ flex: 1, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: "8px 10px", color: T.text, fontSize: 13, fontFamily: fontSans }} />
          <Btn variant="outline" onClick={getGPS} disabled={locating}>
            {locating ? "⏳ Buscando..." : "📡 Mi GPS"}
          </Btn>
        </div>
        {f.lat && f.lng && (
          <div style={{ fontSize: 11, color: T.success, marginTop: 4 }}>✅ Ubicación capturada: {f.lat}, {f.lng}</div>
        )}
      </div>

      {/* Fotos */}
      <div>
        <label style={{ fontSize: 11, color: T.textMuted, fontFamily: font, textTransform: "uppercase", letterSpacing: 0.6, fontWeight: 600, display: "block", marginBottom: 6 }}>
          📸 Fotos del Medidor
        </label>
        <PhotoUploader photos={f.photos} onChange={v => set("photos", v)} />
      </div>

      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 4 }}>
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn onClick={guardar}>💾 Guardar Cliente</Btn>
      </div>
    </div>
  );
}

// ── HISTORIAL DE PAGOS ───────────────────────────────────────────
function HistorialModal({ client, packages, bills, onClose }) {
  const pkg      = packages.find(p => p.id === client.packageId);
  const recibos  = bills.filter(b => b.clientId === client.id).sort((a, b) => (b.period || "").localeCompare(a.period || ""));
  const pagados  = recibos.filter(b => b.status === "pagado");
  const pendientes = recibos.filter(b => b.status !== "pagado");
  const totalPagado = pagados.reduce((s, b) => s + b.total, 0);
  const totalDeuda  = pendientes.reduce((s, b) => s + b.total, 0);

  return (
    <Modal title={`📋 Historial — ${client.name}`} onClose={onClose} width={680}>
      {/* Resumen */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
        <Stat label="Total pagado"    value={formatCurrency(totalPagado)}  icon="✅" color={T.success} />
        <Stat label="Deuda pendiente" value={formatCurrency(totalDeuda)}   icon="⏳" color={totalDeuda > 0 ? T.danger : T.textMuted} />
        <Stat label="Recibos totales" value={recibos.length}               icon="📋" color={T.primary} />
      </div>

      {/* Info cliente */}
      <div style={{
        background: T.bg, borderRadius: 10, padding: "12px 16px",
        border: `1px solid ${T.border}`, marginBottom: 16,
        display: "flex", gap: 16, flexWrap: "wrap", fontSize: 12,
      }}>
        <span>📦 <b style={{ color: pkg?.color }}>{pkg?.name || "Sin paquete"}</b></span>
        <span>📍 {client.address}</span>
        <span>🔢 Medidor: {client.meterCode || "—"}</span>
        <span>📅 Alta: {formatDate(client.joinDate)}</span>
      </div>

      {/* Lista recibos */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: `2px solid ${T.border}` }}>
              {["Código", "Periodo", "Total", "Estado", "Vence", "Pagado"].map(h => (
                <th key={h} style={{ padding: "8px 10px", textAlign: "left", color: T.textMuted, fontWeight: 600, fontSize: 11, fontFamily: font, textTransform: "uppercase" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recibos.map(b => {
              const sc = STATUS_BILL[b.status];
              return (
                <tr key={b.id}
                  style={{ borderBottom: `1px solid ${T.border}30` }}
                  onMouseEnter={e => e.currentTarget.style.background = T.surface}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <td style={{ padding: "8px 10px", fontFamily: font, color: T.primary, fontSize: 11 }}>{b.code}</td>
                  <td style={{ padding: "8px 10px", color: T.textMuted, fontSize: 12 }}>{periodLabel(b.period)}</td>
                  <td style={{ padding: "8px 10px", fontFamily: font, fontWeight: 700, color: T.accent }}>{formatCurrency(b.total)}</td>
                  <td style={{ padding: "8px 10px" }}><Chip label={sc?.label} color={sc?.color} bg={sc?.bg} /></td>
                  <td style={{ padding: "8px 10px", fontSize: 11, color: T.textMuted }}>{formatDate(b.dueDate)}</td>
                  <td style={{ padding: "8px 10px", fontSize: 11, color: b.paidDate ? T.success : T.textDim }}>
                    {b.paidDate ? formatDate(b.paidDate) : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {recibos.length === 0 && (
          <div style={{ textAlign: "center", padding: 40, color: T.textMuted }}>Sin recibos registrados</div>
        )}
      </div>
    </Modal>
  );
}

// ── RUTAS DE COBRANZA ────────────────────────────────────────────
function RutasModal({ clients, packages, bills, onClose }) {
  const [sector, setSector] = useState("all");

  const filtrados = clients
    .filter(c => sector === "all" || c.sector === sector)
    .filter(c => c.status === "activo" || c.status === "moroso")
    .sort((a, b) => {
      if (a.sector !== b.sector) return a.sector.localeCompare(b.sector);
      return a.address.localeCompare(b.address);
    });

  const imprimir = () => {
    const w = window.open("", "_blank", "width=800,height=900");
    const filas = filtrados.map(c => {
      const pkg  = packages.find(p => p.id === c.packageId);
      const deuda = bills.filter(b => b.clientId === c.id && b.status !== "pagado").reduce((s, b) => s + b.total, 0);
      return `<tr>
        <td>${c.code}</td><td>${c.name}</td><td>${c.sector}</td>
        <td>${c.address}</td><td>${c.phone || "—"}</td>
        <td>${pkg?.name || "—"}</td>
        <td style="color:${deuda>0?"#FF4757":"#00C48C"};font-weight:bold">
          ${deuda > 0 ? `S/ ${deuda.toFixed(2)}` : "Al día"}
        </td>
        <td style="width:80px;border-bottom:1px solid #ccc"></td>
      </tr>`;
    }).join("");

    w.document.write(`<html><head><title>Ruta de Cobranza</title>
      <style>body{font-family:sans-serif;font-size:12px;padding:20px}
      h2{text-align:center}table{width:100%;border-collapse:collapse}
      th{background:#f0f0f0;padding:6px 8px;text-align:left;border:1px solid #ddd}
      td{padding:6px 8px;border:1px solid #eee}
      @media print{body{margin:0}}</style></head>
      <body><h2>📋 Ruta de Cobranza${sector !== "all" ? ` — Sector ${sector}` : ""}</h2>
      <p>Total: ${filtrados.length} clientes · Fecha: ${new Date().toLocaleDateString("es-PE")}</p>
      <table><thead><tr>
        <th>Código</th><th>Cliente</th><th>Sector</th><th>Dirección</th>
        <th>Teléfono</th><th>Paquete</th><th>Deuda</th><th>Firma</th>
      </tr></thead><tbody>${filas}</tbody></table></body></html>`);
    w.document.close();
    setTimeout(() => { w.print(); }, 400);
  };

  return (
    <Modal title="🗺️ Rutas de Cobranza" onClose={onClose} width={780}>
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        {["all","A","B","C","D","E"].map(s => (
          <Btn key={s} size="sm" variant={sector === s ? "primary" : "ghost"} onClick={() => setSector(s)}>
            {s === "all" ? "Todos sectores" : `Sector ${s}`}
          </Btn>
        ))}
        <div style={{ marginLeft: "auto" }}>
          <Btn variant="outline" onClick={imprimir}>🖨️ Imprimir hoja</Btn>
        </div>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: `2px solid ${T.border}` }}>
              {["#","Sector","Cliente","Dirección","Teléfono","Deuda"].map(h => (
                <th key={h} style={{ padding: "8px 10px", textAlign: "left", color: T.textMuted, fontWeight: 600, fontSize: 11, fontFamily: font, textTransform: "uppercase" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtrados.map((c, i) => {
              const deuda = bills.filter(b => b.clientId === c.id && b.status !== "pagado").reduce((s, b) => s + b.total, 0);
              return (
                <tr key={c.id} style={{ borderBottom: `1px solid ${T.border}30` }}
                  onMouseEnter={e => e.currentTarget.style.background = T.surface}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <td style={{ padding: "8px 10px", color: T.textDim, fontSize: 11 }}>{i + 1}</td>
                  <td style={{ padding: "8px 10px" }}>
                    <span style={{ background: T.primaryGlow, color: T.primary, borderRadius: 6, padding: "2px 8px", fontWeight: 700, fontSize: 12 }}>
                      {c.sector}
                    </span>
                  </td>
                  <td style={{ padding: "8px 10px" }}>
                    <div style={{ fontWeight: 600, color: T.text }}>{c.name}</div>
                    <div style={{ fontSize: 10, color: T.textMuted }}>{c.code}</div>
                  </td>
                  <td style={{ padding: "8px 10px", color: T.textMuted, fontSize: 12 }}>{c.address}</td>
                  <td style={{ padding: "8px 10px", color: T.textMuted, fontSize: 12 }}>{c.phone || "—"}</td>
                  <td style={{ padding: "8px 10px", fontWeight: 700, fontFamily: font, color: deuda > 0 ? T.danger : T.success }}>
                    {deuda > 0 ? formatCurrency(deuda) : "Al día"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtrados.length === 0 && (
          <div style={{ textAlign: "center", padding: 40, color: T.textMuted }}>Sin clientes en esta selección</div>
        )}
      </div>
    </Modal>
  );
}

// ── MÓDULO PRINCIPAL ─────────────────────────────────────────────
export default function Clientes({ clients, setClients, packages, role, dbClientes }) {
  const [search,       setSearch]       = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [modal,        setModal]        = useState(null);
  const [historial,    setHistorial]    = useState(null);
  const [rutas,        setRutas]        = useState(false);

  const filtered = clients.filter(c => {
    if (filterStatus !== "all" && c.status !== filterStatus) return false;
    const q = search.toLowerCase();
    return !q || c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
      || c.dni.includes(q) || c.address.toLowerCase().includes(q);
  });

  const guardar = async (f) => {
    try {
      if (modal === "new") {
        const nuevo = await dbClientes.create(f);
        setClients(cs => [...cs, nuevo]);
      } else {
        const actualizado = await dbClientes.update(modal.id, f);
        setClients(cs => cs.map(c => c.id === modal.id ? actualizado : c));
      }
      setModal(null);
    } catch (e) {
      console.error("Error guardando cliente:", e);
      alert("Error al guardar. Intenta de nuevo.");
    }
  };

  const eliminar = async (c) => {
    if (confirm(`¿Eliminar a ${c.name}? Esta acción no se puede deshacer.`)) {
      try {
        await dbClientes.delete(c.id);
        setClients(cs => cs.filter(x => x.id !== c.id));
      } catch (e) {
        alert("Error al eliminar. Intenta de nuevo.");
      }
    }
  };

  const abrirWhatsApp = (c) => {
    if (!c.phone) return alert("Este cliente no tiene teléfono registrado.");
    const deuda = bills.filter(b => b.clientId === c.id && b.status !== "pagado").reduce((s, b) => s + b.total, 0);
    const msg = deuda > 0
      ? `Estimado/a *${c.name}*, le informamos que tiene una deuda pendiente de *S/ ${deuda.toFixed(2)}* en el sistema de agua potable. Por favor acérquese a cancelar. Gracias.`
      : `Estimado/a *${c.name}*, le recordamos que su servicio de agua potable está al día. ¡Gracias por su puntualidad!`;
    window.open(`https://wa.me/51${c.phone.replace(/\D/g, "")}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const exportar = () => {
    exportarCSV(filtered, [
      { label: "Código",      valor: c => c.code },
      { label: "Nombre",      valor: c => c.name },
      { label: "DNI/RUC",     valor: c => c.dni },
      { label: "Teléfono",    valor: c => c.phone },
      { label: "Dirección",   valor: c => c.address },
      { label: "Distrito",    valor: c => c.district },
      { label: "Sector",      valor: c => c.sector },
      { label: "Estado",      valor: c => STATUS_CLIENT[c.status]?.label || c.status },
      { label: "Paquete",     valor: c => packages.find(p => p.id === c.packageId)?.name || "" },
      { label: "Medidor",     valor: c => c.meterCode },
      { label: "Fecha Alta",  valor: c => c.joinDate },
      { label: "Latitud",     valor: c => c.lat },
      { label: "Longitud",    valor: c => c.lng },
    ], "clientes");
  };

  const morosos = clients.filter(c => c.status === "moroso").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Encabezado */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
        <div>
          <h1 style={{ margin: "0 0 2px", fontSize: 22, fontWeight: 800, fontFamily: fontSans }}>
            👥 Clientes
          </h1>
          <p style={{ margin: 0, color: T.textMuted, fontSize: 13 }}>
            {clients.length} clientes registrados
            {morosos > 0 && <span style={{ color: T.danger, marginLeft: 8 }}>· {morosos} morosos</span>}
            {role === "cobrador" && <span style={{ color: T.warning, marginLeft: 8, fontSize: 11 }}>👷 Modo Cobrador</span>}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn variant="ghost" size="sm" onClick={exportar}>📥 Exportar Excel</Btn>
          <Btn variant="outline" onClick={() => setRutas(true)}>🗺️ Rutas</Btn>
          <Btn onClick={() => setModal("new")}>+ Nuevo Cliente</Btn>
        </div>
      </div>

      {/* Buscador y filtros */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Buscar nombre, código, DNI, dirección..."
          style={{ flex: "1 1 220px", background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: "9px 14px", color: T.text, fontSize: 13, fontFamily: fontSans }} />
        {["all","activo","moroso","inactivo","cortado"].map(s => (
          <Btn key={s} size="sm" variant={filterStatus === s ? "primary" : "ghost"} onClick={() => setFilterStatus(s)}>
            {s === "all" ? "Todos" : STATUS_CLIENT[s]?.label}
          </Btn>
        ))}
      </div>

      {/* Tabla */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: fontSans, fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: `2px solid ${T.border}` }}>
              {["Código","Cliente","DNI/RUC","Teléfono","Sector","Paquete","Estado","Acciones"].map(h => (
                <th key={h} style={{ padding: "10px 12px", textAlign: "left", color: T.textMuted, fontWeight: 600, fontSize: 11, fontFamily: font, textTransform: "uppercase", letterSpacing: 0.5, whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => {
              const pkg = packages.find(p => p.id === c.packageId);
              const sc  = STATUS_CLIENT[c.status];
              const deuda = bills.filter(b => b.clientId === c.id && b.status !== "pagado").reduce((s, b) => s + b.total, 0);
              return (
                <tr key={c.id}
                  style={{ borderBottom: `1px solid ${T.border}40`, transition: "background .1s" }}
                  onMouseEnter={e => e.currentTarget.style.background = T.surface}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <td style={{ padding: "10px 12px", fontFamily: font, color: T.primary, fontSize: 12 }}>{c.code}</td>
                  <td style={{ padding: "10px 12px" }}>
                    <div style={{ fontWeight: 600, color: T.text }}>{c.name}</div>
                    <div style={{ fontSize: 11, color: T.textMuted, display: "flex", alignItems: "center", gap: 6 }}>
                      {c.address}
                      <button onClick={() => {
                        const url = c.lat && c.lng
                          ? `https://www.google.com/maps?q=${c.lat},${c.lng}`
                          : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.address + ", " + c.district)}`;
                        window.open(url, "_blank");
                      }} style={{ background: "#1A73E820", border: "1px solid #1A73E840", borderRadius: 5, padding: "2px 6px", color: "#4285F4", cursor: "pointer", fontSize: 10, fontWeight: 700, whiteSpace: "nowrap" }}>🗺️</button>
                    </div>
                    {deuda > 0 && <div style={{ fontSize: 10, color: T.danger, fontWeight: 700 }}>⚠️ Deuda: {formatCurrency(deuda)}</div>}
                  </td>
                  <td style={{ padding: "10px 12px", fontFamily: font, color: T.textMuted, fontSize: 12 }}>{c.dni}</td>
                  <td style={{ padding: "10px 12px", color: T.textMuted, fontSize: 12 }}>{c.phone || "—"}</td>
                  <td style={{ padding: "10px 12px", color: T.textMuted }}>{c.sector}</td>
                  <td style={{ padding: "10px 12px" }}>
                    {pkg && <span style={{ color: pkg.color, fontWeight: 600, fontSize: 12 }}>● {pkg.name}</span>}
                  </td>
                  <td style={{ padding: "10px 12px" }}>
                    <Chip label={sc?.label || c.status} color={sc?.color || T.textMuted} />
                  </td>
                  <td style={{ padding: "10px 12px" }}>
                    <div style={{ display: "flex", gap: 5 }}>
                      <Btn size="sm" variant="ghost" onClick={() => setHistorial(c)} title="Historial de pagos">📋</Btn>
                      <Btn size="sm" variant="success" onClick={() => abrirWhatsApp(c)} title="Enviar WhatsApp">💬</Btn>
                      <Btn size="sm" variant="ghost" onClick={() => setModal(c)}>✏️</Btn>
                      <Btn size="sm" variant="danger" onClick={() => eliminar(c)}>🗑️</Btn>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: 50, color: T.textMuted }}>No se encontraron clientes</div>
        )}
      </div>

      {/* Modal editar/crear */}
      {modal && (
        <Modal title={modal === "new" ? "➕ Nuevo Cliente" : `✏️ Editar — ${modal.name}`} onClose={() => setModal(null)} width={700}>
          <ClienteForm initial={modal !== "new" ? modal : null} packages={packages} onSave={guardar} onClose={() => setModal(null)} />
        </Modal>
      )}

      {/* Modal historial */}
      {historial && (
        <HistorialModal client={historial} packages={packages} bills={bills} onClose={() => setHistorial(null)} />
      )}

      {/* Modal rutas */}
      {rutas && (
        <RutasModal clients={clients} packages={packages} bills={bills} onClose={() => setRutas(false)} />
      )}
    </div>
  );
}
