import { useState } from "react";
import { T, font, fontSans, uid, today, formatCurrency, formatDate, periodLabel } from "../App";
import { Btn, Input, Modal, Chip, Card, Stat } from "./Compartidos";

// ── CATEGORÍAS DE GASTOS ─────────────────────────────────────────
const CATEGORIAS = {
  materiales:    { label: "Materiales",     icon: "🔩", color: "#FFB020" },
  personal:      { label: "Personal",       icon: "👷", color: "#1A8FE3" },
  transporte:    { label: "Transporte",     icon: "🚗", color: "#00D4FF" },
  mantenimiento: { label: "Mantenimiento",  icon: "⚙️", color: "#FF4757" },
  servicios:     { label: "Servicios",      icon: "💡", color: "#A78BFA" },
  otros:         { label: "Otros",          icon: "📦", color: "#6B8FAF" },
};

// ── FORMULARIO GASTO ─────────────────────────────────────────────
function GastoForm({ initial, onSave, onClose }) {
  const [f, setF] = useState(initial || {
    concepto:  "",
    monto:     "",
    fecha:     today(),
    categoria: "materiales",
    notas:     "",
  });
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));

  const guardar = () => {
    if (!f.concepto.trim()) return alert("El concepto es obligatorio");
    if (!f.monto)           return alert("El monto es obligatorio");
    onSave({ ...f, monto: parseFloat(f.monto) || 0 });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>

        <div style={{ gridColumn: "span 2" }}>
          <Input label="Concepto" required
            value={f.concepto} onChange={v => set("concepto", v)}
            placeholder="Ej: Compra de tuberías PVC" />
        </div>

        <Input label="Monto (S/)" required
          value={f.monto} onChange={v => set("monto", v)}
          type="number" placeholder="0.00" />

        <Input label="Fecha"
          value={f.fecha} onChange={v => set("fecha", v)}
          type="date" />

        <Input label="Categoría"
          value={f.categoria} onChange={v => set("categoria", v)}
          opts={Object.entries(CATEGORIAS).map(([v, c]) => ({ value: v, label: `${c.icon} ${c.label}` }))} />

        <div style={{ gridColumn: "span 2" }}>
          <Input label="Notas"
            value={f.notas} onChange={v => set("notas", v)}
            type="textarea" placeholder="Observaciones opcionales..." />
        </div>
      </div>

      {/* Preview */}
      {f.concepto && f.monto && (
        <div style={{
          background: T.bg, borderRadius: 10,
          padding: "12px 16px",
          border: `1px solid ${CATEGORIAS[f.categoria]?.color}30`,
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <span style={{ fontSize: 22 }}>{CATEGORIAS[f.categoria]?.icon}</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{f.concepto}</div>
              <div style={{ fontSize: 11, color: T.textMuted }}>{formatDate(f.fecha)} · {CATEGORIAS[f.categoria]?.label}</div>
            </div>
          </div>
          <span style={{ fontFamily: font, fontSize: 18, fontWeight: 800, color: T.danger }}>
            -{formatCurrency(f.monto)}
          </span>
        </div>
      )}

      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn onClick={guardar}>💾 Guardar Gasto</Btn>
      </div>
    </div>
  );
}

// ── BARRA MINI ───────────────────────────────────────────────────
function BarraMini({ valor, maximo, color }) {
  const pct = maximo > 0 ? Math.min((valor / maximo) * 100, 100) : 0;
  return (
    <div style={{ height: 6, background: T.border, borderRadius: 3, overflow: "hidden" }}>
      <div style={{
        height: 6, width: `${pct}%`, background: color,
        borderRadius: 3, transition: "width .5s ease",
        boxShadow: `0 0 8px ${color}60`,
      }} />
    </div>
  );
}

// ── MÓDULO PRINCIPAL ─────────────────────────────────────────────
export default function Finanzas({ bills, gastos, setGastos, role, clients = [] }) {
  const [modal,        setModal]        = useState(null);
  const [tabActual,    setTabActual]    = useState("resumen");
  const [periodoFiltro,setPeriodoFiltro]= useState(new Date().toISOString().slice(0, 7));
  const [filterCat,    setFilterCat]   = useState("all");

  // ── CÁLCULOS ──
  const hoy = today();

  // Ingresos del día
  const ingresosDia = bills
    .filter(b => b.status === "pagado" && b.paidDate === hoy)
    .reduce((s, b) => s + b.total, 0);

  const cobrosDia = bills.filter(b => b.status === "pagado" && b.paidDate === hoy);

  // Ingresos del mes seleccionado
  const ingresosMes = bills
    .filter(b => b.status === "pagado" && b.period === periodoFiltro)
    .reduce((s, b) => s + b.total, 0);

  // Gastos del mes seleccionado
  const gastosMes = gastos
    .filter(g => g.fecha.slice(0, 7) === periodoFiltro)
    .reduce((s, g) => s + g.monto, 0);

  const gastosDia = gastos
    .filter(g => g.fecha === hoy)
    .reduce((s, g) => s + g.monto, 0);

  const balanceMes = ingresosMes - gastosMes;
  const balanceDia = ingresosDia - gastosDia;

  // Gastos filtrados
  const gastosDelMes = gastos
    .filter(g => g.fecha.slice(0, 7) === periodoFiltro)
    .filter(g => filterCat === "all" || g.categoria === filterCat)
    .sort((a, b) => b.fecha.localeCompare(a.fecha));

  // Gastos por categoría
  const porCategoria = Object.entries(CATEGORIAS).map(([k, v]) => {
    const total = gastos
      .filter(g => g.categoria === k && g.fecha.slice(0, 7) === periodoFiltro)
      .reduce((s, g) => s + g.monto, 0);
    return { key: k, ...v, total };
  }).filter(c => c.total > 0).sort((a, b) => b.total - a.total);

  const maxGasto = Math.max(...porCategoria.map(c => c.total), 1);

  // Periodos disponibles
  const periodos = [...new Set([
    ...bills.map(b => b.period),
    ...gastos.map(g => g.fecha.slice(0, 7)),
  ])].sort().reverse();

  const guardar = (f) => {
    if (modal === "new") {
      setGastos(gs => [...gs, { ...f, id: uid() }]);
    } else {
      setGastos(gs => gs.map(g => g.id === modal.id ? { ...modal, ...f } : g));
    }
    setModal(null);
  };

  const eliminar = (g) => {
    if (confirm(`¿Eliminar el gasto "${g.concepto}"?`))
      setGastos(gs => gs.filter(x => x.id !== g.id));
  };

  // Tabs
  const tabs = [
    { id: "resumen",  label: "📊 Resumen"     },
    { id: "ingresos", label: "💰 Ingresos"    },
    { id: "gastos",   label: "💸 Gastos"      },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      {/* Encabezado */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
        <div>
          <h1 style={{ margin: "0 0 2px", fontSize: 22, fontWeight: 800, fontFamily: fontSans }}>
            📈 Finanzas
          </h1>
          <p style={{ margin: 0, color: T.textMuted, fontSize: 13 }}>
            Ingresos y gastos del sistema
            {role === "cobrador" && (
              <span style={{ color: T.warning, marginLeft: 8, fontSize: 11 }}>
                👷 Modo Cobrador — solo lectura de gastos
              </span>
            )}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <select
            value={periodoFiltro}
            onChange={e => setPeriodoFiltro(e.target.value)}
            style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, padding: "8px 12px", color: T.text, fontSize: 13, fontFamily: fontSans }}
          >
            {periodos.map(p => <option key={p} value={p}>{periodLabel(p)}</option>)}
          </select>
          {role === "admin" && (
            <Btn onClick={() => setModal("new")}>+ Agregar Gasto</Btn>
          )}
        </div>
      </div>

      {/* Stats del día */}
      <div>
        <div style={{ fontSize: 11, color: T.textMuted, fontFamily: font, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 10 }}>
          ☀️ Hoy — {formatDate(hoy)}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          <Stat label="Ingresos del Día"  value={formatCurrency(ingresosDia)} icon="💰" color={T.success} sub={`${cobrosDia.length} cobros`} />
          <Stat label="Gastos del Día"    value={formatCurrency(gastosDia)}   icon="💸" color={T.danger}  />
          <Stat label="Balance del Día"   value={formatCurrency(balanceDia)}  icon={balanceDia >= 0 ? "📈" : "📉"} color={balanceDia >= 0 ? T.success : T.danger} />
        </div>
      </div>

      {/* Stats del mes */}
      <div>
        <div style={{ fontSize: 11, color: T.textMuted, fontFamily: font, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 10 }}>
          📅 {periodLabel(periodoFiltro)}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          <Stat label="Ingresos del Mes"  value={formatCurrency(ingresosMes)} icon="✅" color={T.primary} />
          <Stat label="Gastos del Mes"    value={formatCurrency(gastosMes)}   icon="💸" color={T.danger}  />
          <Stat label="Balance del Mes"   value={formatCurrency(balanceMes)}  icon={balanceMes >= 0 ? "🏦" : "⚠️"} color={balanceMes >= 0 ? T.success : T.danger} />
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, borderBottom: `1px solid ${T.border}`, paddingBottom: 0 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTabActual(t.id)} style={{
            background: "transparent",
            border: "none",
            borderBottom: tabActual === t.id ? `2px solid ${T.primary}` : "2px solid transparent",
            padding: "10px 16px", marginBottom: -1,
            color: tabActual === t.id ? T.primary : T.textMuted,
            cursor: "pointer", fontSize: 13, fontWeight: tabActual === t.id ? 700 : 400,
            fontFamily: fontSans, transition: "all .15s",
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── TAB RESUMEN ── */}
      {tabActual === "resumen" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>

          {/* Gauge balance */}
          <Card style={{ padding: 20, gridColumn: "span 2" }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 16, fontFamily: fontSans }}>
              ⚖️ Balance del Mes — {periodLabel(periodoFiltro)}
            </div>
            <div style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
              {/* Barra comparativa */}
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: T.textMuted, marginBottom: 6 }}>
                  <span>💰 Ingresos</span>
                  <span style={{ color: T.success, fontFamily: font, fontWeight: 700 }}>{formatCurrency(ingresosMes)}</span>
                </div>
                <BarraMini valor={ingresosMes} maximo={Math.max(ingresosMes, gastosMes)} color={T.success} />

                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: T.textMuted, marginBottom: 6, marginTop: 12 }}>
                  <span>💸 Gastos</span>
                  <span style={{ color: T.danger, fontFamily: font, fontWeight: 700 }}>{formatCurrency(gastosMes)}</span>
                </div>
                <BarraMini valor={gastosMes} maximo={Math.max(ingresosMes, gastosMes)} color={T.danger} />
              </div>

              {/* Balance grande */}
              <div style={{
                background: T.bg, borderRadius: 14,
                padding: "20px 28px", textAlign: "center",
                border: `1px solid ${balanceMes >= 0 ? T.success : T.danger}40`,
                minWidth: 160,
              }}>
                <div style={{ fontSize: 11, color: T.textMuted, fontFamily: font, textTransform: "uppercase", letterSpacing: 0.6 }}>
                  Balance Neto
                </div>
                <div style={{ fontFamily: font, fontSize: 26, fontWeight: 900, color: balanceMes >= 0 ? T.success : T.danger, marginTop: 6 }}>
                  {formatCurrency(Math.abs(balanceMes))}
                </div>
                <div style={{ fontSize: 12, color: balanceMes >= 0 ? T.success : T.danger, marginTop: 4 }}>
                  {balanceMes >= 0 ? "📈 Ganancia" : "📉 Pérdida"}
                </div>
              </div>
            </div>
          </Card>

          {/* Gastos por categoría */}
          <Card style={{ padding: 18 }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14, fontFamily: fontSans }}>
              📊 Gastos por Categoría
            </div>
            {porCategoria.length === 0 ? (
              <div style={{ color: T.textMuted, fontSize: 13, padding: "20px 0" }}>
                Sin gastos este periodo
              </div>
            ) : (
              porCategoria.map(c => (
                <div key={c.key} style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <span style={{ fontSize: 15 }}>{c.icon}</span>
                      <span style={{ fontSize: 12, color: T.text }}>{c.label}</span>
                    </div>
                    <span style={{ fontFamily: font, fontSize: 12, fontWeight: 700, color: c.color }}>
                      {formatCurrency(c.total)}
                    </span>
                  </div>
                  <BarraMini valor={c.total} maximo={maxGasto} color={c.color} />
                </div>
              ))
            )}
          </Card>

          {/* Cobros del día */}
          <Card style={{ padding: 18 }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14, fontFamily: fontSans }}>
              ☀️ Cobros de Hoy
            </div>
            {cobrosDia.length === 0 ? (
              <div style={{ color: T.textMuted, fontSize: 13, padding: "20px 0" }}>
                Sin cobros registrados hoy
              </div>
            ) : (
              cobrosDia.map(b => (
                <div key={b.id} style={{
                  display: "flex", justifyContent: "space-between",
                  alignItems: "center", padding: "7px 0",
                  borderBottom: `1px solid ${T.border}40`,
                }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{b.code}</div>
                    <div style={{ fontSize: 10, color: T.textMuted }}>{periodLabel(b.period)}</div>
                  </div>
                  <span style={{ fontFamily: font, fontSize: 13, fontWeight: 700, color: T.success }}>
                    +{formatCurrency(b.total)}
                  </span>
                </div>
              ))
            )}
            {cobrosDia.length > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, paddingTop: 8, borderTop: `1px solid ${T.border}` }}>
                <span style={{ fontSize: 12, color: T.textMuted }}>Total del día</span>
                <span style={{ fontFamily: font, fontWeight: 800, color: T.success }}>{formatCurrency(ingresosDia)}</span>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ── TAB INGRESOS ── */}
      {tabActual === "ingresos" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: fontSans, fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                  {["Código", "Cliente", "Periodo", "Fecha Pago", "Monto"].map(h => (
                    <th key={h} style={{ padding: "10px 12px", textAlign: "left", color: T.textMuted, fontWeight: 600, fontSize: 11, fontFamily: font, textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bills
                  .filter(b => b.status === "pagado" && b.period === periodoFiltro)
                  .sort((a, b) => (b.paidDate || "").localeCompare(a.paidDate || ""))
                  .map(b => (
                    <tr key={b.id}
                      style={{ borderBottom: `1px solid ${T.border}40` }}
                      onMouseEnter={e => e.currentTarget.style.background = T.surface}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      <td style={{ padding: "10px 12px", fontFamily: font, color: T.primary, fontSize: 11 }}>{b.code}</td>
                      <td style={{ padding: "10px 12px", color: T.text, fontSize: 12 }}>
                        {clients.find(c => c.id === b.clientId)?.name || "—"}
                      </td>
                      <td style={{ padding: "10px 12px", color: T.textMuted, fontSize: 12 }}>{periodLabel(b.period)}</td>
                      <td style={{ padding: "10px 12px", color: T.textMuted, fontSize: 12 }}>
                        <span style={{ color: b.paidDate === hoy ? T.success : T.textMuted }}>
                          {b.paidDate === hoy && "☀️ "}{formatDate(b.paidDate)}
                        </span>
                      </td>
                      <td style={{ padding: "10px 12px", fontFamily: font, fontWeight: 700, color: T.success }}>
                        +{formatCurrency(b.total)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
            {bills.filter(b => b.status === "pagado" && b.period === periodoFiltro).length === 0 && (
              <div style={{ textAlign: "center", padding: 40, color: T.textMuted }}>
                Sin ingresos este periodo
              </div>
            )}
          </div>

          {/* Total */}
          <div style={{
            background: T.card, borderRadius: 10,
            padding: "14px 20px",
            display: "flex", justifyContent: "space-between", alignItems: "center",
            border: `1px solid ${T.success}30`,
          }}>
            <span style={{ fontSize: 13, color: T.textMuted }}>
              Total ingresos — {periodLabel(periodoFiltro)}
            </span>
            <span style={{ fontFamily: font, fontSize: 20, fontWeight: 800, color: T.success }}>
              {formatCurrency(ingresosMes)}
            </span>
          </div>
        </div>
      )}

      {/* ── TAB GASTOS ── */}
      {tabActual === "gastos" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

          {/* Filtro categoría */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Btn size="sm" variant={filterCat === "all" ? "primary" : "ghost"} onClick={() => setFilterCat("all")}>
              Todos
            </Btn>
            {Object.entries(CATEGORIAS).map(([k, v]) => (
              <Btn key={k} size="sm" variant={filterCat === k ? "primary" : "ghost"} onClick={() => setFilterCat(k)}>
                {v.icon} {v.label}
              </Btn>
            ))}
          </div>

          {/* Lista gastos */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {gastosDelMes.map(g => {
              const cat = CATEGORIAS[g.categoria];
              return (
                <Card key={g.id} style={{
                  padding: "14px 16px",
                  borderLeft: `3px solid ${cat?.color || T.border}`,
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <span style={{ fontSize: 22 }}>{cat?.icon}</span>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13, color: T.text }}>{g.concepto}</div>
                      <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>
                        {formatDate(g.fecha)} ·
                        <span style={{ color: cat?.color, marginLeft: 4 }}>{cat?.label}</span>
                        {g.notas && <span style={{ marginLeft: 6 }}>· {g.notas}</span>}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontFamily: font, fontSize: 16, fontWeight: 800, color: T.danger }}>
                      -{formatCurrency(g.monto)}
                    </span>
                    {role === "admin" && (
                      <div style={{ display: "flex", gap: 6 }}>
                        <Btn size="sm" variant="ghost"  onClick={() => setModal(g)}>✏️</Btn>
                        <Btn size="sm" variant="danger" onClick={() => eliminar(g)}>🗑️</Btn>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}

            {gastosDelMes.length === 0 && (
              <div style={{ textAlign: "center", padding: 40, color: T.textMuted }}>
                Sin gastos registrados este periodo
              </div>
            )}
          </div>

          {/* Total gastos */}
          {gastosDelMes.length > 0 && (
            <div style={{
              background: T.card, borderRadius: 10,
              padding: "14px 20px",
              display: "flex", justifyContent: "space-between", alignItems: "center",
              border: `1px solid ${T.danger}30`,
            }}>
              <span style={{ fontSize: 13, color: T.textMuted }}>
                Total gastos — {periodLabel(periodoFiltro)}
              </span>
              <span style={{ fontFamily: font, fontSize: 20, fontWeight: 800, color: T.danger }}>
                -{formatCurrency(gastosMes)}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Modal gasto */}
      {modal && role === "admin" && (
        <Modal
          title={modal === "new" ? "➕ Nuevo Gasto" : `✏️ Editar — ${modal.concepto}`}
          onClose={() => setModal(null)}
          width={520}
        >
          <GastoForm
            initial={modal !== "new" ? modal : null}
            onSave={guardar}
            onClose={() => setModal(null)}
          />
        </Modal>
      )}
    </div>
  );
}