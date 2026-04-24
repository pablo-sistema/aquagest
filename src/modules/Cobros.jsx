import { useState, useEffect } from "react";
import { T, font, fontSans, uid, today, formatCurrency, formatDate, periodLabel } from "../App";
import { Btn, Input, Modal, Chip, Card, Stat, exportarCSV } from "./Compartidos";
import { STATUS_BILL } from "./Compartidos";

// ── IMPRESIÓN ────────────────────────────────────────────────────
function Imprimir({ bill, client, pkg, format, onClose, config = {} }) {
  const isTicket  = format === "ticket";
  const isFactura = format === "factura";

  const doPrint = () => {
    const w = window.open("", "_blank", "width=750,height=900");
    const ticketCSS = isTicket
      ? `body{width:80mm;font-size:11px;margin:0 auto;padding:8px}`
      : `body{max-width:210mm;margin:20mm auto;font-size:13px;padding:20px}`;
    w.document.write(`
      <html><head><title>${bill.code}</title>
      <style>
        *{box-sizing:border-box;font-family:'Courier New',monospace}
        ${ticketCSS}
        .row{display:flex;justify-content:space-between;margin:4px 0}
        .total{font-size:${isTicket?"16":"22"}px;font-weight:900}
        .divider{border:none;border-top:1px dashed #aaa;margin:8px 0}
        @media print{body{margin:0}}
      </style></head>
      <body>
        <div style="text-align:center;margin-bottom:12px">
          <div style="font-size:${isTicket?"16":"24"}px;font-weight:900">💧 ${config.empresa || "AQUAGEST PRO"}</div>
          ${config.direccion ? `<div style="font-size:${isTicket?"9":"11"}px;color:#555">${config.direccion}</div>` : ""}
          <div style="font-size:${isTicket?"9":"11"}px;color:#555">RUC: ${config.ruc || "—"}</div>
          ${config.telefono ? `<div style="font-size:${isTicket?"9":"11"}px;color:#555">Tel: ${config.telefono}</div>` : ""}
          <div style="font-size:${isTicket?"13":"18"}px;font-weight:800;margin-top:6px">
            ${isFactura ? "FACTURA ELECTRÓNICA" : "BOLETA DE PAGO"}
          </div>
          <div style="font-weight:700">${bill.code}</div>
        </div>
        <hr class="divider"/>
        <div class="row"><span>Cliente:</span><span>${client?.name}</span></div>
        <div class="row"><span>Código:</span><span>${client?.code}</span></div>
        <div class="row"><span>DNI/RUC:</span><span>${client?.dni}</span></div>
        <div class="row"><span>Dirección:</span><span>${client?.address}</span></div>
        <div class="row"><span>Periodo:</span><span>${periodLabel(bill.period)}</span></div>
        <div class="row"><span>Emisión:</span><span>${formatDate(bill.issueDate)}</span></div>
        <div class="row"><span>Vence:</span><span>${formatDate(bill.dueDate)}</span></div>
        <hr class="divider"/>
        <div class="row"><span>Paquete:</span><span>${pkg?.name || "—"}</span></div>
        <div class="row">
          <span>Servicio mensual</span>
          <span>${formatCurrency(bill.total)}</span>
        </div>
        <hr class="divider"/>
        <div class="row total">
          <span>TOTAL</span>
          <span>${formatCurrency(bill.total)}</span>
        </div>
        ${isFactura ? `
        <div style="font-size:11px;color:#666;margin-top:8px">
          <div class="row"><span>IGV (18%):</span><span>${formatCurrency(bill.total * 0.18 / 1.18)}</span></div>
          <div class="row"><span>Base imponible:</span><span>${formatCurrency(bill.total / 1.18)}</span></div>
        </div>` : ""}
        <hr class="divider"/>
        <div style="text-align:center;font-size:${isTicket?"10":"12"}px;color:#777;margin-top:8px">
          ${bill.status === "pagado"
            ? `✅ PAGADO el ${formatDate(bill.paidDate)}`
            : "⏳ PENDIENTE DE PAGO"}
          <br/>Gracias por su puntualidad
        </div>
      </body></html>
    `);
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); w.close(); }, 500);
  };

  return (
    <Modal
      title={`🖨️ Vista Previa — ${isTicket ? "Ticket 80mm" : isFactura ? "Factura A4" : "Recibo A4"}`}
      onClose={onClose}
      width={480}
    >
      {/* Preview */}
      <div style={{
        background: "#fff", color: "#000",
        borderRadius: 8, padding: isTicket ? "14px 16px" : "24px 32px",
        fontFamily: "'Courier New', monospace",
        fontSize: isTicket ? 11 : 13, lineHeight: 1.7,
        border: "1px solid #ddd", maxHeight: 420, overflowY: "auto",
      }}>
        <div style={{ textAlign: "center", borderBottom: "1px dashed #aaa", paddingBottom: 10, marginBottom: 10 }}>
          <div style={{ fontWeight: 900, fontSize: isTicket ? 14 : 20 }}>💧 {config.empresa || "AQUAGEST PRO"}</div>
          {config.direccion && <div style={{ fontSize: isTicket ? 9 : 11, color: "#555" }}>{config.direccion}</div>}
          <div style={{ fontSize: isTicket ? 9 : 11, color: "#555" }}>RUC: {config.ruc || "—"}</div>
          <div style={{ fontWeight: 800, fontSize: isTicket ? 13 : 17, marginTop: 6 }}>
            {isFactura ? "FACTURA ELECTRÓNICA" : "BOLETA DE PAGO"}
          </div>
          <div style={{ fontWeight: 700 }}>{bill.code}</div>
        </div>

        {[
          ["Cliente",   client?.name],
          ["Código",    client?.code],
          ["DNI/RUC",   client?.dni],
          ["Dirección", client?.address],
          ["Periodo",   periodLabel(bill.period)],
          ["Emisión",   formatDate(bill.issueDate)],
          ["Vence",     formatDate(bill.dueDate)],
        ].map(([k, v]) => (
          <div key={k} style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
            <span style={{ color: "#555" }}>{k}:</span>
            <span style={{ fontWeight: 600 }}>{v}</span>
          </div>
        ))}

        <div style={{ borderTop: "1px dashed #aaa", borderBottom: "1px dashed #aaa", padding: "8px 0", margin: "8px 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Paquete: {pkg?.name}</span>
            <span>{formatCurrency(bill.total)}</span>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 900, fontSize: isTicket ? 14 : 18 }}>
          <span>TOTAL</span>
          <span>{formatCurrency(bill.total)}</span>
        </div>

        <div style={{ textAlign: "center", marginTop: 10, fontSize: isTicket ? 9 : 11, color: "#777" }}>
          {bill.status === "pagado" ? `✅ PAGADO el ${formatDate(bill.paidDate)}` : "⏳ PENDIENTE DE PAGO"}
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 16, justifyContent: "flex-end" }}>
        <Btn variant="ghost" onClick={onClose}>Cerrar</Btn>
        <Btn onClick={doPrint}>🖨️ Imprimir ahora</Btn>
      </div>
    </Modal>
  );
}

// ── FORMULARIO COBRO MANUAL ──────────────────────────────────────
function CobroForm({ clients, packages, onSave, onClose }) {
  const [clientId, setClientId] = useState(clients[0]?.id || "");
  const [type,     setType]     = useState("boleta");
  const [period,   setPeriod]   = useState(new Date().toISOString().slice(0, 7));
  const [dueDate,  setDueDate]  = useState("");
  const [notes,    setNotes]    = useState("");

  const client = clients.find(c => c.id === parseInt(clientId));
  const pkg    = packages.find(p => p.id === client?.packageId);
  const total  = pkg?.price || 0;

  const generar = () => {
    if (!clientId) return alert("Selecciona un cliente");
    if (!dueDate)  return alert("Ingresa la fecha de vencimiento");
    const prefix = type === "factura" ? "FAC" : "BOL";
    onSave({
      id:            uid(),
      clientId:      parseInt(clientId),
      packageId:     pkg?.id,
      code:          `${prefix}-${new Date().getFullYear()}-${String(uid()).slice(0,4).toUpperCase()}`,
      type,
      total,
      status:        "pendiente",
      issueDate:     today(),
      dueDate,
      paidDate:      null,
      period,
      notes,
      autoGenerated: false,
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>

        <div style={{ gridColumn: "span 2" }}>
          <Input label="Cliente" required value={clientId} onChange={setClientId}
            opts={clients.map(c => ({ value: c.id, label: `${c.code} — ${c.name}` }))} />
        </div>

        {client && pkg && (
          <div style={{
            gridColumn: "span 2", background: T.bg, borderRadius: 10,
            padding: "10px 14px", border: `1px solid ${pkg.color}40`,
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <span style={{ fontSize: 13 }}>📦 <b style={{ color: pkg.color }}>{pkg.name}</b></span>
            <span style={{ fontFamily: font, fontSize: 20, fontWeight: 900, color: T.accent }}>
              {formatCurrency(total)}<span style={{ fontSize: 12, color: T.textMuted, fontWeight: 400 }}>/mes</span>
            </span>
          </div>
        )}

        <Input label="Tipo de Documento" value={type} onChange={setType}
          opts={[
            { value: "boleta",  label: "Boleta" },
            { value: "factura", label: "Factura" },
            { value: "recibo",  label: "Recibo Simple" },
          ]} />

        <Input label="Periodo (YYYY-MM)" value={period} onChange={setPeriod} placeholder="2026-04" />

        <Input label="Fecha de Vencimiento" required value={dueDate} onChange={setDueDate} type="date" />

        <div style={{ gridColumn: "span 2" }}>
          <Input label="Notas" value={notes} onChange={setNotes}
            type="textarea" placeholder="Observaciones opcionales..." />
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn onClick={generar}>⚡ Generar Recibo</Btn>
      </div>
    </div>
  );
}

// ── COBRO AUTOMÁTICO ─────────────────────────────────────────────
function CobroAutomatico({ clients, packages, bills, onGenerate, onClose }) {
  const [issueDate, setIssueDate] = useState(today());
  const [dueDate,   setDueDate]   = useState("");
  const [period,    setPeriod]    = useState(new Date().toISOString().slice(0, 7));
  const [type,      setType]      = useState("boleta");
  const [sector,     setSector]     = useState("all");
  const [preview,    setPreview]    = useState(false);

  // Clientes que NO tienen recibo en este periodo
  const eligibles = clients.filter(c => {
    if (sector !== "all" && c.sector !== sector) return false;
    if (c.status === "inactivo" || c.status === "cortado") return false;
    const yaExiste = bills.some(b => b.clientId === c.id && b.period === period);
    return !yaExiste;
  });

  const generar = () => {
    if (!dueDate)           return alert("Selecciona la fecha de vencimiento");
    if (eligibles.length === 0) return alert("Todos los clientes ya tienen recibo este periodo");

    const nuevos = eligibles.map(c => {
      const pkg    = packages.find(p => p.id === c.packageId);
      const total  = pkg?.price || 0;
      const prefix = type === "factura" ? "FAC" : "BOL";
      return {
        id:            uid(),
        clientId:      c.id,
        packageId:     pkg?.id,
        code:          `${prefix}-AUTO-${period}-${c.code}`,
        type,
        total,
        status:        "pendiente",
        issueDate,
        dueDate,
        paidDate:      null,
        period,
        notes:         "Generado automáticamente",
        autoGenerated: true,
      };
    });

    onGenerate(nuevos);
    onClose();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

      {/* Alerta info */}
      <div style={{
        background: T.primaryGlow, border: `1px solid ${T.primary}40`,
        borderRadius: 10, padding: "12px 16px",
        fontSize: 13, color: T.text,
        display: "flex", gap: 10, alignItems: "flex-start",
      }}>
        <span style={{ fontSize: 20 }}>⚡</span>
        <div>
          Genera recibos <strong>automáticamente</strong> para todos los clientes activos
          que aún no tienen recibo en el periodo seleccionado.
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>

        <Input label="Periodo (YYYY-MM)"
          value={period} onChange={setPeriod}
          placeholder="2026-04" />

        <Input label="Fecha de Emisión"
          value={issueDate} onChange={setIssueDate}
          type="date" />

        <Input label="Fecha de Vencimiento" required
          value={dueDate} onChange={setDueDate}
          type="date" />

        <Input label="Tipo de Documento"
          value={type} onChange={setType}
          opts={[
            { value: "boleta",  label: "Boleta" },
            { value: "factura", label: "Factura" },
            { value: "recibo",  label: "Recibo Simple" },
          ]} />

        <Input label="Filtrar por Sector"
          value={sector} onChange={setSector}
          opts={[
            { value: "all", label: "Todos los sectores" },
            ...["A","B","C","D","E"].map(s => ({ value: s, label: `Sector ${s}` })),
          ]} />
      </div>

      {/* Preview clientes */}
      <div>
        <div style={{
          display: "flex", justifyContent: "space-between",
          alignItems: "center", marginBottom: 8,
        }}>
          <span style={{ fontSize: 13, color: T.textMuted }}>
            Se generarán <strong style={{ color: T.accent }}>{eligibles.length}</strong> recibos
          </span>
          <Btn size="sm" variant="ghost" onClick={() => setPreview(!preview)}>
            {preview ? "▲ Ocultar" : "▼ Ver clientes"}
          </Btn>
        </div>

        {preview && (
          <div style={{
            background: T.bg, borderRadius: 8,
            border: `1px solid ${T.border}`,
            maxHeight: 180, overflowY: "auto",
          }}>
            {eligibles.map(c => {
              const pkg = packages.find(p => p.id === c.packageId);
              return (
                <div key={c.id} style={{
                  display: "flex", justifyContent: "space-between",
                  padding: "7px 12px", borderBottom: `1px solid ${T.border}40`,
                  fontSize: 12,
                }}>
                  <span style={{ color: T.text }}>{c.name}</span>
                  <span style={{ color: pkg?.color || T.textMuted }}>{pkg?.name}</span>
                  <span style={{ color: T.accent, fontFamily: font }}>
                    {formatCurrency(pkg?.price || 0)}
                  </span>
                </div>
              );
            })}
            {eligibles.length === 0 && (
              <div style={{ padding: 16, textAlign: "center", color: T.textMuted, fontSize: 12 }}>
                Todos los clientes ya tienen recibo este periodo
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn onClick={generar} disabled={eligibles.length === 0}>
          ⚡ Generar {eligibles.length} Recibos
        </Btn>
      </div>
    </div>
  );
}

// ── MÓDULO PRINCIPAL ─────────────────────────────────────────────
export default function Cobros({ bills, setBills, clients, packages, role, currentUser, config = {} }) {

  const [modal,        setModal]        = useState(null);
  const [printModal,   setPrintModal]   = useState(null);
  const [search,       setSearch]       = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPeriod, setFilterPeriod] = useState("all");

  // Marcar vencidos automáticamente
  useEffect(() => {
    const hoy = today();
    setBills(bs => bs.map(b =>
      b.status === "pendiente" && b.dueDate && b.dueDate < hoy
        ? { ...b, status: "vencido" }
        : b
    ));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const periods = [...new Set(bills.map(b => b.period))].sort().reverse();

  const filtered = bills.filter(b => {
    const c = clients.find(x => x.id === b.clientId);
    if (filterStatus !== "all" && b.status !== filterStatus) return false;
    if (filterPeriod !== "all" && b.period !== filterPeriod) return false;
    const q = search.toLowerCase();
    return !q
      || b.code.toLowerCase().includes(q)
      || c?.name.toLowerCase().includes(q)
      || c?.code.toLowerCase().includes(q);
  });

  const marcarPagado = async (bill) => {
    try {
      const actualizado = await dbRecibos.update(bill.id, { ...bill, status: "pagado", paidDate: today() });
      setBills(bs => bs.map(b => b.id === bill.id ? actualizado : b));
    } catch (e) {
      alert("Error al marcar como pagado. Intenta de nuevo.");
    }
  };

  const eliminar = async (bill) => {
    if (confirm(`¿Eliminar el recibo ${bill.code}?`)) {
      try {
        await dbRecibos.delete(bill.id);
        setBills(bs => bs.filter(b => b.id !== bill.id));
      } catch (e) {
        alert("Error al eliminar. Intenta de nuevo.");
      }
    }
  };

  const enviarWhatsApp = (bill) => {
    const c = clients.find(x => x.id === bill.clientId);
    if (!c?.phone) return alert("El cliente no tiene teléfono registrado.");
    const msg = `Estimado/a *${c.name}*, le informamos que su recibo *${bill.code}* del período *${periodLabel(bill.period)}* por *${formatCurrency(bill.total)}* vence el *${formatDate(bill.dueDate)}*. Por favor acérquese a cancelar. Gracias.`;
    window.open(`https://wa.me/51${c.phone.replace(/\D/g,"")}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const exportar = () => {
    exportarCSV(filtered, [
      { label: "Código",        valor: b => b.code },
      { label: "Cliente",       valor: b => clients.find(c => c.id === b.clientId)?.name || "" },
      { label: "Periodo",       valor: b => periodLabel(b.period) },
      { label: "Total",         valor: b => b.total },
      { label: "Estado",        valor: b => STATUS_BILL[b.status]?.label || b.status },
      { label: "Emisión",       valor: b => b.issueDate },
      { label: "Vencimiento",   valor: b => b.dueDate },
      { label: "Fecha Pago",    valor: b => b.paidDate || "" },
      { label: "Tipo",          valor: b => b.type },
      { label: "Auto",          valor: b => b.autoGenerated ? "Sí" : "No" },
    ], "recibos");
  };

  const totalFiltrado  = filtered.reduce((s, b) => s + b.total, 0);
  const pagadoFiltrado = filtered.filter(b => b.status === "pagado").reduce((s, b) => s + b.total, 0);
  const pendFiltrado   = filtered.filter(b => b.status === "pendiente" || b.status === "vencido").reduce((s, b) => s + b.total, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* Encabezado */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
        <div>
          <h1 style={{ margin: "0 0 2px", fontSize: 22, fontWeight: 800, fontFamily: fontSans }}>
            💰 Cobros y Recibos
          </h1>
          <p style={{ margin: 0, color: T.textMuted, fontSize: 13 }}>
            {bills.length} recibos en total
            {role === "cobrador" && (
              <span style={{ color: T.warning, marginLeft: 8, fontSize: 11 }}>
                👷 Modo Cobrador
              </span>
            )}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn variant="ghost" size="sm" onClick={exportar}>📥 Exportar Excel</Btn>
          <Btn variant="outline" onClick={() => setModal("auto")}>
            ⚡ Cobro Automático
          </Btn>
          <Btn onClick={() => setModal("manual")}>
            + Generar Recibo
          </Btn>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
        <Stat label="Total Facturado" value={formatCurrency(totalFiltrado)}  icon="📋" color="#1A8FE3" />
        <Stat label="Cobrado"         value={formatCurrency(pagadoFiltrado)} icon="✅" color="#00C48C" />
        <Stat label="Por Cobrar"      value={formatCurrency(pendFiltrado)}   icon="⏳" color="#FFB020" />
      </div>

      {/* Filtros */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Buscar código o cliente..."
          style={{
            flex: "1 1 200px", background: T.card,
            border: `1px solid ${T.border}`, borderRadius: 10,
            padding: "9px 14px", color: T.text,
            fontSize: 13, fontFamily: fontSans,
          }}
        />
        <select
          value={filterPeriod}
          onChange={e => setFilterPeriod(e.target.value)}
          style={{
            background: T.card, border: `1px solid ${T.border}`,
            borderRadius: 8, padding: "8px 12px",
            color: T.text, fontSize: 13, fontFamily: fontSans,
          }}
        >
          <option value="all">Todos los periodos</option>
          {periods.map(p => (
            <option key={p} value={p}>{periodLabel(p)}</option>
          ))}
        </select>
        {["all", "pendiente", "pagado", "vencido"].map(s => (
          <Btn
            key={s}
            size="sm"
            variant={filterStatus === s ? "primary" : "ghost"}
            onClick={() => setFilterStatus(s)}
          >
            {s === "all" ? "Todos" : STATUS_BILL[s]?.label}
          </Btn>
        ))}
      </div>

      {/* Tabla */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: fontSans, fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: `2px solid ${T.border}` }}>
              {["Código","Cliente","Periodo","Total","Estado","Vence","Auto","Acciones"].map(h => (
                <th key={h} style={{
                  padding: "10px 12px", textAlign: "left",
                  color: T.textMuted, fontWeight: 600,
                  fontSize: 11, fontFamily: font,
                  textTransform: "uppercase", letterSpacing: 0.5,
                  whiteSpace: "nowrap",
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(b => {
              const c   = clients.find(x => x.id === b.clientId);
              const pkg = packages.find(p => p.id === b.packageId);
              const sc  = STATUS_BILL[b.status];
              return (
                <tr key={b.id}
                  style={{ borderBottom: `1px solid ${T.border}40`, transition: "background .1s" }}
                  onMouseEnter={e => e.currentTarget.style.background = T.surface}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <td style={{ padding: "10px 12px", fontFamily: font, color: T.primary, fontSize: 11 }}>
                    {b.code}
                  </td>
                  <td style={{ padding: "10px 12px" }}>
                    <div style={{ fontWeight: 600 }}>{c?.name?.split(" ").slice(0,2).join(" ")}</div>
                    <div style={{ fontSize: 10, color: T.textMuted }}>{c?.code}</div>
                  </td>
                  <td style={{ padding: "10px 12px", color: T.textMuted, fontSize: 12 }}>
                    {periodLabel(b.period)}
                  </td>
                  <td style={{ padding: "10px 12px", fontFamily: font, fontWeight: 700, color: "#00D4FF" }}>
                    {formatCurrency(b.total)}
                  </td>
                  <td style={{ padding: "10px 12px" }}>
                    <Chip label={sc?.label} color={sc?.color} bg={sc?.bg} />
                  </td>
                  <td style={{ padding: "10px 12px", fontSize: 11, color: T.textMuted }}>
                    {formatDate(b.dueDate)}
                  </td>
                  <td style={{ padding: "10px 12px", fontSize: 11, textAlign: "center" }}>
                    {b.autoGenerated ? (
                      <span style={{ color: T.accent }}>⚡</span>
                    ) : (
                      <span style={{ color: T.textDim }}>—</span>
                    )}
                  </td>
                  <td style={{ padding: "10px 12px" }}>
                    <div style={{ display: "flex", gap: 5 }}>
                      {b.status !== "pagado" && (
                        <Btn size="sm" variant="success" onClick={() => marcarPagado(b)}>✓</Btn>
                      )}
                      {b.status !== "pagado" && (
                        <Btn size="sm" variant="ghost" onClick={() => enviarWhatsApp(b)} title="Recordatorio WhatsApp">💬</Btn>
                      )}
                      <Btn size="sm" variant="ghost"
                        onClick={() => setPrintModal({ bill: b, client: c, pkg, format: "ticket" })}>
                        🎫
                      </Btn>
                      <Btn size="sm" variant="ghost"
                        onClick={() => setPrintModal({ bill: b, client: c, pkg, format: b.type === "factura" ? "factura" : "a4" })}>
                        A4
                      </Btn>
                      <Btn size="sm" variant="danger" onClick={() => eliminar(b)}>🗑️</Btn>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: 50, color: T.textMuted }}>
            No se encontraron recibos
          </div>
        )}
      </div>

      {/* Modal cobro manual */}
      {modal === "manual" && (
        <Modal title="⚡ Generar Recibo Manual" onClose={() => setModal(null)} width={620}>
          <CobroForm
            clients={clients}
            packages={packages}
            onSave={async b => {
              try {
                const nuevo = await dbRecibos.create(b);
                setBills(bs => [...bs, nuevo]);
                setModal(null);
              } catch (e) {
                alert("Error al guardar recibo. Intenta de nuevo.");
              }
            }}
            onClose={() => setModal(null)}
          />
        </Modal>
      )}

      {/* Modal cobro automático */}
      {modal === "auto" && (
        <Modal title="⚡ Cobro Automático por Fecha" onClose={() => setModal(null)} width={600}>
          <CobroAutomatico
            clients={clients}
            packages={packages}
            bills={bills}
            onGenerate={async nuevos => {
              try {
                const creados = await dbRecibos.createMany(nuevos);
                setBills(bs => [...bs, ...creados]);
              } catch (e) {
                alert("Error al generar recibos. Intenta de nuevo.");
              }
            }}
            onClose={() => setModal(null)}
          />
        </Modal>
      )}

      {/* Imprimir */}
      {printModal && (
        <Imprimir
          {...printModal}
          config={config}
          onClose={() => setPrintModal(null)}
        />
      )}
    </div>
  );
}